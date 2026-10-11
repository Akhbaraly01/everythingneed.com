<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Services\Contracts\ApprovalEngineInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Admin\Http\Requests\ApprovalRequestStoreRequest;

/**
 * Generic approval engine endpoints (W4). Route gate mirrors the
 * /admin/approvals page role group (products.products.approve — the catalog
 * permission the Approvals console already declares); per-step role checks
 * live inside ApprovalEngine::decide().
 */
class AdminApprovalRequestController extends Controller
{
    public function __construct(private ApprovalEngineInterface $approvals) {}

    /**
     * GET /api/admin/approval-requests
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', 'string', 'in:pending,approved,rejected'],
            'type' => ['nullable', 'string', 'max:64'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);

        return response()->json($this->approvals->list($validated));
    }

    /**
     * POST /api/admin/approval-requests
     */
    public function store(ApprovalRequestStoreRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $approval = $this->approvals->request(
            type: $validated['type'],
            title: $validated['title'],
            approverRoles: array_values($validated['approver_roles']),
            subjectType: $validated['subject_type'] ?? null,
            subjectId: $validated['subject_id'] ?? null,
            payload: $validated['payload'] ?? null,
            requestedBy: $request->user()?->id,
        );

        return response()->json(['message' => 'Approval request created', 'data' => $approval], 201);
    }

    /**
     * GET /api/admin/approval-requests/{id}
     */
    public function show(string $id): JsonResponse
    {
        $approval = $this->approvals->find($id);

        if (! $approval) {
            return response()->json(['message' => 'Approval request not found'], 404);
        }

        return response()->json(['data' => $approval]);
    }

    /**
     * POST /api/admin/approval-requests/{id}/approve
     */
    public function approve(Request $request, string $id): JsonResponse
    {
        return $this->decide($request, $id, true);
    }

    /**
     * POST /api/admin/approval-requests/{id}/reject
     */
    public function reject(Request $request, string $id): JsonResponse
    {
        return $this->decide($request, $id, false);
    }

    private function decide(Request $request, string $id, bool $approve): JsonResponse
    {
        $validated = $request->validate([
            'comment' => ['nullable', 'string', 'max:500'],
        ]);

        $result = $this->approvals->decide(
            $request->user(),
            $id,
            $approve,
            $validated['comment'] ?? null,
        );

        return match ($result) {
            'missing' => response()->json(['message' => 'Approval request not found'], 404),
            'forbidden' => response()->json(['message' => 'You are not an approver for the current step'], 403),
            'already_decided' => response()->json(['message' => 'Approval request already decided'], 422),
            default => response()->json(['message' => $approve ? 'Step approved' : 'Request rejected']),
        };
    }
}
