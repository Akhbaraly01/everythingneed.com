<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\Needs\Entities\FraudFlag;
use Modules\Needs\Entities\NeedBooking;
use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedItem;
use Modules\Needs\Entities\NeedOffer;
use Modules\Needs\Entities\NeedProviderProfile;
use Modules\Needs\Entities\NeedRequest;
use Modules\Needs\Entities\NeedRequestEvent;
use Modules\Needs\Entities\TaskApplication;
use Modules\Needs\Entities\TaskPost;
use Modules\Needs\Services\NeedsFraudScanner;
use Modules\Orders\Entities\Dispute;

/**
 * AdminNeedsController — moderation endpoints for the Needs domain.
 *
 * Authorization is route-level only (permission: middleware in
 * Modules/Admin/Routes/api.php); row scoping is unnecessary here because
 * every row is platform-visible to moderators by design.
 *
 * Reads: paginated lists + detail for requests/offers/tasks/applications/
 * disputes/fraud-flags.
 * Writes: reject/expire/refund delegate to NeedRequestController::transition
 * (single state-machine owner), task cancel/restore, offer delete, dispute
 * resolve/assign, fraud-flag decide. Moderation writes record NeedRequestEvent
 * rows or dispute resolution fields so the audit trail stays complete.
 */
class AdminNeedsController extends Controller
{
    public function __construct(
        private NeedsFraudScanner $fraudScanner,
        private NotificationService $notifications,
    ) {}

