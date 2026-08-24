<?php

namespace Modules\Needs\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\Needs\Entities\TaskApplication;
use Modules\Needs\Entities\TaskPost;

class TaskController extends Controller
{
    public function __construct(
        private NotificationService $notifications
    ) {}

    /**
     * Public task board (?mine=1 for own posts).
     */
    public function index(Request $request): JsonResponse
    {
        $query = TaskPost::withCount('applications');

        if ($request->boolean('mine')) {
            $query->where('created_by', $request->user()->id);
        } else {
            $query->where('status', TaskPost::STATUS_OPEN);
        }

        if ($request->filled('q')) {
            $q = $request->q;
            $query->where(function ($sub) use ($q) {
                $sub->where('title', 'ilike', "%{$q}%")
                    ->orWhere('description', 'ilike', "%{$q}%");
            });
        }

        $tasks = $query->orderByDesc('created_at')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $tasks->items(),
            'meta' => [
                'current_page' => $tasks->currentPage(),
                'last_page' => $tasks->lastPage(),
                'per_page' => $tasks->perPage(),
                'total' => $tasks->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:5000',
            'quantity' => 'nullable|integer|min:1|max:100000',
            'budget' => 'required|numeric|min:0.01',
            'deadline' => 'nullable|date|after_or_equal:today',
            'requirements' => 'nullable|array',
        ]);

        $task = TaskPost::create(array_merge($validated, [
            'created_by' => $request->user()->id,
            'post_number' => 'TK-'.strtoupper(uniqid()),
            'quantity' => $validated['quantity'] ?? 1,
            'status' => TaskPost::STATUS_OPEN,
        ]));

