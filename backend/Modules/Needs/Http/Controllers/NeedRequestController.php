<?php

namespace Modules\Needs\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedOffer;
use Modules\Needs\Entities\NeedProviderProfile;
use Modules\Needs\Entities\NeedRequest;
use Modules\Needs\Entities\NeedRequestEvent;
use Modules\Needs\Services\NeedMatcher;

class NeedRequestController extends Controller
{
    public function __construct(
        private NotificationService $notifications,
        private NeedMatcher $matcher
    ) {}

    /**
     * ?scope=mine (default) | open  — open = public listing for providers.
     */
    public function index(Request $request): JsonResponse
    {
        $scope = $request->get('scope', 'mine');
        $query = NeedRequest::with(['offers', 'category:id,name,slug']);

        if ($scope === 'open') {
            // Public marketplace of requests seeking offers (spec S13 open states)
            $query->whereIn('status', NeedRequest::OPEN_STATUSES);
            // Invitation-only rows stay invisible to strangers (TODO 06 §7).
            $query->where(function ($w) use ($request) {
                $w->where('visibility', NeedRequest::VISIBILITY_PUBLIC)
                    ->orWhereJsonContains('invited_provider_ids', (string) $request->user()->id);
            });

            if ($request->filled('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            if ($request->filled('category_slug')) {
                $category = NeedCategory::where('slug', $request->category_slug)->first();
                $query->where('category_id', $category?->id);
            }

            if ($request->filled('q')) {
                $q = $request->q;
                $query->where(function ($sub) use ($q) {
                    $sub->where('title', 'ilike', "%{$q}%")
                        ->orWhere('description', 'ilike', "%{$q}%");
                });
            }

            // TODO 10 discovery filters (validated, allowlisted sort).
            $validated = $request->validate([
                'budget_min' => ['nullable', 'numeric', 'min:0'],
                'budget_max' => ['nullable', 'numeric', 'min:0'],
                'state' => ['nullable', 'string', 'max:120'],
                'city' => ['nullable', 'string', 'max:120'],
                'is_remote' => ['nullable', 'boolean'],
                'pricing_basis' => ['nullable', 'string', \Illuminate\Validation\Rule::in(NeedRequest::PRICING_BASES)],
                'sort' => ['nullable', 'string', \Illuminate\Validation\Rule::in(['newest', 'budget_asc', 'budget_desc', 'deadline'])],
            ]);

            if (! empty($validated['budget_min'])) {
                $query->where('budget_max', '>=', $validated['budget_min']);
            }
            if (! empty($validated['budget_max'])) {
                // Grouped: the budget-less fallback must not escape the
                // status/visibility scope above it.
                $max = $validated['budget_max'];
                $query->where(function ($w) use ($max) {
                    $w->where('budget_min', '<=', $max)
                        ->orWhere(function ($n) {
                            $n->whereNull('budget_min')->whereNull('budget_max');
                        });
                });
            }
            foreach (['state', 'city'] as $geo) {
                if (! empty($validated[$geo])) {
                    $query->where($geo, 'ilike', "%{$validated[$geo]}%");
                }
            }
            if (array_key_exists('is_remote', $validated) && $validated['is_remote'] !== null) {
                $query->where('is_remote', (bool) $validated['is_remote']);
            }
            if (! empty($validated['pricing_basis'])) {
                $query->where('pricing_basis', $validated['pricing_basis']);
            }

            $order = match ($validated['sort'] ?? 'newest') {
                'budget_asc' => ['budget_max', 'asc'],
                'budget_desc' => ['budget_max', 'desc'],
                'deadline' => ['deadline', 'asc'],
                default => ['created_at', 'desc'],
            };
            $requests = $query->orderBy($order[0], $order[1])
                ->paginate($request->get('per_page', 15));

            return response()->json([
                'data' => $requests->items(),
                'meta' => [
                    'current_page' => $requests->currentPage(),
                    'last_page' => $requests->lastPage(),
                    'per_page' => $requests->perPage(),
                    'total' => $requests->total(),
                ],
            ]);
        }

        $query->where('user_id', $request->user()->id);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $requests = $query->orderByDesc('created_at')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $requests->items(),
            'meta' => [
                'current_page' => $requests->currentPage(),
                'last_page' => $requests->lastPage(),
                'per_page' => $requests->perPage(),
                'total' => $requests->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        // W18 (F-03): normalize case before validation so 'ghs' passes.
        // Only merge when a value was given: need_requests.currency is
        // NOT NULL with a DB default that must survive omission.
        $code = \Core\Support\Currencies::normalize($request->input('currency'));
        if ($code !== null) {
            $request->merge(['currency' => $code]);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:5000',
            'category_id' => 'nullable|uuid|exists:need_categories,id',
            'subcategory' => 'nullable|string|max:255',
            'budget_min' => 'nullable|numeric|min:0',
            'budget_max' => 'nullable|numeric|min:0|gte:budget_min',
            'quantity' => 'nullable|integer|min:1|max:1000000',
            'currency' => ['nullable', 'string', 'size:3', \Illuminate\Validation\Rule::in(\Core\Support\Currencies::SUPPORTED)],
            'country' => 'nullable|string|max:120',
            'location' => 'nullable|string|max:255',
            'preferred_date' => 'nullable|date',
            'deadline' => 'nullable|date|after_or_equal:today',
            'attachments' => 'nullable|array',
            'images' => 'nullable|array|max:10',
            'images.*' => 'nullable|string|max:500',
            'service_requirements' => 'nullable|string|max:5000',
            'delivery_requirements' => 'nullable|string|max:5000',
            'notes' => 'nullable|string|max:5000',
            'save_as_draft' => 'nullable|boolean',
            'answers' => 'nullable|array',
            // TODO 06 creation fields (§7 steps 3/4/5/7).
            'pricing_basis' => ['nullable', 'string', \Illuminate\Validation\Rule::in(NeedRequest::PRICING_BASES)],
            'is_remote' => 'nullable|boolean',
            'state' => 'nullable|string|max:120',
            'lga' => 'nullable|string|max:120',
            'city' => 'nullable|string|max:120',
            'is_asap' => 'nullable|boolean',
            'preferred_time_window' => 'nullable|string|max:120',
            'visibility' => ['nullable', 'string', \Illuminate\Validation\Rule::in([NeedRequest::VISIBILITY_PUBLIC, NeedRequest::VISIBILITY_INVITE_ONLY])],
            'invited_provider_ids' => 'nullable|array|max:50',
            'invited_provider_ids.*' => 'uuid|exists:users,id',
            'client_key' => 'nullable|uuid',
            // N-22 gig packages: buyer names a listing + tier index; the
            // server below resolves name/price from the listing itself —
            // a forged 'selected_package' payload never reaches validation,
            // let alone storage (only whitelisted keys survive).
            'selected_listing_id' => 'nullable|uuid|exists:need_items,id',
            'selected_package_index' => 'nullable|integer|min:0|max:4',
            'selected_add_on_indexes' => 'nullable|array|max:10',
            'selected_add_on_indexes.*' => 'integer|min:0|max:9',
        ]);

        // TODO 07 idempotent submission: a retried POST with the same key
        // returns the original row (no duplicate, no extra audit event).
        if (! empty($validated['client_key'])) {
            $replay = NeedRequest::where('user_id', $request->user()->id)
                ->where('client_key', $validated['client_key'])
                ->first();
            if ($replay) {
                return response()->json([
                    'message' => 'Request already submitted',
                    'data' => $replay,
                    'replayed' => true,
                ], 200);
            }
        }

        // Pricing coherence: a declared basis must carry the budget it implies.
        // Undeclared stays flexible (budgets optional) so legacy budget-less
        // requests keep working; only explicit fixed/range/hourly enforce.
        $basis = $validated['pricing_basis'] ?? NeedRequest::PRICING_FLEXIBLE;
        $validated['pricing_basis'] = $basis;
        $needsMax = in_array($basis, [NeedRequest::PRICING_FIXED, NeedRequest::PRICING_HOURLY], true);
        $needsBoth = $basis === NeedRequest::PRICING_RANGE;
        if ($needsMax && empty($validated['budget_max'])) {
            return response()->json(['message' => "A {$basis} budget needs an amount"], 422);
        }
        if ($needsBoth && (empty($validated['budget_min']) || empty($validated['budget_max']))) {
            return response()->json(['message' => 'A range budget needs both ends'], 422);
        }

        // Invitation-only without invitees is just a hidden request: refuse it.
        $visibility = $validated['visibility'] ?? NeedRequest::VISIBILITY_PUBLIC;
        if ($visibility === NeedRequest::VISIBILITY_INVITE_ONLY && empty($validated['invited_provider_ids'])) {
            return response()->json(['message' => 'Invitation-only requests need at least one invited provider'], 422);
        }

        // N-22: resolve the chosen tier + extras against the LIVE listing
        // and snapshot the server's copy of the prices. Pairing is strict:
        // a tier or extras without a listing is refused, and a tier the
        // listing no longer offers is refused — never silently re-priced.
        $selectedListingId = $validated['selected_listing_id'] ?? null;
        $packageIndex = $validated['selected_package_index'] ?? null;
        $addOnIndexes = $validated['selected_add_on_indexes'] ?? [];
        unset(
            $validated['selected_listing_id'],
            $validated['selected_package_index'],
            $validated['selected_add_on_indexes'],
        );

        if ($packageIndex !== null && $selectedListingId === null) {
            return response()->json(['message' => 'A package choice needs the listing it belongs to'], 422);
        }
        if ($addOnIndexes !== [] && $packageIndex === null) {
            return response()->json(['message' => 'Choose a package before adding extras'], 422);
        }

        $selectedPackage = null;
        if ($selectedListingId !== null) {
            $listing = \Modules\Needs\Entities\NeedItem::find($selectedListingId);
            // The exists rule only proves the row; package selection is a
            // purchase intent — archived/unpublished gigs cannot carry one.
            if (! $listing || ! $listing->isPubliclyVisible()) {
                return response()->json(['message' => 'That listing is not available for package selection'], 422);
            }
            $packages = is_array($listing->packages) ? $listing->packages : [];
            $addOns = is_array($listing->add_ons) ? $listing->add_ons : [];

            if ($packageIndex !== null) {
                if (! isset($packages[$packageIndex])) {
                    return response()->json(['message' => 'That package is no longer offered on this listing'], 422);
                }
                $pkg = $packages[$packageIndex];
                $selectedPackage = [
                    'index' => (int) $packageIndex,
                    'name' => (string) ($pkg['name'] ?? ''),
                    'price' => (float) ($pkg['price'] ?? 0),
                    'description' => isset($pkg['description']) ? (string) $pkg['description'] : null,
                    'delivery_time' => isset($pkg['delivery_time']) ? (string) $pkg['delivery_time'] : null,
                    'add_ons' => [],
                ];
            }

            foreach ($addOnIndexes as $addOnIndex) {
                if (! isset($addOns[$addOnIndex])) {
                    return response()->json(['message' => 'One of the chosen extras is no longer offered'], 422);
                }
                $addOn = $addOns[$addOnIndex];
                $selectedPackage['add_ons'][] = [
                    'name' => (string) ($addOn['name'] ?? ''),
                    'price' => (float) ($addOn['price'] ?? 0),
                ];
            }
        }

        $isDraft = (bool) ($validated['save_as_draft'] ?? false);
        unset($validated['save_as_draft']);

        // TODO 05 category questions: answers are validated against the
        // category's allowlisted schema; the schema snapshot rides along so
        // later form changes never invalidate this submission.
        $answers = $validated['answers'] ?? null;
        unset($validated['answers']);
        $snapshot = null;
        $schemaVersion = null;

        if (! empty($validated['category_id'])) {
            $category = \Modules\Needs\Entities\NeedCategory::find($validated['category_id']);
            $schema = is_array($category?->form_schema) ? $category->form_schema : [];

            if ($schema !== []) {
                if ($answers !== null) {
                    $answerErrors = \Modules\Needs\Services\NeedFormSchemaValidator::validateAnswers($schema, $answers);
                    if ($answerErrors !== []) {
                        return response()->json([
                            'message' => 'Some answers need attention',
                            'errors' => $answerErrors,
                        ], 422);
                    }
                } elseif (! $isDraft) {
                    $missing = [];
                    foreach ($schema as $field) {
                        if (! empty($field['required'])) {
                            $missing[$field['key']] = "'{$field['label']}' is required";
                        }
                    }
                    if ($missing !== []) {
                        return response()->json([
                            'message' => 'Some answers need attention',
                            'errors' => $missing,
                        ], 422);
                    }
                }
                $snapshot = $schema;
                $schemaVersion = $category->form_schema_version ?? 1;
            }
        }

        try {
            $needRequest = DB::transaction(function () use ($request, $validated, $isDraft, $answers, $snapshot, $schemaVersion, $selectedListingId, $selectedPackage) {
                $row = NeedRequest::create(array_merge($validated, [
                    'user_id' => $request->user()->id,
                    'request_number' => 'NR-'.strtoupper(uniqid()),
                    'status' => $isDraft ? NeedRequest::STATUS_DRAFT : NeedRequest::STATUS_PENDING,
                    'answers' => $answers,
                    'form_schema_snapshot' => $snapshot,
                    'form_schema_version' => $schemaVersion,
                    'selected_listing_id' => $selectedListingId,
                    'selected_package' => $selectedPackage,
                ]));

                $this->record($row, null, $row->status, 'create', $isDraft ? 'Draft saved' : 'Submitted');

                return $row;
            });
        } catch (\Core\Exceptions\ValidationException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => $isDraft
                ? 'Draft saved. Finish it any time from My Needs.'
                : 'Request submitted. Our team will review it shortly.',
            'data' => $needRequest,
        ], 201);
    }

