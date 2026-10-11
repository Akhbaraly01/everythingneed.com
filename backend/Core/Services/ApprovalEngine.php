<?php

namespace Core\Services;

use App\Models\ApprovalRequest;
use App\Models\ApprovalStep;
use App\Models\User;
use Core\Services\Contracts\ApprovalEngineInterface;
use Core\Services\Contracts\AuditServiceInterface;
use Illuminate\Support\Facades\DB;

class ApprovalEngine implements ApprovalEngineInterface
{
    public function __construct(private AuditServiceInterface $audit)
    {
    }

    public function request(
        string $type,
        string $title,
        array $approverRoles,
        ?string $subjectType = null,
        ?string $subjectId = null,
        ?array $payload = null,
        ?string $requestedBy = null,
    ): ApprovalRequest {
        if ($approverRoles === []) {
            throw new \InvalidArgumentException('An approval request needs at least one step.');
        }

        $request = DB::transaction(function () use ($type, $title, $approverRoles, $subjectType, $subjectId, $payload, $requestedBy) {
            $request = ApprovalRequest::create([
                'type' => $type,
                'subject_type' => $subjectType,
                'subject_id' => $subjectId,
                'title' => $title,
                'payload' => $payload,
                'status' => ApprovalRequest::STATUS_PENDING,
                'current_step' => 1,
                'requested_by' => $requestedBy,
            ]);

            foreach (array_values($approverRoles) as $index => $role) {
                ApprovalStep::create([
                    'request_id' => $request->id,
                    'step_order' => $index + 1,
                    'approver_role' => $role,
                    'status' => ApprovalStep::STATUS_PENDING,
                ]);
            }

            return $request;
        });

        $this->log('approval.requested', $request, ['steps' => count($approverRoles)]);

        return $request->load('steps');
    }

    public function decide(User $actor, string $requestId, bool $approve, ?string $comment = null): string
    {
        $request = ApprovalRequest::with('steps')->find($requestId);

        if (! $request) {
            return 'missing';
        }

        if ($request->status !== ApprovalRequest::STATUS_PENDING) {
            return 'already_decided';
        }

        $step = $request->steps->firstWhere('step_order', $request->current_step);

        if (! $step) {
            // Invariant guard: a pending request always has its current step.
            return 'already_decided';
        }

        if (! $this->actorMayDecide($actor, $step->approver_role)) {
            return 'forbidden';
        }

        DB::transaction(function () use ($request, $step, $actor, $approve, $comment) {
            $step->update([
                'status' => $approve ? ApprovalStep::STATUS_APPROVED : ApprovalStep::STATUS_REJECTED,
                'decided_by' => $actor->id,
                'decided_at' => now(),
                'comment' => $comment,
            ]);

            if (! $approve) {
                $request->steps()
                    ->where('step_order', '>', $step->step_order)
                    ->where('status', ApprovalStep::STATUS_PENDING)
                    ->update(['status' => ApprovalStep::STATUS_SKIPPED]);
                $request->update([
                    'status' => ApprovalRequest::STATUS_REJECTED,
                    'decided_at' => now(),
                ]);

                return;
            }

            $isLastStep = $step->step_order >= $request->steps->count();

            if ($isLastStep) {
                $request->update([
                    'status' => ApprovalRequest::STATUS_APPROVED,
                    'decided_at' => now(),
                ]);
                $this->finalizeSubject($request);
            } else {
                $request->update(['current_step' => $step->step_order + 1]);
            }
        });

        $this->log('approval.decided', $request, [
            'decision' => $approve ? 'approved' : 'rejected',
            'step' => $step->step_order,
            'comment' => $comment,
        ]);

        return 'ok';
    }

    public function list(array $filters = []): array
    {
        $query = ApprovalRequest::with(['steps', 'requester'])
            ->orderByDesc('created_at');

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        $total = (clone $query)->count();
        $page = (int) ($filters['page'] ?? 1);
        $perPage = (int) ($filters['per_page'] ?? 15);
        $rows = $query->offset(($page - 1) * $perPage)->limit($perPage)->get();

        return [
            'data' => $rows,
            'meta' => ['total' => $total, 'page' => $page, 'per_page' => $perPage],
        ];
    }

    public function find(string $id): ?ApprovalRequest
    {
        return ApprovalRequest::with(['steps', 'requester'])->find($id);
    }

    /**
     * super_admin bypasses every step gate; otherwise the step's role must be
     * held. A null approver_role means "any caller that passed the route's
     * permission gate" (the API middleware already enforced the queue
     * permission, so no further role is required).
     */
    private function actorMayDecide(User $actor, ?string $approverRole): bool
    {
        if ($actor->hasRole('super_admin')) {
            return true;
        }

        return $approverRole === null || $actor->hasRole($approverRole);
    }

    /**
     * Subject side-effects on final approval (W3). Rejection leaves the
     * subject untouched (authors revise and resubmit). Unknown subject
     * types are ignored so generic flows never break.
     */
    private function finalizeSubject(ApprovalRequest $request): void
    {
        try {
            if ($request->subject_type === 'dynamic_module_entry' && is_string($request->subject_id)) {
                \Modules\Admin\Entities\DynamicModuleEntry::where('id', $request->subject_id)
                    ->where('status', 'draft')
                    ->update(['status' => 'published']);
            }
        } catch (\Throwable) {
            // Finalize failures must not roll back the approval decision.
        }
    }

    private function log(string $action, ApprovalRequest $request, array $newValues): void
    {
        try {
            $this->audit->log([
                'action' => $action,
                'entity_type' => 'approval_request',
                'entity_id' => $request->id,
                'performed_by' => auth()->id(),
                'new_values' => $newValues,
            ]);
        } catch (\Throwable) {
            // Audit failures must not break approval flows.
        }
    }
}