        return response()->json([
            'message' => 'Task published to the board',
            'data' => $task,
        ], 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $task = TaskPost::with(['owner'])->withCount('applications')->find($id);

        if (!$task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        return response()->json(['data' => $task]);
    }

    public function myApplications(Request $request): JsonResponse
    {
        $applications = TaskApplication::with('task')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $applications->items(),
            'meta' => [
                'current_page' => $applications->currentPage(),
                'last_page' => $applications->lastPage(),
                'per_page' => $applications->perPage(),
                'total' => $applications->total(),
            ],
        ]);
    }

    public function applications(Request $request, string $id): JsonResponse
    {
        $task = TaskPost::find($id);

        if (!$task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        if ((string) $task->created_by !== (string) $request->user()->id && !$this->isAdmin($request)) {
            return response()->json(['message' => 'Only the task owner can view applications'], 403);
        }

        $applications = TaskApplication::with('worker')
            ->where('task_post_id', $id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $applications]);
    }

    public function apply(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'nullable|string|max:2000',
        ]);

        $task = TaskPost::where('id', $id)->lockForUpdate()->first();

        if (!$task || $task->status !== TaskPost::STATUS_OPEN) {
            return response()->json(['message' => 'This task is not open for participation'], 422);
        }

        if ((string) $task->created_by === (string) $request->user()->id) {
            return response()->json(['message' => 'You cannot apply to your own task'], 422);
        }

        $existing = TaskApplication::where('task_post_id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'You already applied to this task'], 409);
        }

        $application = TaskApplication::create(array_merge($validated, [
            'task_post_id' => $id,
            'user_id' => $request->user()->id,
            'status' => TaskApplication::STATUS_PENDING,
        ]));

        $this->notifications->notify(
            (string) $task->created_by,
            'New task application',
            "Someone applied to '{$task->title}'.",
            'task_application',
            $task->id
        );

        return response()->json([
            'message' => 'Application submitted',
            'data' => $application,
        ], 201);
    }

    public function applicationAction(Request $request, string $applicationId, string $action): JsonResponse
    {
        /** @var TaskApplication|null $application */
        $application = TaskApplication::with('task')->where('id', $applicationId)->first();

        if (!$application) {
            return response()->json(['message' => 'Application not found'], 404);
        }

        $task = $application->task;
        $user = $request->user();
        $isOwner = (string) $task->created_by === (string) $user->id || $this->isAdmin($request);
        $isWorker = (string) $application->user_id === (string) $user->id;

        switch ($action) {
            case 'approve':
            case 'reject':
                if (!$isOwner) {
                    return response()->json(['message' => 'Only the task owner can review applications'], 403);
                }
                if ($application->status !== TaskApplication::STATUS_PENDING) {
                    return response()->json(['message' => 'Application already reviewed'], 422);
                }
                $newStatus = $action === 'approve'
                    ? TaskApplication::STATUS_APPROVED
                    : TaskApplication::STATUS_REJECTED;

                DB::transaction(function () use ($application, $newStatus, $task) {
                    if ($newStatus === TaskApplication::STATUS_APPROVED) {
                        // Single-worker assignment model
                        TaskApplication::where('task_post_id', $task->id)
                            ->where('status', TaskApplication::STATUS_APPROVED)
                            ->update(['status' => TaskApplication::STATUS_REJECTED]);
                        $task->update([
                            'status' => TaskPost::STATUS_ASSIGNED,
                            'assigned_application_id' => $application->id,
                        ]);
                    }
                    $application->update(['status' => $newStatus]);
                });

                if ($newStatus === TaskApplication::STATUS_APPROVED) {
                    $this->notifications->notify(
                        (string) $application->user_id,
                        'You were selected!',
                        "You have been assigned to '{$task->title}'. Submit your work when done.",
                        'task_assigned',
                        $task->id
                    );
                }
                break;

            case 'submit':
                $request->validate([
                    'evidence_url' => 'nullable|url|max:500',
                    'evidence_note' => 'nullable|string|max:2000',
                ]);

                if (!$isWorker) {
                    return response()->json(['message' => 'Only the assigned worker can submit'], 403);
                }
                if (!in_array($application->status, [TaskApplication::STATUS_APPROVED], true)) {
                    return response()->json(['message' => 'Work cannot be submitted in current status'], 422);
                }
                $application->update([
                    'evidence_url' => $request->input('evidence_url'),
                    'evidence_note' => $request->input('evidence_note'),
                    'status' => TaskApplication::STATUS_SUBMITTED,
                ]);
                $task->update(['status' => TaskPost::STATUS_IN_REVIEW]);

                $this->notifications->notify(
                    (string) $task->created_by,
                    'Work submitted for review',
                    "'{$task->title}' — evidence is ready for your verification.",
                    'task_submitted',
                    $task->id
                );
                break;

            case 'verify':
                if (!$isOwner) {
                    return response()->json(['message' => 'Only the task owner can verify work'], 403);
                }
                if ($application->status !== TaskApplication::STATUS_SUBMITTED) {
                    return response()->json(['message' => 'No submission to verify'], 422);
                }
                $application->update([
                    'status' => TaskApplication::STATUS_VERIFIED,
                    'payout' => $task->budget,
                ]);
                break;

            case 'mark-paid':
                if (!$isOwner) {
                    return response()->json(['message' => 'Only the task owner can release payment'], 403);
                }
                if ($application->status !== TaskApplication::STATUS_VERIFIED) {
                    return response()->json(['message' => 'Verify the work before paying'], 422);
                }

                DB::transaction(function () use ($application, $task, $user) {
                    \Modules\Payments\Entities\Payment::create([
                        'order_id' => $task->id,
                        'user_id' => $application->user_id,
                        'amount' => $task->budget,
                        'currency' => 'USD',
                        'status' => 'succeeded',
                        'method' => 'platform_escrow',
                        'reference' => 'TKPAY-'.strtoupper(uniqid()),
                        'gateway_response' => json_encode([
                            'provider' => 'everythingneed-pay',
                            'kind' => 'task_payout',
                            'mode' => config('app.env') === 'production' ? 'live' : 'test',
                        ]),
                    ]);

                    $application->update(['status' => TaskApplication::STATUS_PAID]);

                    $remaining = TaskApplication::where('task_post_id', $task->id)
                        ->whereIn('status', [TaskApplication::STATUS_APPROVED, TaskApplication::STATUS_SUBMITTED, TaskApplication::STATUS_VERIFIED])
                        ->exists();

                    if (!$remaining) {
                        $task->update(['status' => TaskPost::STATUS_COMPLETED]);
                    }
                });

                $this->notifications->notify(
                    (string) $application->user_id,
                    'Payment released',
                    "Your work on '{$task->title}' was verified and paid (\${$task->budget}).",
                    'task_paid',
                    $task->id
                );
                break;

            default:
                return response()->json(['message' => "Unknown action '{$action}'"], 404);
        }

        return response()->json([
            'message' => ucfirst(str_replace('-', ' ', $action)).' successful',
            'data' => $application->fresh(),
        ]);
    }

    private function isAdmin(Request $request): bool
    {
        return $request->user()->hasRole('super_admin')
            || $request->user()->hasRole('administrator');
    }
}