    /**
     * TODO 07 revision rules (§8): the owner may revise drafts and pending
     * requests freely, and published ones only while no provider has bid —
     * published content must not silently change under submitted offers.
     * Every edit lands in the timeline; the schema snapshot refreshes so the
     * stored answers always match a real schema version.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $needRequest = NeedRequest::find($id);
        if (! $needRequest) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        if ((string) $needRequest->user_id !== (string) $request->user()->id) {
            return response()->json(['message' => 'Only the owner can edit this request'], 403);
        }

        $editable = [NeedRequest::STATUS_DRAFT, NeedRequest::STATUS_PENDING];
        if (! in_array($needRequest->status, $editable, true)) {
            // Published content must not silently change under submitted bids —
            // checked first so the message names the real reason.
            $bidCount = NeedOffer::where('need_request_id', $id)
                ->whereIn('status', [NeedOffer::STATUS_PENDING, NeedOffer::STATUS_ACCEPTED])
                ->count();
            if ($bidCount > 0) {
                return response()->json(['message' => 'Providers have already bid; cancel and repost instead of editing'], 422);
            }

            return response()->json(['message' => "Requests cannot be edited in status '{$needRequest->status}'"], 422);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string|max:5000',
            'category_id' => 'sometimes|nullable|uuid|exists:need_categories,id',
            'subcategory' => 'sometimes|nullable|string|max:255',
            'budget_min' => 'sometimes|nullable|numeric|min:0',
            'budget_max' => 'sometimes|nullable|numeric|min:0',
            'quantity' => 'sometimes|nullable|integer|min:1|max:1000000',
            'currency' => ['sometimes', 'nullable', 'string', 'size:3', \Illuminate\Validation\Rule::in(\Core\Support\Currencies::SUPPORTED)],
            'pricing_basis' => ['sometimes', 'nullable', 'string', \Illuminate\Validation\Rule::in(NeedRequest::PRICING_BASES)],
            'country' => 'sometimes|nullable|string|max:120',
            'state' => 'sometimes|nullable|string|max:120',
            'lga' => 'sometimes|nullable|string|max:120',
            'city' => 'sometimes|nullable|string|max:120',
            'location' => 'sometimes|nullable|string|max:255',
            'is_remote' => 'sometimes|nullable|boolean',
            'preferred_date' => 'sometimes|nullable|date',
            'deadline' => 'sometimes|nullable|date|after_or_equal:today',
            'is_asap' => 'sometimes|nullable|boolean',
            'preferred_time_window' => 'sometimes|nullable|string|max:120',
            'images' => 'sometimes|nullable|array|max:10',
            'images.*' => 'nullable|string|max:500',
            'service_requirements' => 'sometimes|nullable|string|max:5000',
            'delivery_requirements' => 'sometimes|nullable|string|max:5000',
            'notes' => 'sometimes|nullable|string|max:5000',
            'answers' => 'sometimes|nullable|array',
            'visibility' => ['sometimes', 'nullable', 'string', \Illuminate\Validation\Rule::in([NeedRequest::VISIBILITY_PUBLIC, NeedRequest::VISIBILITY_INVITE_ONLY])],
            'invited_provider_ids' => 'sometimes|nullable|array|max:50',
            'invited_provider_ids.*' => 'uuid|exists:users,id',
        ]);

        $categoryId = array_key_exists('category_id', $validated) ? $validated['category_id'] : $needRequest->category_id;
        $schema = [];
        $schemaVersion = $needRequest->form_schema_version;
        if (! empty($categoryId)) {
            $category = \Modules\Needs\Entities\NeedCategory::find($categoryId);
            $schema = is_array($category?->form_schema) ? $category->form_schema : [];
            $schemaVersion = $category?->form_schema_version;
        }

        if (array_key_exists('answers', $validated) && $validated['answers'] !== null && $schema !== []) {
            $answerErrors = \Modules\Needs\Services\NeedFormSchemaValidator::validateAnswers($schema, $validated['answers']);
            if ($answerErrors !== []) {
                return response()->json(['message' => 'Some answers need attention', 'errors' => $answerErrors], 422);
            }
        }

        if (($validated['visibility'] ?? $needRequest->visibility) === NeedRequest::VISIBILITY_INVITE_ONLY) {
            $invitees = array_key_exists('invited_provider_ids', $validated)
                ? $validated['invited_provider_ids']
                : $needRequest->invited_provider_ids;
            if (empty($invitees)) {
                return response()->json(['message' => 'Invitation-only requests need at least one invited provider'], 422);
            }
        }

        $needRequest->update(array_merge($validated, [
            'form_schema_snapshot' => $schema === [] ? $needRequest->form_schema_snapshot : $schema,
            'form_schema_version' => $schema === [] ? $needRequest->form_schema_version : $schemaVersion,
        ]));
        $this->record($needRequest, $needRequest->status, $needRequest->status, 'edit', 'Owner revised the request');

        return response()->json([
            'message' => 'Request updated',
            'data' => $needRequest->fresh(),
        ]);
    }

    /**
     * TODO 15 progress notes: the accepted provider narrates in-progress
     * work. Status never moves here — this is timeline narration, and the
     * owner is notified of every entry.
     */
    public function progress(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'note' => ['required', 'string', 'max:2000'],
            'evidence_url' => ['nullable', 'url', 'max:500'],
        ]);

        $needRequest = NeedRequest::find($id);
        if (! $needRequest) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        $isProvider = $needRequest->acceptedOffer
            && (string) $needRequest->acceptedOffer->provider_id === (string) $request->user()->id;

        if (! $isProvider && ! $this->isModerator($request)) {
            return response()->json(['message' => 'Only the accepted provider can post progress'], 403);
        }

        if ($needRequest->status !== NeedRequest::STATUS_IN_PROGRESS) {
            return response()->json(['message' => "Progress applies to work in progress ('{$needRequest->status}')"], 422);
        }

        $note = $validated['note'];
        if (! empty($validated['evidence_url'])) {
            $note .= "\nEvidence: " . $validated['evidence_url'];
        }

        $this->record($needRequest, $needRequest->status, $needRequest->status, 'progress', $note);
        $this->notifications->notify(
            (string) $needRequest->user_id,
            'Work update',
            "'{$needRequest->title}': {$validated['note']}",
            'need_progress',
            $needRequest->id
        );

        return response()->json(['message' => 'Progress recorded']);
    }

    /**
     * GET /api/need-requests/{id}/scope-changes — owner, provider, admin.
     */
    public function scopeChanges(Request $request, string $id): JsonResponse
    {
        $needRequest = NeedRequest::find($id);
        if (! $needRequest) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        $userId = (string) $request->user()->id;
        $isParty = $userId === (string) $needRequest->user_id
            || ($needRequest->acceptedOffer && $userId === (string) $needRequest->acceptedOffer->provider_id);

        if (! $isParty && ! $this->isAdmin($request)) {
            return response()->json(['message' => 'You do not have access to this request'], 403);
        }

        $changes = \Modules\Needs\Entities\NeedScopeChange::with('requester:id,name')
            ->where('need_request_id', $id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $changes]);
    }

    /**
     * POST /api/need-requests/{id}/scope-changes — either party proposes a
     * material change while work is active. Nothing applies silently: the
     * counterparty must accept, and the original terms stay untouched until
     * then.
     */
    public function proposeScopeChange(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'summary' => ['required', 'string', 'max:2000'],
            'price_effect' => ['nullable', 'numeric', 'min:0'],
            'time_effect' => ['nullable', 'string', 'max:255'],
        ]);

        $needRequest = NeedRequest::find($id);
        if (! $needRequest) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        $userId = (string) $request->user()->id;
        $isOwner = $userId === (string) $needRequest->user_id;
        $isProvider = $needRequest->acceptedOffer && $userId === (string) $needRequest->acceptedOffer->provider_id;

        if (! $isOwner && ! $isProvider) {
            return response()->json(['message' => 'Only the owner or the accepted provider can propose changes'], 403);
        }

        if (! in_array($needRequest->status, [
            NeedRequest::STATUS_ACCEPTED,
            NeedRequest::STATUS_PAID,
            NeedRequest::STATUS_IN_PROGRESS,
            NeedRequest::STATUS_FULFILLED,
        ], true)) {
            return response()->json(['message' => "Scope changes apply to active work ('{$needRequest->status}')"], 422);
        }

        $change = \Modules\Needs\Entities\NeedScopeChange::create([
            'need_request_id' => $id,
            'requested_by' => $request->user()->id,
            'summary' => $validated['summary'],
            'price_effect' => $validated['price_effect'] ?? null,
            'time_effect' => $validated['time_effect'] ?? null,
            'status' => \Modules\Needs\Entities\NeedScopeChange::STATUS_PROPOSED,
        ]);

        $this->record($needRequest, $needRequest->status, $needRequest->status, 'scope_proposed', $validated['summary']);

        $counterparty = $isOwner
            ? $needRequest->acceptedOffer?->provider_id
            : $needRequest->user_id;
        if ($counterparty) {
            $this->notifications->notify(
                (string) $counterparty,
                'Scope change proposed',
                "'{$needRequest->title}': {$validated['summary']}",
                'need_scope_proposed',
                $needRequest->id
            );
        }

        return response()->json(['message' => 'Scope change proposed', 'data' => $change], 201);
    }

    /**
     * POST /api/need-scope-changes/{changeId}/{decision} — the counterparty
     * accepts or rejects. An accepted price effect becomes the agreed payout
     * figure (the offer row itself is never rewritten); acceptance is
     * recorded on the timeline with the before/after amounts.
     */
    public function decideScopeChange(Request $request, string $changeId, string $decision): JsonResponse
    {
        if (! in_array($decision, ['accept', 'reject'], true)) {
            return response()->json(['message' => "Unknown decision '{$decision}'"], 404);
        }

        $change = \Modules\Needs\Entities\NeedScopeChange::with('request.acceptedOffer')->find($changeId);
        if (! $change) {
            return response()->json(['message' => 'Scope change not found'], 404);
        }

        $needRequest = $change->request;
        $userId = (string) $request->user()->id;
        $isOwner = $userId === (string) $needRequest->user_id;
        $isProvider = $needRequest->acceptedOffer && $userId === (string) $needRequest->acceptedOffer->provider_id;

        // Decider must be the counterparty, never the proposer.
        $isProposer = $userId === (string) $change->requested_by;
        if ($isProposer || (! $isOwner && ! $isProvider)) {
            return response()->json(['message' => 'Only the counterparty can decide this change'], 403);
        }

        if ($change->status !== \Modules\Needs\Entities\NeedScopeChange::STATUS_PROPOSED) {
            return response()->json(['message' => "This change is already decided ('{$change->status}')"], 422);
        }

        if (in_array($needRequest->status, [NeedRequest::STATUS_COMPLETED, NeedRequest::STATUS_REFUNDED], true)) {
            return response()->json(['message' => 'Closed work cannot change scope'], 422);
        }

        $change->update([
            'status' => $decision === 'accept'
                ? \Modules\Needs\Entities\NeedScopeChange::STATUS_ACCEPTED
                : \Modules\Needs\Entities\NeedScopeChange::STATUS_REJECTED,
            'decided_by' => $request->user()->id,
            'decided_at' => now(),
        ]);

        if ($decision === 'accept' && $change->price_effect !== null) {
            $before = $needRequest->agreed_price_override ?? $needRequest->acceptedOffer?->price;
            $needRequest->update(['agreed_price_override' => $change->price_effect]);
            $this->record(
                $needRequest,
                $needRequest->status,
                $needRequest->status,
                'scope_accepted',
                "Agreed price {$before} → {$change->price_effect}: {$change->summary}"
            );
        } else {
            $this->record($needRequest, $needRequest->status, $needRequest->status, 'scope_' . $decision . 'ed', $change->summary);
        }

        $this->notifications->notify(
            (string) $change->requested_by,
            "Scope change {$decision}ed",
            "'{$needRequest->title}': {$change->summary}",
            'need_scope_decided',
            $needRequest->id
        );

        return response()->json([
            'message' => "Scope change {$decision}ed",
            'data' => $change->fresh(),
        ]);
    }

    /**
     * TODO 18 duplicate-as-draft: restart from any owned request as a fresh
     * draft. History (events, offers, payment) never copies — only the
     * brief, plus its question snapshot so answers stay meaningful.
     */
    public function duplicate(Request $request, string $id): JsonResponse
    {
        $source = NeedRequest::find($id);
        if (! $source) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        if ((string) $source->user_id !== (string) $request->user()->id) {
            return response()->json(['message' => 'Only the owner can duplicate this request'], 403);
        }

        $copy = NeedRequest::create([
            'user_id' => $request->user()->id,
            'category_id' => $source->category_id,
            'request_number' => 'NR-' . strtoupper(uniqid()),
            'title' => $source->title,
            'description' => $source->description,
            'subcategory' => $source->subcategory,
            'budget_min' => $source->budget_min,
            'budget_max' => $source->budget_max,
            'quantity' => $source->quantity,
            'currency' => $source->currency,
            'pricing_basis' => $source->pricing_basis,
            'country' => $source->country,
            'state' => $source->state,
            'lga' => $source->lga,
            'city' => $source->city,
            'location' => $source->location,
            'is_remote' => $source->is_remote,
            'preferred_date' => $source->preferred_date,
            'deadline' => null,
            'service_requirements' => $source->service_requirements,
            'delivery_requirements' => $source->delivery_requirements,
            'notes' => $source->notes,
            'answers' => $source->answers,
            'form_schema_snapshot' => $source->form_schema_snapshot,
            'form_schema_version' => $source->form_schema_version,
            'visibility' => $source->visibility,
            'invited_provider_ids' => $source->invited_provider_ids,
            'status' => NeedRequest::STATUS_DRAFT,
        ]);
        $this->record($copy, null, NeedRequest::STATUS_DRAFT, 'create', 'Duplicated from ' . $source->request_number);

        return response()->json(['message' => 'Draft copy created', 'data' => $copy], 201);
    }

    /**
     * TODO 18 visibility management: invite-only ⇄ public while work is
     * still open. Going invite-only demands invitees; going public always
     * works. Invitees can be trimmed (adding new ones needs the provider
     * directory, TODO 19).
     */
    public function visibility(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'visibility' => ['required', 'string', \Illuminate\Validation\Rule::in([NeedRequest::VISIBILITY_PUBLIC, NeedRequest::VISIBILITY_INVITE_ONLY])],
            'invited_provider_ids' => ['nullable', 'array', 'max:50'],
            'invited_provider_ids.*' => ['uuid', 'exists:users,id'],
        ]);

        $needRequest = NeedRequest::find($id);
        if (! $needRequest) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        if ((string) $needRequest->user_id !== (string) $request->user()->id) {
            return response()->json(['message' => 'Only the owner can change visibility'], 403);
        }

        if (in_array($needRequest->status, [
            NeedRequest::STATUS_COMPLETED,
            NeedRequest::STATUS_CANCELLED,
            NeedRequest::STATUS_REFUNDED,
            NeedRequest::STATUS_EXPIRED,
        ], true)) {
            return response()->json(['message' => "Visibility cannot change in status '{$needRequest->status}'"], 422);
        }

        // Trimming the circle can only narrow to still-listed providers.
        $invitees = $validated['invited_provider_ids'] ?? $needRequest->invited_provider_ids ?? [];
        if ($validated['visibility'] === NeedRequest::VISIBILITY_INVITE_ONLY && empty($invitees)) {
            return response()->json(['message' => 'Invitation-only requests need at least one invited provider'], 422);
        }

        $needRequest->update([
            'visibility' => $validated['visibility'],
            'invited_provider_ids' => $validated['visibility'] === NeedRequest::VISIBILITY_INVITE_ONLY ? array_values($invitees) : null,
        ]);
        $this->record($needRequest, $needRequest->status, $needRequest->status, 'visibility_changed', 'Visibility: ' . $validated['visibility']);

        // N-26: widening a still-open request to the public marketplace
        // exposes it to providers who could not see it before — give the
        // top matches the same push they would have gotten at publish.
        if ($validated['visibility'] === NeedRequest::VISIBILITY_PUBLIC
            && $needRequest->status === NeedRequest::STATUS_PUBLISHED) {
            $this->notifyMatchedProviders($needRequest);
        }

        return response()->json(['message' => 'Visibility updated', 'data' => $needRequest->fresh()]);
    }

    /**
     * TODO 19 provider workspace: my offers across requests with statuses.
     */
    public function myOffers(Request $request): JsonResponse
    {
        $offers = NeedOffer::with(['request:id,request_number,title,status,user_id', 'revisions'])
            ->where('provider_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $offers->items(),
            'meta' => [
                'current_page' => $offers->currentPage(),
                'last_page' => $offers->lastPage(),
                'per_page' => $offers->perPage(),
                'total' => $offers->total(),
            ],
        ]);
    }

    /**
     * TODO 19 provider workspace: requests where I am the accepted provider
     * and work is still open, with booking + next-step context.
     */
    public function myWork(Request $request): JsonResponse
    {
        $userId = (string) $request->user()->id;

        $rows = NeedRequest::with(['category:id,name,slug'])
            ->whereHas('acceptedOffer', fn ($q) => $q->where('provider_id', $userId))
            ->whereIn('status', [
                NeedRequest::STATUS_ACCEPTED,
                NeedRequest::STATUS_PAYMENT_PENDING,
                NeedRequest::STATUS_PAID,
                NeedRequest::STATUS_IN_PROGRESS,
                NeedRequest::STATUS_FULFILLED,
                NeedRequest::STATUS_DISPUTED,
            ])
            ->orderByDesc('updated_at')
            ->paginate($request->get('per_page', 15));

        $requestIds = collect($rows->items())->pluck('id')->all();
        $bookings = \Modules\Needs\Entities\NeedBooking::whereIn('need_request_id', $requestIds)
            ->where('status', \Modules\Needs\Entities\NeedBooking::STATUS_SCHEDULED)
            ->get()
            ->keyBy('need_request_id');

        $data = collect($rows->items())->map(function ($r) use ($bookings) {
            $row = $r->toArray();
            $row['booking'] = $bookings->get($r->id);
            return $row;
        })->all();

        return response()->json([
            'data' => $data,
            'meta' => [
                'current_page' => $rows->currentPage(),
                'last_page' => $rows->lastPage(),
                'per_page' => $rows->perPage(),
                'total' => $rows->total(),
            ],
        ]);
    }

    /**
     * TODO 11 explainable matching: ranked eligible providers for one
     * request, each with its reasons. Owner or admin only — the ranking
     * reflects non-public profile details.
     */
    public function matches(Request $request, string $id): JsonResponse
    {
        $needRequest = NeedRequest::with('category')->find($id);
        if (! $needRequest) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        $isOwner = (string) $needRequest->user_id === (string) $request->user()->id;
        if (! $isOwner && ! $this->isAdmin($request)) {
            return response()->json(['message' => 'Only the owner can view matches'], 403);
        }

        $limit = max(1, min((int) $request->get('limit', 10), 50));

        return response()->json([
            'data' => app(\Modules\Needs\Services\NeedMatcher::class)->matchForRequest($needRequest, $limit),
        ]);
    }

    /**
     * TODO 11 provider side: open requests annotated with eligibility, so
     * providers see why they can (or cannot) bid instead of guessing.
     */
    public function myMatches(Request $request): JsonResponse
    {
        $limit = max(1, min((int) $request->get('limit', 20), 50));

        return response()->json(
            app(\Modules\Needs\Services\NeedMatcher::class)->matchForProvider((string) $request->user()->id, $limit)
        );
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $needRequest = NeedRequest::with([
            'offers.provider',
            'category:id,name,slug',
            'user:id,name',
            'events.actor:id,name',
        ])->find($id);

        if (!$needRequest) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        $isOwner = (string) $needRequest->user_id === (string) $request->user()->id;
        $isAdmin = $this->isAdmin($request);
        $hasOffered = $needRequest->offers->contains('provider_id', $request->user()->id);

        // Non-owners who never offered may only view publicly listed requests
        if (!$isOwner && !$isAdmin && !$hasOffered) {
            if (!in_array($needRequest->status, NeedRequest::OPEN_STATUSES, true)) {
                return response()->json(['message' => 'You do not have access to this request'], 403);
            }
            // Invitation-only rows stay invisible even while open (TODO 06 §7).
            if ($needRequest->visibility === NeedRequest::VISIBILITY_INVITE_ONLY
                && ! $needRequest->isProviderInvited((string) $request->user()->id)) {
                return response()->json(['message' => 'You do not have access to this request'], 403);
            }
        }

        $data = $needRequest->toArray();

        // Spec S12 timeline (transition history) for everyone who can view.
        $data['timeline'] = ($data['events'] ?? []) ?? [];

        // Spec S12 payment state - owner/admin only.
        $data['payment'] = null;
        if ($isOwner || $isAdmin) {
            $payment = \Modules\Payments\Entities\Payment::where('order_id', $needRequest->id)
                ->where('reference', 'like', 'NRPAY-%')
                ->orderByDesc('created_at')
                ->first();
            if ($payment) {
                $data['payment'] = [
                    'reference' => $payment->reference,
                    'amount' => $payment->amount,
                    'currency' => $payment->currency ?? \Core\Support\Currencies::default(),
                    'status' => $payment->status,
                    'created_at' => $payment->created_at,
                ];
            }
        }

        // Hide competing offer details from non-owners
        if (!$isOwner && !$isAdmin) {
            $data['offers'] = array_values(array_filter(
                $data['offers'] ?? [],
                fn ($o) => ($o['provider_id'] ?? null) === $request->user()->id
            ));
        }

        // N-27: applicant availability flags ride the detail payload.
        $data['offers'] = $this->attachApplicantFlags($data['offers'] ?? []);

        return response()->json(['data' => $data]);
    }

    public function offers(Request $request, string $id): JsonResponse
    {
        // TODO 12: revision history rides along so re-submits stay auditable.
        $needRequest = NeedRequest::with(['offers.provider', 'offers.revisions'])->find($id);

        if (!$needRequest) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        $isOwner = (string) $needRequest->user_id === (string) $request->user()->id;
        if (!$isOwner && !$this->isAdmin($request)) {
            return response()->json(['message' => 'Only the request owner can view all offers'], 403);
        }

        return response()->json(['data' => $this->attachApplicantFlags($needRequest->offers->toArray())]);
    }

    public function submitOffer(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'price' => 'required|numeric|min:0.01',
            'message' => 'nullable|string|max:2000',
            'scope_of_work' => 'nullable|string|max:5000',
            'deliverables' => 'nullable|string|max:2000',
            'exclusions' => 'nullable|string|max:2000',
            'estimated_duration' => 'nullable|string|max:120',
            'terms' => 'nullable|string|max:2000',
            'expires_at' => 'nullable|date|after:now',
        ]);

        $needRequest = NeedRequest::where('id', $id)->lockForUpdate()->first();

        if (!$needRequest) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        if ((string) $needRequest->user_id === (string) $request->user()->id) {
            return response()->json(['message' => 'You cannot bid on your own request'], 422);
        }

        if (!in_array($needRequest->status, NeedRequest::OPEN_STATUSES, true)) {
            return response()->json(['message' => "This request is no longer accepting offers ('{$needRequest->status}')"], 422);
        }

        // TODO 08 provider eligibility: suspension blocks everywhere; flagged
        // categories additionally demand an approved profile + verified KYC.
        $providerId = (string) $request->user()->id;
        if (\Modules\Needs\Entities\NeedProviderProfile::isSuspended($providerId)) {
            return response()->json(['message' => 'Your provider account is suspended; contact support'], 403);
        }
        if ($needRequest->category?->requires_verified_provider
            && ! \Modules\Needs\Entities\NeedProviderProfile::isEligible($providerId)) {
            return response()->json(['message' => 'This category requires a verified provider profile and identity'], 403);
        }

        if ($needRequest->visibility === NeedRequest::VISIBILITY_INVITE_ONLY
            && ! $needRequest->isProviderInvited((string) $request->user()->id)) {
            return response()->json(['message' => 'This request is invitation-only'], 403);
        }

        $existing = NeedOffer::where('need_request_id', $id)
            ->where('provider_id', $request->user()->id)
            ->first();

        $isNegotiation = (bool) $existing;

        if ($existing) {
            // Negotiation: a NEW revision row preserves history; the standing
            // row carries the latest terms (TODO 12 — never overwrite).
            if (in_array($existing->status, [NeedOffer::STATUS_ACCEPTED, NeedOffer::STATUS_EXPIRED], true)) {
                return response()->json(['message' => "This offer can no longer be revised ('{$existing->status}')"], 422);
            }
            $revisionNo = ((int) $existing->revision_no) + 1;
            $existing->update(array_merge($validated, [
                'status' => NeedOffer::STATUS_PENDING,
                'revision_no' => $revisionNo,
            ]));
            \Modules\Needs\Entities\NeedOfferRevision::create([
                'need_offer_id' => $existing->id,
                'revision_no' => $revisionNo,
                'price' => $existing->price,
                'message' => $existing->message,
                'scope_of_work' => $existing->scope_of_work,
                'deliverables' => $existing->deliverables,
                'exclusions' => $existing->exclusions,
                'estimated_duration' => $existing->estimated_duration,
                'terms' => $existing->terms,
            ]);

            $offer = $existing;
        } else {
            $offer = NeedOffer::create(array_merge($validated, [
                'need_request_id' => $id,
                'provider_id' => $request->user()->id,
                'status' => NeedOffer::STATUS_PENDING,
                'revision_no' => 1,
            ]));
            \Modules\Needs\Entities\NeedOfferRevision::create([
                'need_offer_id' => $offer->id,
                'revision_no' => 1,
                'price' => $offer->price,
                'message' => $offer->message,
                'scope_of_work' => $offer->scope_of_work,
                'deliverables' => $offer->deliverables,
                'exclusions' => $offer->exclusions,
                'estimated_duration' => $offer->estimated_duration,
                'terms' => $offer->terms,
            ]);
        }

        $previous = $needRequest->status;
        // Spec S13: re-submitting a standing offer moves the request into
        // Negotiation; a first offer marks it as Offers Received.
        $needRequest->update([
            'status' => $isNegotiation ? NeedRequest::STATUS_NEGOTIATING : NeedRequest::STATUS_OFFERED,
        ]);
        $this->record($needRequest, $previous, $needRequest->status, $isNegotiation ? 'negotiate' : 'offer');

        $this->notifications->notify(
            (string) $needRequest->user_id,
            $isNegotiation ? 'Updated offer on your request' : 'New offer on your request',
            "You received an offer of \${$offer->price} for '{$needRequest->title}'.",
            'need_offer',
            $needRequest->id
        );

        return response()->json([
            'message' => 'Offer submitted',
            'data' => $offer,
        ], 201);
    }

    /**
     * TODO 12 withdrawal: the bidding provider retracts a pending offer.
     * Withdrawn offers stay visible as history but can never be accepted.
     */
    public function withdrawOffer(Request $request, string $id, string $offerId): JsonResponse
    {
        $offer = NeedOffer::where('id', $offerId)
            ->where('need_request_id', $id)
            ->where('provider_id', $request->user()->id)
            ->first();

        if (! $offer) {
            return response()->json(['message' => 'Offer not found'], 404);
        }

        if ($offer->status !== NeedOffer::STATUS_PENDING) {
            return response()->json(['message' => "Only pending offers can be withdrawn ('{$offer->status}')"], 422);
        }

        $offer->update(['status' => NeedOffer::STATUS_WITHDRAWN]);

        $needRequest = $offer->request;
        if ($needRequest) {
            $this->record($needRequest, $needRequest->status, $needRequest->status, 'offer_withdrawn', "Offer {$offer->id} withdrawn");
            $this->notifications->notify(
                (string) $needRequest->user_id,
                'An offer was withdrawn',
                "A provider withdrew their offer on '{$needRequest->title}'.",
                'need_offer_withdrawn',
                $needRequest->id
            );
        }

        return response()->json([
            'message' => 'Offer withdrawn',
            'data' => $offer->fresh(),
        ]);
    }

    public function acceptOffer(Request $request, string $id, string $offerId): JsonResponse
    {
        // TODO 12 atomicity: row-lock the request so two concurrent accepts
        // serialize — exactly one offer can win, the loser sees no pending row.
        $needRequest = NeedRequest::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->lockForUpdate()
            ->first();

        if (!$needRequest) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        if (!in_array($needRequest->status, NeedRequest::OPEN_STATUSES, true)) {
            return response()->json(['message' => "Cannot accept offers in status '{$needRequest->status}'"], 422);
        }

        $offer = NeedOffer::where('id', $offerId)
            ->where('need_request_id', $id)
            ->where('status', NeedOffer::STATUS_PENDING)
            ->lockForUpdate()
            ->first();

        if (!$offer) {
            return response()->json(['message' => 'Pending offer not found'], 404);
        }

        // Expired quotations can never be accepted, even mid-race.
        if ($offer->isExpired()) {
            $offer->update(['status' => NeedOffer::STATUS_EXPIRED]);
            return response()->json(['message' => 'This offer has expired'], 422);
        }

        $previous = $needRequest->status;
        DB::transaction(function () use ($needRequest, $offer) {
            NeedOffer::where('need_request_id', $needRequest->id)
                ->where('status', NeedOffer::STATUS_PENDING)
                ->update(['status' => NeedOffer::STATUS_REJECTED]);

            $offer->update(['status' => NeedOffer::STATUS_ACCEPTED]);
            $needRequest->update(['status' => NeedRequest::STATUS_ACCEPTED]);
        });
        $this->record($needRequest, $previous, NeedRequest::STATUS_ACCEPTED, 'accept_offer');

        $this->notifications->notify(
            (string) $offer->provider_id,
            'Your offer was accepted!',
            "'{$needRequest->title}' — awaiting payment to begin work.",
            'need_offer_accepted',
            $needRequest->id
        );

        return response()->json([
            'message' => 'Offer accepted. Proceed to payment.',
            'data' => [
                'request' => $needRequest->fresh(),
                'accepted_offer' => $offer->fresh(),
            ],
        ]);
    }

    public function rejectOffer(Request $request, string $id, string $offerId): JsonResponse
    {
        $needRequest = NeedRequest::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$needRequest) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        if (!in_array($needRequest->status, NeedRequest::OPEN_STATUSES, true)) {
            return response()->json(['message' => "Cannot reject offers in status '{$needRequest->status}'"], 422);
        }

        $offer = NeedOffer::where('id', $offerId)
            ->where('need_request_id', $id)
            ->where('status', NeedOffer::STATUS_PENDING)
            ->first();

        if (!$offer) {
            return response()->json(['message' => 'Pending offer not found'], 404);
        }

        $offer->update(['status' => NeedOffer::STATUS_REJECTED]);
        $this->record($needRequest, $needRequest->status, $needRequest->status, 'reject_offer', "Offer {$offer->id} rejected");

        $this->notifications->notify(
            (string) $offer->provider_id,
            'Offer declined',
            "'{$needRequest->title}' — your offer was declined.",
            'need_offer_rejected',
            $needRequest->id
        );

        $remaining = NeedOffer::where('need_request_id', $id)
            ->where('status', NeedOffer::STATUS_PENDING)
            ->count();

        if ($remaining === 0) {
            $previous = $needRequest->status;
            $needRequest->update(['status' => NeedRequest::STATUS_REVIEWING]);
            $this->record($needRequest, $previous, NeedRequest::STATUS_REVIEWING, 'reviewing');
        }

        return response()->json([
            'message' => 'Offer rejected.',
            'data' => [
                'request' => $needRequest->fresh(),
                'offer' => $offer->fresh(),
            ],
        ]);
    }

    /**
     * Pay for the accepted offer — server-authoritative amount.
     * Spec S13: reachable from Accepted directly or through Payment Pending.
     */
    public function pay(Request $request, string $id): JsonResponse
    {
        $needRequest = NeedRequest::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$needRequest) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        if (!in_array($needRequest->status, [NeedRequest::STATUS_ACCEPTED, NeedRequest::STATUS_PAYMENT_PENDING], true)) {
            return response()->json(['message' => 'Accept an offer before paying'], 422);
        }

        $offer = $needRequest->acceptedOffer;

        if (!$offer || $offer->status !== NeedOffer::STATUS_ACCEPTED) {
            return response()->json(['message' => 'No accepted offer found'], 422);
        }

        $previous = $needRequest->status;
        $payment = DB::transaction(function () use ($needRequest, $offer, $request) {
            // Routed through the payment abstraction (§25) — server owns the
            // amount (accepted offer price), never the client.
            $result = app(\Core\Services\Contracts\PaymentGatewayInterface::class)->charge([
                'order_id' => $needRequest->id,
                'user_id' => $request->user()->id,
                'amount' => $offer->price,
                'currency' => $needRequest->currency ?: \Core\Support\Currencies::default(),
                'method' => $request->input('method', 'card'),
                'reference' => 'NRPAY-'.strtoupper(uniqid()),
                'idempotency_key' => 'NRPAY-'.$needRequest->id,
                'purpose' => 'need_payment',
            ]);

            if (!($result['success'] ?? false)) {
                throw new \RuntimeException($result['error'] ?? 'Payment failed');
            }

            $payment = \Modules\Payments\Entities\Payment::find($result['payment_id']);
            $payment->update(['gateway_response' => array_merge(
                (array) ($payment->gateway_response ?? []),
                ['kind' => 'need_request'],
            )]);

            $needRequest->update(['status' => NeedRequest::STATUS_PAID]);

            return $payment;
        });
        $this->record($needRequest, $previous, NeedRequest::STATUS_PAID, 'pay');

        $this->notifications->notify(
            (string) $offer->provider_id,
            'Payment received',
            "'{$needRequest->title}' is paid — you can start work now.",
            'need_paid',
            $needRequest->id
        );

        return response()->json([
            'message' => 'Payment successful',
            'data' => [
                'payment_reference' => $payment->reference,
                'amount' => $payment->amount,
                'request_status' => NeedRequest::STATUS_PAID,
            ],
        ], 201);
    }

    /**
     * Server-controlled lifecycle transitions (spec S13). Every transition
     * is authorized here - the client can never write status directly.
     *
     *  owner:      submit (draft→pending), publish, payment, cancel, expire
     *  provider:   start, fulfill, complete, dispute
     *  moderator:  reject, expire, refund, (+ provider/owner powers)
     */
    public function transition(Request $request, string $id, string $action): JsonResponse
    {
        $needRequest = NeedRequest::find($id);

        if (!$needRequest) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        $user = $request->user();
        $isOwner = (string) $needRequest->user_id === (string) $user->id;
        $isProvider = $needRequest->acceptedOffer
            && (string) $needRequest->acceptedOffer->provider_id === (string) $user->id;
        $isModerator = $this->isModerator($request);
        $status = $needRequest->status;

        switch ($action) {
            case 'submit':
                if (!$isOwner) {
                    return response()->json(['message' => 'Only the owner can submit this request'], 403);
                }
                if ($status !== NeedRequest::STATUS_DRAFT) {
                    return response()->json(['message' => "Only drafts can be submitted ('{$status}')"], 422);
                }
                $needRequest->update(['status' => NeedRequest::STATUS_PENDING]);
                $this->record($needRequest, $status, NeedRequest::STATUS_PENDING, 'submit');
                $message = 'Request submitted';
                break;

            case 'publish':
                if (!$isOwner) {
                    return response()->json(['message' => 'Only the owner can publish this request'], 403);
                }
                if ($status !== NeedRequest::STATUS_PENDING) {
                    return response()->json(['message' => "Only submitted requests can be published ('{$status}')"], 422);
                }
                $needRequest->update(['status' => NeedRequest::STATUS_PUBLISHED]);
                $this->record($needRequest, $status, NeedRequest::STATUS_PUBLISHED, 'publish');
                $this->notifyMatchedProviders($needRequest);
                $message = 'Request published';
                break;

            case 'payment':
                if (!$isOwner) {
                    return response()->json(['message' => 'Only the owner can proceed to payment'], 403);
                }
                if ($status !== NeedRequest::STATUS_ACCEPTED) {
                    return response()->json(['message' => "Payment can only follow acceptance ('{$status}')"], 422);
                }
                $needRequest->update(['status' => NeedRequest::STATUS_PAYMENT_PENDING]);
                $this->record($needRequest, $status, NeedRequest::STATUS_PAYMENT_PENDING, 'payment');
                $message = 'Awaiting payment';
                break;

            case 'start':
                if (!$isProvider) {
                    return response()->json(['message' => 'Only the accepted provider can start work'], 403);
                }
                if ($status !== NeedRequest::STATUS_PAID) {
                    return response()->json(['message' => 'Work can only start once paid'], 422);
                }
                $needRequest->update(['status' => NeedRequest::STATUS_IN_PROGRESS]);
                $this->record($needRequest, $status, NeedRequest::STATUS_IN_PROGRESS, 'start');
                $message = 'Work started';
                break;

            case 'fulfill':
                if (!$isProvider && !$isModerator) {
                    return response()->json(['message' => 'Only the accepted provider can submit delivered work'], 403);
                }
                if ($status !== NeedRequest::STATUS_IN_PROGRESS) {
                    return response()->json(['message' => "Work can only be fulfilled while in progress ('{$status}')"], 422);
                }
                // TODO 15 deliverables ride on the submission (never required,
                // always preserved in the timeline note).
                $evidence = $request->validate([
                    'evidence_url' => 'nullable|url|max:500',
                    'completion_note' => 'nullable|string|max:2000',
                ]);
                $needRequest->update(['status' => NeedRequest::STATUS_FULFILLED]);
                $noteParts = [];
                if (! empty($evidence['completion_note'])) {
                    $noteParts[] = $evidence['completion_note'];
                }
                if (! empty($evidence['evidence_url'])) {
                    $noteParts[] = 'Deliverable: ' . $evidence['evidence_url'];
                }
                $this->record($needRequest, $status, NeedRequest::STATUS_FULFILLED, 'fulfill', $noteParts === [] ? null : implode("\n", $noteParts));
                $this->notifications->notify(
                    (string) $needRequest->user_id,
                    'Work delivered',
                    "'{$needRequest->title}' has been submitted for your review.",
                    'need_fulfilled',
                    $needRequest->id
                );
                $message = 'Work submitted for review';
                break;

            case 'complete':
                if (!$isProvider && !$isModerator) {
                    return response()->json(['message' => 'Only the accepted provider can complete work'], 403);
                }
                if (!in_array($status, [NeedRequest::STATUS_IN_PROGRESS, NeedRequest::STATUS_FULFILLED], true)) {
                    return response()->json(['message' => 'Work has not started yet'], 422);
                }
                $offer = $needRequest->acceptedOffer;

                DB::transaction(function () use ($needRequest, $offer) {
                    $needRequest->update(['status' => NeedRequest::STATUS_COMPLETED]);
                    $this->releasePayout($needRequest, $offer);
                });
                $this->record($needRequest, $status, NeedRequest::STATUS_COMPLETED, 'complete');

                $this->notifications->notify(
                    (string) $needRequest->user_id,
                    'Your request is completed',
                    "'{$needRequest->title}' has been marked as completed.",
                    'need_completed',
                    $needRequest->id
                );
                if ($offer) {
                    $paidOut = $needRequest->agreed_price_override ?? $offer->price;
                    $this->notifications->notify(
                        (string) $offer->provider_id,
                        'Payment released',
                        "'{$needRequest->title}' — \${$paidOut} payout has been released.",
                        'need_payout',
                        $needRequest->id
                    );
                }
                $message = 'Work completed';
                break;

            case 'accept':
                // TODO 15 customer acceptance: the owner confirms the
                // delivered work, which releases the payout. Provider-direct
                // `complete` stays for simple jobs (pinned behavior).
                if (!$isOwner) {
                    return response()->json(['message' => 'Only the owner can accept delivered work'], 403);
                }
                if ($status !== NeedRequest::STATUS_FULFILLED) {
                    return response()->json(['message' => "There is no delivered work to accept ('{$status}')"], 422);
                }
                $offer = $needRequest->acceptedOffer;

                DB::transaction(function () use ($needRequest, $offer) {
                    $needRequest->update(['status' => NeedRequest::STATUS_COMPLETED]);
                    $this->releasePayout($needRequest, $offer);
                });
                $this->record($needRequest, $status, NeedRequest::STATUS_COMPLETED, 'accept');
                if ($offer) {
                    $this->notifications->notify(
                        (string) $offer->provider_id,
                        'Work accepted',
                        "'{$needRequest->title}' was accepted and your payout has been released.",
                        'need_payout',
                        $needRequest->id
                    );
                }
                $message = 'Work accepted';
                break;

            case 'cancel':
                if (!$isOwner && !$isModerator) {
                    return response()->json(['message' => 'Only the owner can cancel this request'], 403);
                }
                if (!in_array($status, [
                    NeedRequest::STATUS_PENDING,
                    NeedRequest::STATUS_PUBLISHED,
                    NeedRequest::STATUS_REVIEWING,
                    NeedRequest::STATUS_OFFERED,
                    NeedRequest::STATUS_NEGOTIATING,
                    NeedRequest::STATUS_PAYMENT_PENDING,
                ], true)) {
                    return response()->json(['message' => "Cannot cancel in status '{$status}'"], 422);
                }
                $needRequest->update(['status' => NeedRequest::STATUS_CANCELLED]);
                $this->record($needRequest, $status, NeedRequest::STATUS_CANCELLED, 'cancel');
                $message = 'Request cancelled';
                break;

            case 'reject':
                if (!$isModerator) {
                    return response()->json(['message' => 'Only a moderator can reject this request'], 403);
                }
                if (!in_array($status, [
                    NeedRequest::STATUS_PENDING,
                    NeedRequest::STATUS_PUBLISHED,
                    NeedRequest::STATUS_REVIEWING,
                    NeedRequest::STATUS_OFFERED,
                    NeedRequest::STATUS_NEGOTIATING,
                    NeedRequest::STATUS_ACCEPTED,
                ], true)) {
                    return response()->json(['message' => "Cannot reject in status '{$status}'"], 422);
                }
                $needRequest->update(['status' => NeedRequest::STATUS_REJECTED]);
                $this->record($needRequest, $status, NeedRequest::STATUS_REJECTED, 'reject');
                $this->notifications->notify(
                    (string) $needRequest->user_id,
                    'Request rejected',
                    "'{$needRequest->title}' was rejected by the moderation team.",
                    'need_rejected',
                    $needRequest->id
                );
                $message = 'Request rejected';
                break;

            case 'expire':
                if (!$isOwner && !$isModerator) {
                    return response()->json(['message' => 'Only the owner or a moderator can expire this request'], 403);
                }
                if (!in_array($status, NeedRequest::OPEN_STATUSES, true) && $status !== NeedRequest::STATUS_DRAFT) {
                    return response()->json(['message' => "Cannot expire in status '{$status}'"], 422);
                }
                $needRequest->update(['status' => NeedRequest::STATUS_EXPIRED]);
                $this->record($needRequest, $status, NeedRequest::STATUS_EXPIRED, 'expire');
                $this->notifications->notify(
                    (string) $needRequest->user_id,
                    'Request expired',
                    "'{$needRequest->title}' has expired and no longer accepts offers.",
                    'need_expired',
                    $needRequest->id
                );
                $message = 'Request expired';
                break;

            case 'dispute':
                if (!$isOwner && !$isProvider) {
                    return response()->json(['message' => 'Only the owner or the provider can raise a dispute'], 403);
                }
                if (!in_array($status, [
                    NeedRequest::STATUS_PAID,
                    NeedRequest::STATUS_IN_PROGRESS,
                    NeedRequest::STATUS_FULFILLED,
                ], true)) {
                    return response()->json(['message' => "Disputes can only be raised while work is underway ('{$status}')"], 422);
                }
                $needRequest->update(['status' => NeedRequest::STATUS_DISPUTED]);
                $this->record($needRequest, $status, NeedRequest::STATUS_DISPUTED, 'dispute');
                $counterparty = $isOwner
                    ? ($needRequest->acceptedOffer?->provider_id)
                    : $needRequest->user_id;
                if ($counterparty) {
                    $this->notifications->notify(
                        (string) $counterparty,
                        'Dispute opened',
                        "'{$needRequest->title}' has been disputed and is under review.",
                        'need_disputed',
                        $needRequest->id
                    );
                }
                $message = 'Dispute opened';
                break;

            case 'refund':
                if (!$isModerator) {
                    return response()->json(['message' => 'Only a moderator can refund this request'], 403);
                }
                if ($status !== NeedRequest::STATUS_DISPUTED) {
                    return response()->json(['message' => "Refunds follow a dispute ('{$status}')"], 422);
                }

                $payment = \Modules\Payments\Entities\Payment::where('order_id', $needRequest->id)
                    ->where('reference', 'like', 'NRPAY-%')
                    ->where('status', \Modules\Payments\Entities\Payment::STATUS_SUCCEEDED)
                    ->orderByDesc('created_at')
                    ->first();
                if (!$payment) {
                    return response()->json(['message' => 'No refundable payment found for this request'], 422);
                }

                $refund = app(\Core\Services\Contracts\PaymentGatewayInterface::class)->refund([
                    'payment_id' => $payment->id,
                    'amount' => $payment->amount,
                    'reason' => 'Need request disputed: '.$needRequest->request_number,
                ]);
                if (!($refund['success'] ?? false)) {
                    return response()->json(['message' => 'Refund failed: '.($refund['error'] ?? 'unknown error')], 422);
                }

                $needRequest->update(['status' => NeedRequest::STATUS_REFUNDED]);
                $this->record($needRequest, $status, NeedRequest::STATUS_REFUNDED, 'refund', 'Refund '.$refund['refund_id']);
                $offer = $needRequest->acceptedOffer;
                if ($offer) {
                    $this->notifications->notify(
                        (string) $offer->provider_id,
                        'Payment refunded',
                        "'{$needRequest->title}' was refunded to the requester.",
                        'need_refunded',
                        $needRequest->id
                    );
                }
                $message = 'Payment refunded';
                break;

            default:
                return response()->json(['message' => "Unknown action '{$action}'"], 404);
        }

        return response()->json([
            'message' => $message,
            'data' => $needRequest->fresh(),
        ]);
    }

    private function record(NeedRequest $needRequest, ?string $from, string $to, string $action, ?string $note = null): void
    {
        NeedRequestEvent::create([
            'need_request_id' => $needRequest->id,
            'actor_id' => auth('sanctum')->id() ?? auth()->id(),
            'from_status' => $from,
            'to_status' => $to,
            'action' => $action,
            'note' => $note,
        ]);
    }

    /**
     * N-27: every applicant row carries the provider's live pause state
     * and vetting status (one batched query). Missing profile row → both
     * flags null — an unprofiled invitee is neither verified nor paused.
     */
    private function attachApplicantFlags(array $offers): array
    {
        $ids = array_values(array_unique(array_filter(array_column($offers, 'provider_id'))));
        if ($ids === []) {
            return $offers;
        }

        $profiles = NeedProviderProfile::whereIn('user_id', $ids)
            ->get(['user_id', 'status', 'is_available'])
            ->keyBy(fn ($p) => (string) $p->user_id);

        foreach ($offers as &$offer) {
            $profile = $profiles[(string) ($offer['provider_id'] ?? '')] ?? null;
            $offer['provider_is_available'] = $profile?->is_available;
            $offer['provider_profile_status'] = $profile?->status;
        }
        unset($offer);

        return $offers;
    }

    /**
     * N-26 auto-match push: the moment a request opens to a pool of
     * providers, tell the best matches about it — public requests ping
     * the top 5 ranked by NeedMatcher, invite-only requests ping every
     * invitee (they are the only ones who can bid). Called again when a
     * published request widens from invite-only to public; the dedupe
     * guard makes the fan-out idempotent per (user, request) pair.
     *
     * Best-effort by design: the status transition above has already
     * committed, so a notification failure logs a warning instead of
     * failing the publish the owner just performed.
     */
    private function notifyMatchedProviders(NeedRequest $needRequest): void
    {
        try {
            $inviteOnly = $needRequest->visibility === NeedRequest::VISIBILITY_INVITE_ONLY;
            $limit = $inviteOnly ? 50 : 5;

            $result = $this->matcher->matchForRequest($needRequest, $limit);
            if ($result['matches'] === []) {
                return;
            }

            foreach ($result['matches'] as $match) {
                $userId = (string) $match['user_id'];
                // Publish is a one-way transition, but a replayed or
                // re-driven fan-out must not double-ping anyone — the
                // Core contract answers the idempotency question.
                if ($this->notifications->hasNotified($userId, 'need_match', (string) $needRequest->id)) {
                    continue;
                }

                $reasons = $match['reasons'] !== []
                    ? ' Matched on: ' . implode(', ', array_slice($match['reasons'], 0, 3)) . '.'
                    : '';
                $this->notifications->notify(
                    $userId,
                    'New matching request: ' . Str::limit((string) $needRequest->title, 70),
                    "Score {$match['score']} on your provider profile.{$reasons} Open the request to send an offer.",
                    'need_match',
                    (string) $needRequest->id,
                );
            }
        } catch (\Throwable $e) {
            Log::warning('Auto-match push skipped: ' . $e->getMessage(), [
                'request_id' => $needRequest->id,
            ]);
        }
    }

    /**
     * Escrow release shared by provider `complete` and owner `accept`
     * (TODO 15). Pays the agreed override when a scope change set one,
     * otherwise the accepted offer price. Same gateway abstraction,
     * idempotency prefix, and payout tagging as before — extracted
     * verbatim so neither path can drift.
     */
    private function releasePayout(NeedRequest $needRequest, $offer): void
    {
        if (! $offer) {
            return;
        }

        $amount = $needRequest->agreed_price_override ?? $offer->price;

        $result = app(\Core\Services\Contracts\PaymentGatewayInterface::class)->charge([
            'order_id' => $needRequest->id,
            'user_id' => (string) $offer->provider_id,
            'amount' => $amount,
            'currency' => $needRequest->currency ?: \Core\Support\Currencies::default(),
            'method' => 'platform_escrow',
            'reference' => 'NEEDPAYOUT-'.strtoupper(uniqid()),
            'idempotency_key' => 'NEEDPAYOUT-'.$needRequest->id,
            'purpose' => 'need_payout',
        ]);

        if (!($result['success'] ?? false)) {
            throw new \RuntimeException($result['error'] ?? 'Payout failed');
        }

        $payout = \Modules\Payments\Entities\Payment::find($result['payment_id']);
        if ($payout) {
            $payout->update(['gateway_response' => array_merge(
                (array) ($payout->gateway_response ?? []),
                ['kind' => 'need_payout'],
            )]);
        }
    }

    private function isAdmin(Request $request): bool
    {
        return $request->user()->hasRole('super_admin')
            || $request->user()->hasRole('administrator');
    }

    /** Moderation powers for reject/expire/refund (spec S13 terminal states). */
    private function isModerator(Request $request): bool
    {
        $user = $request->user();

        // The granular permission is the source of truth; the legacy roles
        // stay so the seeded console keeps working without a matrix change.
        return $this->isAdmin($request)
            || $user->hasRole('needs_admin')
            || $user->hasRole('platform_ops')
            || $user->hasPermission('needs.requests.moderate');
    }
}