    /**
     * GET /api/admin/needs/overview — §28 operational metrics. Every figure
     * is a live count over authorized rows (no fabrication, no financials
     * beyond what needs.* already governs).
     */
    public function overview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'category_id' => ['nullable', 'string'],
        ]);

        $scoped = fn ($q) => $q
            ->when($validated['date_from'] ?? null, fn ($w, $d) => $w->whereDate('created_at', '>=', $d))
            ->when($validated['date_to'] ?? null, fn ($w, $d) => $w->whereDate('created_at', '<=', $d))
            ->when($validated['category_id'] ?? null, fn ($w, $id) => $w->where('category_id', $id));

        $byStatus = $scoped(NeedRequest::query())->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');

        $attention = [
            'requests_pending' => (int) ($byStatus[NeedRequest::STATUS_PENDING] ?? 0),
            'requests_disputed' => (int) ($byStatus[NeedRequest::STATUS_DISPUTED] ?? 0),
            'requests_unmatched' => $scoped(NeedRequest::query())
                ->whereIn('status', [NeedRequest::STATUS_PUBLISHED, NeedRequest::STATUS_REVIEWING])
                ->whereNotExists(function ($q) {
                    $q->selectRaw('1')->from('need_offers')
                        ->whereColumn('need_offers.need_request_id', 'need_requests.id')
                        ->whereNull('need_offers.deleted_at');
                })->count(),
            'profiles_submitted' => NeedProviderProfile::where('status', NeedProviderProfile::STATUS_SUBMITTED)->count(),
            'listings_submitted' => NeedItem::where('status', NeedItem::STATUS_SUBMITTED)->count(),
            'disputes_open' => Dispute::where('status', 'open')
                ->where(fn ($w) => $w->whereNotNull('need_request_id')->orWhereNotNull('task_id'))->count(),
            'fraud_open' => FraudFlag::where('status', FraudFlag::STATUS_OPEN)->count(),
            'bookings_upcoming_7d' => NeedBooking::where('status', NeedBooking::STATUS_SCHEDULED)
                ->whereBetween('scheduled_start', [now(), now()->addDays(7)])->count(),
            'bookings_overdue' => NeedBooking::where('status', NeedBooking::STATUS_SCHEDULED)
                ->where('scheduled_end', '<', now())->count(),
            'tasks_open' => TaskPost::where('status', TaskPost::STATUS_OPEN)->count(),
        ];

        $completed30d = $scoped(NeedRequest::query())
            ->where('status', NeedRequest::STATUS_COMPLETED)
            ->where('created_at', '>=', now()->subDays(30))
            ->count();

        $cancellations = NeedRequest::selectRaw("to_char(created_at, 'IYYY-IW') as week, count(*) as total")
            ->where('status', NeedRequest::STATUS_CANCELLED)
            ->where('created_at', '>=', now()->subWeeks(8))
            ->groupBy('week')
            ->orderBy('week')
            ->get();

        return response()->json([
            'data' => [
                'attention' => $attention,
                'requests_by_status' => $byStatus,
                'completed_30d' => $completed30d,
                'cancellations_8w' => $cancellations,
            ],
        ]);
    }

    /**
     * GET /api/admin/needs/requests
     */
    public function requestsIndex(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'in:' . implode(',', [
                NeedRequest::STATUS_DRAFT,
                NeedRequest::STATUS_PENDING,
                NeedRequest::STATUS_PUBLISHED,
                NeedRequest::STATUS_REVIEWING,
                NeedRequest::STATUS_OFFERED,
                NeedRequest::STATUS_NEGOTIATING,
                NeedRequest::STATUS_ACCEPTED,
                NeedRequest::STATUS_PAYMENT_PENDING,
                NeedRequest::STATUS_PAID,
                NeedRequest::STATUS_IN_PROGRESS,
                NeedRequest::STATUS_FULFILLED,
                NeedRequest::STATUS_COMPLETED,
                NeedRequest::STATUS_CANCELLED,
                NeedRequest::STATUS_REJECTED,
                NeedRequest::STATUS_EXPIRED,
                NeedRequest::STATUS_DISPUTED,
                NeedRequest::STATUS_REFUNDED,
            ])],
            'user_id' => ['nullable', 'string'],
            'category_id' => ['nullable', 'string'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = NeedRequest::with(['user', 'category', 'acceptedOffer.provider'])
            ->when($validated['search'] ?? null, fn ($q, $s) => $q->where(function ($w) use ($s) {
                $w->where('title', 'like', "%{$s}%")
                    ->orWhere('description', 'like', "%{$s}%")
                    ->orWhere('request_number', 'like', "%{$s}%");
            }))
            ->when($validated['status'] ?? null, fn ($q, $s) => $q->where('status', $s))
            ->when($validated['user_id'] ?? null, fn ($q, $id) => $q->where('user_id', $id))
            ->when($validated['category_id'] ?? null, fn ($q, $id) => $q->where('category_id', $id))
            ->when($validated['date_from'] ?? null, fn ($q, $d) => $q->whereDate('created_at', '>=', $d))
            ->when($validated['date_to'] ?? null, fn ($q, $d) => $q->whereDate('created_at', '<=', $d))
            ->orderByDesc('created_at');

        $paginated = $query->paginate($validated['per_page'] ?? 20);

        return response()->json([
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    /**
     * GET /api/admin/needs/requests/{id}
     */
    public function requestsShow(Request $request, string $id): JsonResponse
    {
        $requestModel = NeedRequest::with([
            'user', 'category', 'acceptedOffer.provider',
            'offers.provider', 'events.actor', 'disputes.user',
        ])->find($id);

        if (! $requestModel) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        return response()->json(['data' => $requestModel]);
    }

    /**
     * POST /api/admin/needs/requests/{id}/moderate
     *
     * Moderator actions only (reject/expire/refund). Delegates to the single
     * state-machine owner so admin moderation can never drift from the rules
     * customers and providers already face; the transition endpoint derives
     * moderator powers from the caller's roles.
     */
    public function requestsModerate(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'string', 'in:reject,expire,refund'],
            'note' => ['nullable', 'string', 'max:2000'],
        ]);

        $needRequest = NeedRequest::find($id);
        if (! $needRequest) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        if ($validated['note'] ?? null) {
            NeedRequestEvent::create([
                'need_request_id' => $needRequest->id,
                'actor_id' => $request->user()->id,
                'from_status' => $needRequest->status,
                'to_status' => $needRequest->status,
                'action' => 'moderator_note',
                'note' => $validated['note'],
            ]);
        }

        return app(\Modules\Needs\Http\Controllers\NeedRequestController::class)
            ->transition($request, $id, $validated['action']);
    }

    /**
     * GET /api/admin/needs/offers
     */
    public function offersIndex(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'in:pending,accepted,rejected,withdrawn,expired'],
            'request_id' => ['nullable', 'string'],
            'provider_id' => ['nullable', 'string'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = NeedOffer::with(['request.user', 'provider', 'request.category'])
            ->when($validated['search'] ?? null, fn ($q, $s) => $q->where('message', 'like', "%{$s}%"))
            ->when($validated['status'] ?? null, fn ($q, $s) => $q->where('status', $s))
            ->when($validated['request_id'] ?? null, fn ($q, $id) => $q->where('need_request_id', $id))
            ->when($validated['provider_id'] ?? null, fn ($q, $id) => $q->where('provider_id', $id))
            ->orderByDesc('created_at');

        $paginated = $query->paginate($validated['per_page'] ?? 20);

        return response()->json([
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    /**
     * DELETE /api/admin/needs/offers/{id}
     *
     * Removes an abusive offer. Accepted offers are protected: the request's
     * acceptedOffer link (and any escrow tied to it) must survive, so those
     * return 422 and stay visible for the refund flow instead.
     */
    public function offersDestroy(Request $request, string $id): JsonResponse
    {
        $offer = NeedOffer::find($id);
        if (! $offer) {
            return response()->json(['message' => 'Offer not found'], 404);
        }

        if ($offer->status === NeedOffer::STATUS_ACCEPTED) {
            return response()->json(['message' => 'Accepted offers cannot be deleted; use the request refund flow'], 422);
        }

        $offer->delete();

        return response()->json(['message' => 'Offer deleted']);
    }

    /**
     * GET /api/admin/needs/tasks
     */
    public function tasksIndex(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'in:' . implode(',', [
                TaskPost::STATUS_OPEN,
                TaskPost::STATUS_ASSIGNED,
                TaskPost::STATUS_IN_REVIEW,
                TaskPost::STATUS_COMPLETED,
                TaskPost::STATUS_CANCELLED,
            ])],
            'created_by' => ['nullable', 'string'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = TaskPost::with(['owner', 'assignedApplication.worker'])
            ->withCount('applications')
            ->when($validated['search'] ?? null, fn ($q, $s) => $q->where(function ($w) use ($s) {
                $w->where('title', 'like', "%{$s}%")
                    ->orWhere('description', 'like', "%{$s}%");
            }))
            ->when($validated['status'] ?? null, fn ($q, $s) => $q->where('status', $s))
            ->when($validated['created_by'] ?? null, fn ($q, $id) => $q->where('created_by', $id))
            ->orderByDesc('created_at');

        $paginated = $query->paginate($validated['per_page'] ?? 20);

        return response()->json([
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    /**
     * POST /api/admin/needs/tasks/{id}/cancel
     */
    public function tasksCancel(Request $request, string $id): JsonResponse
    {
        $task = TaskPost::find($id);
        if (! $task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        if (! in_array($task->status, [
            TaskPost::STATUS_OPEN,
            TaskPost::STATUS_ASSIGNED,
            TaskPost::STATUS_IN_REVIEW,
        ], true)) {
            return response()->json(['message' => "Cannot cancel task in status '{$task->status}'"], 422);
        }

        $task->update(['status' => TaskPost::STATUS_CANCELLED]);

        if ($task->assigned_application_id) {
            $application = TaskApplication::find($task->assigned_application_id);
            if ($application) {
                $this->notifications->notify(
                    (string) $application->user_id,
                    'Task cancelled',
                    "'{$task->title}' has been cancelled by the moderation team.",
                    'task_cancelled',
                    $task->id
                );
            }
        }

        return response()->json([
            'message' => 'Task cancelled',
            'data' => $task->fresh(),
        ]);
    }

    /**
     * POST /api/admin/needs/tasks/{id}/restore
     */
    public function tasksRestore(Request $request, string $id): JsonResponse
    {
        $task = TaskPost::find($id);
        if (! $task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        if ($task->status !== TaskPost::STATUS_CANCELLED) {
            return response()->json(['message' => 'Only cancelled tasks can be restored'], 422);
        }

        $task->update(['status' => TaskPost::STATUS_OPEN]);

        return response()->json([
            'message' => 'Task restored',
            'data' => $task->fresh(),
        ]);
    }

    /**
     * GET /api/admin/needs/tasks/{id}/applications
     *
     * (Approve/reject reuses the existing task-applications endpoint: it
     * already treats admins as owners, so no duplicate logic here.)
     */
    public function tasksApplications(Request $request, string $id): JsonResponse
    {
        $task = TaskPost::find($id);
        if (! $task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        $applications = TaskApplication::with('worker')
            ->where('task_post_id', $id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $applications]);
    }

    /**
     * GET /api/admin/needs/disputes — needs/task-scoped cases only, so the
     * order dispute queue stays untouched.
     */
    public function disputesIndex(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
              'status' => ['nullable', 'string', 'in:open,in_review,resolved,closed'],
            'context' => ['nullable', 'string', 'in:need,task'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = Dispute::with(['user', 'assignee', 'needRequest', 'task'])
            ->where(function ($w) {
                $w->whereNotNull('need_request_id')
                    ->orWhereNotNull('task_id');
            })
            ->when($validated['search'] ?? null, fn ($q, $s) => $q->where(function ($w) use ($s) {
                $w->where('subject', 'like', "%{$s}%")
                    ->orWhere('description', 'like', "%{$s}%");
            }))
            ->when($validated['status'] ?? null, fn ($q, $s) => $q->where('status', $s))
            ->when($validated['context'] ?? null, fn ($q, $c) => $c->whereNotNull($c === 'need' ? 'need_request_id' : 'task_id'))
            ->orderByDesc('created_at');

        $paginated = $query->paginate($validated['per_page'] ?? 20);

        return response()->json([
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    /**
     * GET /api/admin/needs/disputes/{id}
     */
    public function disputesShow(Request $request, string $id): JsonResponse
    {
        $dispute = Dispute::with(['user', 'assignee', 'needRequest.user', 'task.owner', 'evidence.uploader'])
            ->where(function ($w) {
                $w->whereNotNull('need_request_id')
                    ->orWhereNotNull('task_id');
            })
            ->find($id);

        if (! $dispute) {
            return response()->json(['message' => 'Dispute not found'], 404);
        }

        return response()->json(['data' => $dispute]);
    }

    /**
     * POST /api/admin/needs/disputes/{id}/assign
     */
    public function disputesAssign(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'assigned_to' => ['required', 'uuid', 'exists:users,id'],
        ]);

        $dispute = $this->findNeedsDispute($id);
        if (! $dispute) {
            return response()->json(['message' => 'Dispute not found'], 404);
        }

        $dispute->update([
            'assigned_to' => $validated['assigned_to'],
            // The disputes.status enum accepts 'in_review' (not
            // 'under_review'), so the assignment must write the enum value.
            'status' => $dispute->status === 'open' ? 'in_review' : $dispute->status,
        ]);

        return response()->json([
            'message' => 'Dispute assigned',
            'data' => $dispute->fresh(['user', 'assignee']),
        ]);
    }

    /**
     * POST /api/admin/needs/disputes/{id}/resolve
     *
     * Resolution vocabulary mirrors the order dispute flow. A linked request
     * keeps its DISPUTED state unless the resolution is a refund, which
     * delegates to the request state machine (it owns the escrow rules).
     * Every resolution leaves a NeedRequestEvent so the request timeline
     * shows the outcome.
     */
    public function disputesResolve(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'resolution' => ['required', 'string', 'in:refund,replacement,credit,dismissed'],
            'resolution_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $dispute = $this->findNeedsDispute($id);
        if (! $dispute) {
            return response()->json(['message' => 'Dispute not found'], 404);
        }

        if (in_array($dispute->status, ['resolved', 'closed'], true)) {
            return response()->json(['message' => 'Dispute already closed'], 422);
        }

        if ($validated['resolution'] === 'refund' && $dispute->need_request_id) {
            return app(\Modules\Needs\Http\Controllers\NeedRequestController::class)
                ->transition($request, (string) $dispute->need_request_id, 'refund');
        }

        $dispute->update([
            'status' => 'resolved',
            'resolution' => $validated['resolution'],
            'resolution_notes' => $validated['resolution_notes'] ?? null,
        ]);

        if ($dispute->need_request_id) {
            // to_status is NOT NULL: anchor the note at the live status.
            // A deleted request leaves no timeline to annotate — skip then.
            $linked = NeedRequest::find($dispute->need_request_id);
            if ($linked) {
                NeedRequestEvent::create([
                    'need_request_id' => $dispute->need_request_id,
                    'actor_id' => $request->user()->id,
                    'from_status' => $linked->status,
                    'to_status' => $linked->status,
                    'action' => 'dispute_resolved',
                    'note' => $validated['resolution'] . ($validated['resolution_notes'] ?? null ? ': ' . $validated['resolution_notes'] : ''),
                ]);
            }
        }

        return response()->json([
            'message' => 'Dispute resolved',
            'data' => $dispute->fresh(['user', 'assignee']),
        ]);
    }

    /**
     * GET /api/admin/needs/fraud-flags
     */
    public function fraudFlagsIndex(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', 'string', 'in:open,confirmed,dismissed'],
            'rule' => ['nullable', 'string', 'in:duplicate_text,high_value_new_account,price_outlier_offer'],
            'entity_type' => ['nullable', 'string', 'in:need_request,need_offer'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = FraudFlag::with(['user', 'decider'])
            ->when($validated['status'] ?? null, fn ($q, $s) => $q->where('status', $s))
            ->when($validated['rule'] ?? null, fn ($q, $r) => $q->where('rule', $r))
            ->when($validated['entity_type'] ?? null, fn ($q, $t) => $q->where('entity_type', $t))
            ->orderByDesc('created_at');

        $paginated = $query->paginate($validated['per_page'] ?? 20);

        return response()->json([
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    /**
     * POST /api/admin/needs/fraud-flags/{id}/decide
     *
     * Human review only: flags never auto-punish, a person confirms or
     * dismisses each one with a note.
     */
    public function fraudFlagsDecide(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'decision' => ['required', 'string', 'in:confirm,dismiss'],
            'note' => ['nullable', 'string', 'max:2000'],
        ]);

        $flag = FraudFlag::find($id);
        if (! $flag) {
            return response()->json(['message' => 'Fraud flag not found'], 404);
        }

        if ($flag->status !== FraudFlag::STATUS_OPEN) {
            return response()->json(['message' => 'Flag already decided'], 422);
        }

        $flag->update([
            'status' => $validated['decision'] === 'confirm' ? FraudFlag::STATUS_CONFIRMED : FraudFlag::STATUS_DISMISSED,
            'decided_by' => $request->user()->id,
            'decision_note' => $validated['note'],
            'decided_at' => now(),
        ]);

        return response()->json([
            'message' => 'Fraud flag ' . $validated['decision'] . 'ed',
            'data' => $flag->fresh(['user', 'decider']),
        ]);
    }

    /**
     * POST /api/admin/needs/fraud-scan — on-demand re-run of the auto-rules.
     */
    public function fraudScan(Request $request): JsonResponse
    {
        return response()->json([
            'message' => 'Fraud scan completed',
            'data' => $this->fraudScanner->scan(),
        ]);
    }

    private function findNeedsDispute(string $id): ?Dispute
    {
        return Dispute::where(function ($w) {
            $w->whereNotNull('need_request_id')
                ->orWhereNotNull('task_id');
        })->find($id);
    }

    /**
     * GET /api/admin/needs/categories — full tree incl. inactive (the public
     * endpoint only serves active rows).
     */
    public function categoriesIndex(Request $request): JsonResponse
    {
        $categories = NeedCategory::with(['parent:id,name,slug', 'children' => fn ($q) => $q->orderBy('sort_order')])
            ->withCount(['items as items_count', 'children as children_count'])
            ->orderBy('sort_order')
            ->get();

        return response()->json(['data' => $categories]);
    }

    /**
     * POST /api/admin/needs/categories
     */
    public function categoriesStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['required', 'string', 'max:120', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', 'unique:need_categories,slug'],
            'description' => ['nullable', 'string', 'max:2000'],
            'icon' => ['nullable', 'string', 'max:60'],
            'color' => ['nullable', 'string', 'max:20'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'parent_id' => ['nullable', 'uuid', 'exists:need_categories,id'],
            'is_active' => ['nullable', 'boolean'],
            'requires_verified_provider' => ['nullable', 'boolean'],
            'form_schema' => ['nullable', 'array', 'max:20'],
        ]);

        $schemaCheck = \Modules\Needs\Services\NeedFormSchemaValidator::validateSchema($validated['form_schema'] ?? null);
        if (! $schemaCheck['valid']) {
            return response()->json(['message' => 'Invalid form schema', 'errors' => $schemaCheck['errors']], 422);
        }

        $category = NeedCategory::create([
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'description' => $validated['description'] ?? null,
            'icon' => $validated['icon'] ?? 'tag',
            'color' => $validated['color'] ?? '#6366F1',
            'sort_order' => $validated['sort_order'] ?? 0,
            'parent_id' => $validated['parent_id'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'form_schema' => $schemaCheck['schema'] === [] ? null : $schemaCheck['schema'],
            'form_schema_version' => 1,
        ]);

        return response()->json(['message' => 'Category created', 'data' => $category], 201);
    }

    /**
     * PUT /api/admin/needs/categories/{id}
     *
     * Changing the question schema bumps form_schema_version; submitted
     * requests keep their snapshot, so history never breaks.
     */
    public function categoriesUpdate(Request $request, string $id): JsonResponse
    {
        $category = NeedCategory::find($id);
        if (! $category) {
            return response()->json(['message' => 'Category not found'], 404);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'slug' => ['sometimes', 'string', 'max:120', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', 'unique:need_categories,slug,' . $category->id],
            'description' => ['nullable', 'string', 'max:2000'],
            'icon' => ['nullable', 'string', 'max:60'],
            'color' => ['nullable', 'string', 'max:20'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'parent_id' => ['nullable', 'uuid', 'exists:need_categories,id'],
            'is_active' => ['nullable', 'boolean'],
            'requires_verified_provider' => ['nullable', 'boolean'],
            'form_schema' => ['nullable', 'array', 'max:20'],
        ]);

        if (array_key_exists('parent_id', $validated) && $validated['parent_id'] !== null) {
            if ($validated['parent_id'] === $category->id || $this->isDescendantOf($validated['parent_id'], $category->id)) {
                return response()->json(['message' => 'A category cannot live under itself or its own child'], 422);
            }
        }

        $updates = array_filter($validated, fn ($v, $k) => $k !== 'form_schema', ARRAY_FILTER_USE_BOTH);

        if (array_key_exists('form_schema', $validated)) {
            $schemaCheck = \Modules\Needs\Services\NeedFormSchemaValidator::validateSchema($validated['form_schema']);
            if (! $schemaCheck['valid']) {
                return response()->json(['message' => 'Invalid form schema', 'errors' => $schemaCheck['errors']], 422);
            }
            $newSchema = $schemaCheck['schema'] === [] ? null : $schemaCheck['schema'];
            if ($newSchema !== $category->form_schema) {
                $updates['form_schema'] = $newSchema;
                $updates['form_schema_version'] = ($category->form_schema_version ?? 1) + 1;
            }
        }

        $category->update($updates);

        return response()->json(['message' => 'Category updated', 'data' => $category->fresh()]);
    }

    /**
     * DELETE /api/admin/needs/categories/{id}
     *
     * Soft-deletes (base model trait). Rows with live requests, items, or
     * children are protected (deactivate instead); only truly unused rows
     * are removed from listings.
     */
    public function categoriesDestroy(Request $request, string $id): JsonResponse
    {
        $category = NeedCategory::find($id);
        if (! $category) {
            return response()->json(['message' => 'Category not found'], 404);
        }

        $requests = NeedRequest::where('category_id', $id)->count();
        $items = \Modules\Needs\Entities\NeedItem::where('category_id', $id)->count();
        $children = NeedCategory::where('parent_id', $id)->count();

        if ($requests > 0 || $items > 0 || $children > 0) {
            return response()->json([
                'message' => 'Category is in use; deactivate it instead of deleting',
                'data' => ['requests' => $requests, 'items' => $items, 'children' => $children],
            ], 422);
        }

        $category->delete();

        return response()->json(['message' => 'Category deleted']);
    }

    /** True when $candidateId sits somewhere below $ancestorId. */
    private function isDescendantOf(string $candidateId, string $ancestorId): bool
    {
        $seen = [];
        $current = NeedCategory::find($candidateId)?->parent_id;

        while ($current !== null && ! in_array($current, $seen, true)) {
            if ($current === $ancestorId) {
                return true;
            }
            $seen[] = $current;
            $current = NeedCategory::find($current)?->parent_id;
        }

        return false;
    }

    /**
     * GET /api/admin/needs/providers — review queue (status + search).
     * Evidence URLs stay reviewer-only via route gating (never public).
     */
    public function providersIndex(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'in:' . implode(',', NeedProviderProfile::STATUSES)],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = NeedProviderProfile::with(['user:id,name,email', 'reviewer:id,name'])
            ->when($validated['search'] ?? null, fn ($q, $s) => $q->where(function ($w) use ($s) {
                $w->where('display_name', 'like', "%{$s}%")
                    ->orWhereHas('user', fn ($u) => $u->where('email', 'like', "%{$s}%"));
            }))
            ->when($validated['status'] ?? null, fn ($q, $s) => $q->where('status', $s))
            ->orderByDesc('updated_at');

        $paginated = $query->paginate($validated['per_page'] ?? 20);

        // TODO 24 bulk KYC: one latest-verdict query instead of per-row gates.
        $userIds = collect($paginated->items())->map(fn ($p) => (string) $p->user_id)->all();
        $kyc = $userIds === [] ? [] : DB::table('kyc_verifications')
            ->whereIn('user_id', $userIds)
            ->orderByDesc('created_at')
            ->get(['user_id', 'status'])
            ->groupBy(fn ($r) => (string) $r->user_id)
            ->map(fn ($rows) => \Core\Support\KycStatus::canonical($rows->first()->status))
            ->all();

        $data = collect($paginated->items())->map(fn ($p) => array_merge(
            $p->toArray(),
            ['kyc_state' => $kyc[(string) $p->user_id] ?? \Core\Support\KycStatus::NOT_STARTED]
        ))->all();

        return response()->json([
            'data' => $data,
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    /**
     * GET /api/admin/needs/providers/{id}
     */
    public function providersShow(Request $request, string $id): JsonResponse
    {
        $profile = NeedProviderProfile::with(['user:id,name,email', 'reviewer:id,name'])->find($id);
        if (! $profile) {
            return response()->json(['message' => 'Provider profile not found'], 404);
        }

        // N-28 response SLA: hours from each request's creation to this
        // provider's FIRST offer on it (later offers on the same request
        // do not count), aggregated across every request they answered.
        // Eloquent subquery so the table literal never appears in Admin.
        $firsts = \Modules\Needs\Entities\NeedOffer::selectRaw('need_request_id, min(created_at) as first_at')
            ->where('provider_id', (string) $profile->user_id)
            ->groupBy('need_request_id');

        $sla = NeedRequest::query()
            ->joinSub($firsts, 'firsts', fn ($j) => $j->on('firsts.need_request_id', '=', 'need_requests.id'))
            ->selectRaw("count(*) as responded,
                percentile_cont(0.5) within group (order by extract(epoch from (firsts.first_at - need_requests.created_at)) / 3600) as median_hours,
                min(extract(epoch from (firsts.first_at - need_requests.created_at)) / 3600) as fastest_hours")
            ->first();

        return response()->json(['data' => array_merge(
            $profile->toArray(),
            [
                'kyc_state' => \Core\Support\KycGate::verificationState((string) $profile->user_id),
                'first_response' => [
                    'responded_requests' => (int) ($sla->responded ?? 0),
                    'median_hours' => isset($sla->median_hours) && $sla->median_hours !== null ? round((float) $sla->median_hours, 1) : null,
                    'fastest_hours' => isset($sla->fastest_hours) && $sla->fastest_hours !== null ? round((float) $sla->fastest_hours, 1) : null,
                ],
            ]
        )]);
    }

    /**
     * POST /api/admin/needs/providers/{id}/review
     *
     * approve/reject from submitted (or re-decide a rejected row). Approval
     * records who/when; rejection requires the reason the provider will see.
     */
    /**
     * N-23 vetting funnel: submitted → trial (observation window) →
     * approved/rejected. trial starts the clock; approve/reject finish it.
     */
    public function providersReview(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'decision' => ['required', 'string', 'in:approve,reject,trial'],
            'note' => ['nullable', 'string', 'max:2000'],
        ]);

        $profile = NeedProviderProfile::find($id);
        if (! $profile) {
            return response()->json(['message' => 'Provider profile not found'], 404);
        }

        $reviewable = [
            NeedProviderProfile::STATUS_SUBMITTED,
            NeedProviderProfile::STATUS_TRIAL,
            NeedProviderProfile::STATUS_REJECTED,
        ];
        if (! in_array($profile->status, $reviewable, true)) {
            return response()->json(['message' => "Only submitted, trial, or rejected profiles can be reviewed ('{$profile->status}')"], 422);
        }

        if ($validated['decision'] === 'trial' && $profile->status === NeedProviderProfile::STATUS_TRIAL) {
            return response()->json(['message' => 'Profile is already in trial'], 422);
        }

        if ($validated['decision'] === 'reject' && empty($validated['note'])) {
            return response()->json(['message' => 'A rejection reason is required'], 422);
        }

        $status = match ($validated['decision']) {
            'approve' => NeedProviderProfile::STATUS_APPROVED,
            'trial' => NeedProviderProfile::STATUS_TRIAL,
            default => NeedProviderProfile::STATUS_REJECTED,
        };

        $profile->update([
            'status' => $status,
            'review_note' => $validated['note'] ?? null,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'trial_started_at' => $status === NeedProviderProfile::STATUS_TRIAL
                ? now()
                : $profile->trial_started_at,
        ]);

        $messages = [
            'approve' => ['Provider profile approved', 'Your provider profile was approved. You now carry the verified badge.'],
            'trial' => ['Provider profile placed in trial', 'Your provider profile passed screening and is now in trial. Take on non-verified work while we observe; verified categories unlock after full approval.'],
            'reject' => ['Provider profile needs changes', 'Your provider profile was not approved: ' . ($validated['note'] ?? 'see review notes.')],
        ];

        $this->notifyProvider(
            (string) $profile->user_id,
            $messages[$validated['decision']][0],
            $messages[$validated['decision']][1],
            'provider_profile_review',
            $profile->id
        );

        return response()->json([
            'message' => $validated['decision'] === 'trial'
                ? 'Profile moved to trial'
                : 'Profile ' . $validated['decision'] . 'd',
            'data' => $profile->fresh(),
        ]);
    }

    /**
     * POST /api/admin/needs/providers/{id}/suspend (note required).
     * A suspended provider cannot offer anywhere — enforced in submitOffer.
     */
    public function providersSuspend(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'note' => ['required', 'string', 'max:2000'],
        ]);

        $profile = NeedProviderProfile::find($id);
        if (! $profile) {
            return response()->json(['message' => 'Provider profile not found'], 404);
        }

        if ($profile->status === NeedProviderProfile::STATUS_SUSPENDED) {
            return response()->json(['message' => 'Profile already suspended'], 422);
        }

        $profile->update([
            'status' => NeedProviderProfile::STATUS_SUSPENDED,
            'review_note' => $validated['note'],
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        $this->notifyProvider(
            (string) $profile->user_id,
            'Provider account suspended',
            'Your provider account was suspended: ' . $validated['note'],
            'provider_profile_suspended',
            $profile->id
        );

        return response()->json(['message' => 'Profile suspended', 'data' => $profile->fresh()]);
    }

    /**
     * POST /api/admin/needs/providers/{id}/reinstate — back to the review
     * queue (submitted), never straight to approved: the content must be
     * looked at again after a suspension.
     */
    public function providersReinstate(Request $request, string $id): JsonResponse
    {
        $profile = NeedProviderProfile::find($id);
        if (! $profile) {
            return response()->json(['message' => 'Provider profile not found'], 404);
        }

        if ($profile->status !== NeedProviderProfile::STATUS_SUSPENDED) {
            return response()->json(['message' => 'Only suspended profiles can be reinstated'], 422);
        }

        $profile->update([
            'status' => NeedProviderProfile::STATUS_SUBMITTED,
            'review_note' => null,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'trial_started_at' => null,
        ]);

        return response()->json(['message' => 'Profile returned to review', 'data' => $profile->fresh()]);
    }

    private function notifyProvider(string $userId, string $title, string $body, string $type, string $refId): void
    {
        $this->notifications->notify($userId, $title, $body, $type, $refId);
    }

    /**
     * GET /api/admin/needs/reports/requests — §35 operational aggregates.
     * Every figure is computed from persisted rows over the requested
     * window; rates divide by their own stated populations.
     */
    public function reportsRequests(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'category_id' => ['nullable', 'string'],
        ]);

        $scoped = fn ($q) => $q
            ->when($validated['date_from'] ?? null, fn ($w, $d) => $w->whereDate('need_requests.created_at', '>=', $d))
            ->when($validated['date_to'] ?? null, fn ($w, $d) => $w->whereDate('need_requests.created_at', '<=', $d))
            ->when($validated['category_id'] ?? null, fn ($w, $id) => $w->where('need_requests.category_id', $id));

        $total = (clone $scoped)(NeedRequest::query())->count();
        $live = (clone $scoped)(NeedRequest::query())->where('status', '!=', NeedRequest::STATUS_DRAFT)->count();

        $byCategory = $scoped(NeedRequest::query())
            ->leftJoin('need_categories', 'need_requests.category_id', '=', 'need_categories.id')
            ->selectRaw('coalesce(need_categories.name, \'Uncategorized\') as category, count(*) as total')
            ->groupBy('need_categories.name')
            ->orderByDesc('total')
            ->limit(20)
            ->get();

        $byStatus = $scoped(NeedRequest::query())
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $withOffers = $scoped(NeedRequest::query())
            ->whereExists(fn ($q) => $q->selectRaw('1')->from('need_offers')
                ->whereColumn('need_offers.need_request_id', 'need_requests.id')
                ->whereNull('need_offers.deleted_at'))
            ->count();

        $accepted = $scoped(NeedRequest::query())
            ->whereIn('status', [NeedRequest::STATUS_ACCEPTED, NeedRequest::STATUS_PAYMENT_PENDING, NeedRequest::STATUS_PAID, NeedRequest::STATUS_IN_PROGRESS, NeedRequest::STATUS_FULFILLED, NeedRequest::STATUS_COMPLETED])
            ->count();

        $fulfilledBase = $scoped(NeedRequest::query())
            ->whereIn('status', [NeedRequest::STATUS_PAID, NeedRequest::STATUS_IN_PROGRESS, NeedRequest::STATUS_FULFILLED, NeedRequest::STATUS_COMPLETED, NeedRequest::STATUS_DISPUTED, NeedRequest::STATUS_REFUNDED])
            ->count();
        $completed = $scoped(NeedRequest::query())->where('status', NeedRequest::STATUS_COMPLETED)->count();
        $disputed = $scoped(NeedRequest::query())->where('status', NeedRequest::STATUS_DISPUTED)->count();

        $avgOffers = $live > 0
            ? round(\Modules\Needs\Entities\NeedOffer::whereHas('request', fn ($q) => $this->applyReportScope($q, $validated))->count() / $live, 2)
            : 0;

        $turnaround = DB::table('need_provider_profiles')
            ->whereNotNull('reviewed_at')
            ->selectRaw('percentile_cont(0.5) within group (order by extract(epoch from (reviewed_at - created_at)) / 3600) as median_hours')
            ->value('median_hours');

        // N-28 response SLA: median hours from request creation to the
        // first offer it received (one sample per responded request).
        // $withOffers is the exact sample the median was computed over.
        // Eloquent (not DB::table) so the Admin module never touches the
        // Needs-owned need_offers table directly — the soft-delete scope
        // rides along for free.
        $firstResponseMedian = (clone $scoped)(NeedRequest::query())
            ->joinSub(
                \Modules\Needs\Entities\NeedOffer::selectRaw('need_request_id, min(created_at) as first_offer_at')
                    ->groupBy('need_request_id'),
                'first_offers',
                fn ($j) => $j->on('first_offers.need_request_id', '=', 'need_requests.id')
            )
            ->selectRaw('percentile_cont(0.5) within group (order by extract(epoch from (first_offers.first_offer_at - need_requests.created_at)) / 3600) as median_hours')
            ->value('median_hours');

        $tasksTotal = TaskPost::count();
        $tasksCompleted = TaskPost::where('status', TaskPost::STATUS_COMPLETED)->count();

        return response()->json(['data' => [
            'requests_total' => $total,
            'volume_by_category' => $byCategory,
            'volume_by_status' => $byStatus,
            'offer_rate' => $live > 0 ? round($withOffers / $live, 3) : 0,
            'acceptance_rate' => $withOffers > 0 ? round($accepted / $withOffers, 3) : 0,
            'completion_rate' => $fulfilledBase > 0 ? round($completed / $fulfilledBase, 3) : 0,
            'dispute_rate' => $fulfilledBase > 0 ? round($disputed / $fulfilledBase, 3) : 0,
            'avg_offers_per_request' => $avgOffers,
            'verification_median_hours' => $turnaround !== null ? round((float) $turnaround, 1) : null,
            'first_response_median_hours' => $firstResponseMedian !== null ? round((float) $firstResponseMedian, 1) : null,
            'first_response_sample' => $withOffers,
            'tasks_completion_rate' => $tasksTotal > 0 ? round($tasksCompleted / $tasksTotal, 3) : 0,
        ]]);
    }

    private function applyReportScope($query, array $validated)
    {
        return $query
            ->when($validated['date_from'] ?? null, fn ($w, $d) => $w->whereDate('need_requests.created_at', '>=', $d))
            ->when($validated['date_to'] ?? null, fn ($w, $d) => $w->whereDate('need_requests.created_at', '<=', $d))
            ->when($validated['category_id'] ?? null, fn ($w, $id) => $w->where('need_requests.category_id', $id));
    }

    /**
     * GET /api/admin/needs/reports/requests/export — streamed CSV (chunked,
     * capped). Privacy: owner appears as an opaque user_id; no emails,
     * phones, or exact addresses. Formula cells are neutralized, and the
     * download itself is audit-logged as a sensitive operation.
     */
    public function exportRequests(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $validated = $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'category_id' => ['nullable', 'string'],
        ]);

        $userId = (string) $request->user()->id;
        $filters = $validated;

        try {
            app(\Core\Services\Contracts\AuditServiceInterface::class)->log([
                'action' => 'needs.requests.export',
                'entity_type' => 'need_requests',
                'entity_id' => null,
                'performed_by' => $userId,
                'new_values' => $filters,
            ]);
        } catch (\Throwable) {
            // Audit failure must not block the export itself.
        }

        $filename = 'everythingneed-needs-requests-' . now()->format('YmdHis') . '.csv';

        return response()->streamDownload(function () use ($validated) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['request_number', 'title', 'status', 'category', 'pricing_basis', 'budget_min', 'budget_max', 'currency', 'visibility', 'offers', 'owner_id', 'created_at']);

            NeedRequest::with('category:id,name')
                ->withCount('offers')
                ->when($validated['date_from'] ?? null, fn ($w, $d) => $w->whereDate('need_requests.created_at', '>=', $d))
                ->when($validated['date_to'] ?? null, fn ($w, $d) => $w->whereDate('need_requests.created_at', '<=', $d))
                ->when($validated['category_id'] ?? null, fn ($w, $id) => $w->where('need_requests.category_id', $id))
                ->orderBy('need_requests.created_at')
                ->chunkById(500, function ($rows) use ($out) {
                    foreach ($rows as $row) {
                        fputcsv($out, [
                            $this->csvSafe($row->request_number),
                            $this->csvSafe($row->title),
                            $row->status,
                            $this->csvSafe($row->category?->name ?? ''),
                            $row->pricing_basis,
                            $row->budget_min,
                            $row->budget_max,
                            $row->currency,
                            $row->visibility,
                            $row->offers_count,
                            $row->user_id,
                            $row->created_at?->toIso8601String(),
                        ]);
                    }
                });

            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /** Neutralize spreadsheet formula injection (=, +, -, @, tab/CR). */
    private function csvSafe(?string $value): string
    {
        $value = (string) ($value ?? '');

        return preg_match('/^[\s]*[=+\-@\t\r]/', $value) === 1 ? "'" . $value : $value;
    }

    /**
     * GET /api/admin/needs/listings — every status (public endpoints only
     * serve published + available rows).
     */
    public function listingsIndex(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'in:' . implode(',', NeedItem::STATUSES)],
            'category_id' => ['nullable', 'string'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = NeedItem::with(['category:id,name,slug', 'owner:id,name,email', 'vendor:id,store_name'])
            ->when($validated['search'] ?? null, fn ($q, $s) => $q->where(function ($w) use ($s) {
                $w->where('name', 'like', "%{$s}%")
                    ->orWhere('description', 'like', "%{$s}%");
            }))
            ->when($validated['status'] ?? null, fn ($q, $s) => $q->where('status', $s))
            ->when($validated['category_id'] ?? null, fn ($q, $id) => $q->where('category_id', $id))
            ->orderByDesc('created_at');

        $paginated = $query->paginate($validated['per_page'] ?? 20);

        return response()->json([
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    /**
     * POST /api/admin/needs/listings/{id}/moderate
     *
     * approve (submitted/rejected → approved) → publish (approved → published)
     * is two steps on purpose: approval and public visibility are different
     * decisions. reject needs the reason; suspend/archive hide the listing;
     * restore returns it to the queue.
     */
    public function listingsModerate(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'string', 'in:approve,publish,reject,suspend,archive,restore'],
            'note' => ['nullable', 'string', 'max:2000'],
        ]);

        $item = NeedItem::find($id);
        if (! $item) {
            return response()->json(['message' => 'Listing not found'], 404);
        }

        $action = $validated['action'];
        $status = $item->status;

        switch ($action) {
            case 'approve':
                if (! in_array($status, [NeedItem::STATUS_SUBMITTED, NeedItem::STATUS_REJECTED], true)) {
                    return response()->json(['message' => "Only submitted listings can be approved ('{$status}')"], 422);
                }
                $item->update([
                    'status' => NeedItem::STATUS_APPROVED,
                    'review_note' => $validated['note'] ?? null,
                ]);
                $message = 'Listing approved';
                break;

            case 'publish':
                if ($status !== NeedItem::STATUS_APPROVED) {
                    return response()->json(['message' => "Only approved listings can be published ('{$status}')"], 422);
                }
                $item->update([
                    'status' => NeedItem::STATUS_PUBLISHED,
                    'published_at' => now(),
                ]);
                $message = 'Listing published';
                break;

            case 'reject':
                if (! in_array($status, [NeedItem::STATUS_SUBMITTED, NeedItem::STATUS_APPROVED], true)) {
                    return response()->json(['message' => "Only queued listings can be rejected ('{$status}')"], 422);
                }
                if (empty($validated['note'])) {
                    return response()->json(['message' => 'A rejection reason is required'], 422);
                }
                $item->update([
                    'status' => NeedItem::STATUS_REJECTED,
                    'review_note' => $validated['note'],
                ]);
                $message = 'Listing rejected';
                break;

            case 'suspend':
                if (! in_array($status, [NeedItem::STATUS_APPROVED, NeedItem::STATUS_PUBLISHED], true)) {
                    return response()->json(['message' => "Only live listings can be suspended ('{$status}')"], 422);
                }
                $item->update([
                    'status' => NeedItem::STATUS_SUSPENDED,
                    'review_note' => $validated['note'] ?? $item->review_note,
                ]);
                $message = 'Listing suspended';
                break;

            case 'archive':
                $item->update(['status' => NeedItem::STATUS_ARCHIVED]);
                $message = 'Listing archived';
                break;

            case 'restore':
                if (! in_array($status, [NeedItem::STATUS_SUSPENDED, NeedItem::STATUS_ARCHIVED, NeedItem::STATUS_REJECTED], true)) {
                    return response()->json(['message' => "Only hidden listings can be restored ('{$status}')"], 422);
                }
                $item->update(['status' => NeedItem::STATUS_SUBMITTED, 'review_note' => null]);
                $message = 'Listing returned to review';
                break;
        }

        if ($item->user_id) {
            $this->notifications->notify(
                (string) $item->user_id,
                "Listing {$message}",
                "'{$item->name}' — {$message}." . ($validated['note'] ?? null ? " Note: {$validated['note']}" : ''),
                'need_listing_review',
                $item->id
            );
        }

        return response()->json([
            'message' => $message,
            'data' => $item->fresh(),
        ]);
    }
}
