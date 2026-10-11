<?php

namespace Modules\Orders\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Orders\Entities\ReturnRequest;
use Modules\Orders\Entities\Order;

class ReturnRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $returns = ReturnRequest::where('user_id', $userId)
            ->with('order')
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $returns->items(),
            'meta' => [
                'current_page' => $returns->currentPage(),
                'last_page' => $returns->lastPage(),
                'total' => $returns->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'order_id' => 'required|uuid|exists:orders,id',
            'order_item_id' => 'nullable|uuid',
            'reason' => 'required|string|max:500',
            'description' => 'nullable|string|max:2000',
        ]);

        $order = Order::findOrFail($request->order_id);

        if ($order->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not your order'], 403);
        }

        // Duplicate check first: an order already in refund_requested must
        // report the pending return, not a misleading status message.
        $existing = ReturnRequest::where('order_id', $order->id)
            ->where('user_id', $request->user()->id)
            ->whereIn('status', ['pending', 'approved'])
            ->exists();

        if ($existing) {
            return response()->json(['message' => 'A pending return already exists for this order'], 422);
        }

        if (!in_array($order->status, ['delivered', 'completed'], true)) {
            return response()->json(['message' => 'Order must be delivered before a return can be requested'], 422);
        }

        $return = ReturnRequest::create([
            'order_id' => $order->id,
            'order_item_id' => $request->order_item_id,
            'user_id' => $request->user()->id,
            'vendor_id' => $order->items->first()?->vendor_id,
            'reason' => $request->reason,
            'description' => $request->description,
            'status' => 'pending',
            'previous_status' => $order->status,
        ]);

        // §32: the order moves to "refund requested" while RMA is pending.
        $order->update(['status' => Order::STATUS_REFUND_REQUESTED]);

        \Modules\Orders\Entities\OrderTracking::create([
            'order_id' => $order->id,
            'order_type' => 'product',
            'user_id' => $order->user_id,
            'status' => Order::STATUS_REFUND_REQUESTED,
            'status_message' => 'Return requested - refund under review',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Gap 3: the refund REQUEST is raised immediately (pending, no money
        // moves) so support reviews it in the refund queue before payout.
        $payment = \Modules\Payments\Entities\Payment::where('order_id', $order->id)
            ->where('status', \Modules\Payments\Entities\Payment::STATUS_SUCCEEDED)
            ->orderByDesc('created_at')
            ->first();
        if ($payment) {
            try {
                app(\Modules\Payments\Actions\RequestRefund::class)->execute([
                    'payment_id' => $payment->id,
                    'requested_by' => $request->user()->id,
                    'reason' => 'Return request: '.$return->reason,
                    'cancellation_id' => $return->id,
                    'idempotency_key' => 'return-'.$return->id,
                ]);
            } catch (\Core\Exceptions\ValidationException) {
                // Payment already fully refunded — the return still stands.
            }
        }

        return response()->json(['data' => $return], 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $return = ReturnRequest::with('order')->find($id);

        if (!$return || $return->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Return request not found'], 404);
        }

        return response()->json(['data' => $return]);
    }

    /**
     * Admin RMA queue: every return request with requester context.
     * Route-gated in Modules/Admin/Routes/api.php (role: super_admin,
     * administrator, moderator, finance_admin).
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', 'string', 'in:all,pending,approved,rejected,received,refunded'],
            'page'   => ['nullable', 'integer', 'min:1'],
        ]);

        $query = ReturnRequest::query()
            ->leftJoin('users as u', 'u.id', '=', 'return_requests.user_id')
            ->select([
                'return_requests.*',
                'u.name as requester_name', 'u.email as requester_email',
            ])
            ->whereNull('return_requests.deleted_at')
            ->orderByDesc('return_requests.created_at');

        $status = $validated['status'] ?? 'all';
        if ($status !== 'all') {
            $query->where('return_requests.status', $status);
        }

        $page = $validated['page'] ?? 1;
        $total = (clone $query)->count();
        $rows = $query->offset(($page - 1) * 15)->limit(15)->get();

        return response()->json([
            'data'  => $rows,
            'total' => $total,
            'meta'  => ['page' => $page, 'per_page' => 15, 'total' => $total],
        ]);
    }

    /**
     * Admin decision: approve = issue gateway refund (marks the payment and
     * the order refunded, restocks) + return -> refunded; reject = return ->
     * rejected with notes. Audited; non-pending requests are 422.
     */
    public function decide(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'action'       => ['required', 'string', 'in:approve,reject'],
            'admin_notes'  => ['nullable', 'string', 'max:2000'],
            'refund_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        $return = ReturnRequest::find($id);
        if (!$return) {
            return response()->json(['message' => 'Return request not found'], 404);
        }

        if ($return->status !== 'pending') {
            return response()->json(['message' => 'Return request has already been decided'], 422);
        }

        $notes = $validated['admin_notes'] ?? null;
        $order = Order::find($return->order_id);

        if ($validated['action'] === 'reject') {
            $return->update(['status' => 'rejected', 'admin_notes' => $notes]);
            $this->resumeOrder($order, $return->previous_status, 'Return request rejected - order resumed');
            $this->audit('return.rejected', $return, ['status' => 'rejected'], $request->user()->id);

            // Gap 3: the refund REQUEST raised with this return is rejected too.
            $this->rejectLinkedRefund($return->id, $request->user()->id, $notes);

            return response()->json(['message' => 'Return request rejected', 'data' => $return->fresh()]);
        }

        $payment = \Modules\Payments\Entities\Payment::where('order_id', $return->order_id)
            ->where('status', 'succeeded')
            ->orderByDesc('created_at')
            ->first();
        if (!$payment) {
            return response()->json(['message' => 'No refundable payment found for this order'], 422);
        }

        $amount = isset($validated['refund_amount']) ? (float) $validated['refund_amount'] : null;

        // §32: approval first records the returned state, then the gateway
        // refund moves the order to refunded (full refunds) - both milestones
        // land on the customer timeline.
        if ($order && $order->status === Order::STATUS_REFUND_REQUESTED) {
            $order->update(['status' => Order::STATUS_RETURNED]);

            \Modules\Orders\Entities\OrderTracking::create([
                'order_id' => $order->id,
                'order_type' => 'product',
                'user_id' => $order->user_id,
                'status' => Order::STATUS_RETURNED,
                'status_message' => 'Return approved - items returned',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Gap 3: approving the return also approves the refund REQUEST raised
        // when the return was filed (same-method payout). Returns filed
        // before the request existed raise one here so the path is uniform.
        $refundRequest = \Modules\Payments\Entities\Refund::where('cancellation_id', $return->id)
            ->where('status', \Modules\Payments\Entities\Refund::STATUS_PENDING)
            ->first();
        try {
            if (!$refundRequest) {
                $refundRequest = app(\Modules\Payments\Actions\RequestRefund::class)->execute([
                    'payment_id' => $payment->id,
                    'requested_by' => $return->user_id,
                    'reason' => 'Return approved: '.$return->reason,
                    'cancellation_id' => $return->id,
                    'idempotency_key' => 'return-'.$return->id,
                ]);
            }

            if ($refundRequest->status === \Modules\Payments\Entities\Refund::STATUS_PENDING) {
                $refund = app(\Modules\Payments\Actions\ReviewRefund::class)->execute(
                    $refundRequest->id,
                    $request->user()->id,
                    'approve',
                    null,
                    $amount,
                );
            } else {
                $refund = $refundRequest;
            }
        } catch (\Core\Exceptions\ValidationException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $return->update([
            'status' => 'refunded',
            'refund_amount' => $refund->amount,
            'admin_notes' => $notes,
        ]);
        $this->audit('return.approved', $return, [
            'status' => 'refunded',
            'refund_id' => $refund->id,
            'refund_amount' => $refund->amount,
        ], $request->user()->id);

        return response()->json(['message' => 'Return approved and refunded', 'data' => $return->fresh()]);
    }

    /** Gap 3: a rejected return rejects its linked refund REQUEST too. */
    private function rejectLinkedRefund(string $returnId, string $actorId, ?string $notes): void
    {
        $refund = \Modules\Payments\Entities\Refund::where('cancellation_id', $returnId)
            ->where('status', \Modules\Payments\Entities\Refund::STATUS_PENDING)
            ->first();

        if (!$refund) {
            return;
        }

        try {
            app(\Modules\Payments\Actions\ReviewRefund::class)->execute(
                $refund->id,
                $actorId,
                'reject',
                $notes ?: 'Return request rejected',
            );
        } catch (\Core\Exceptions\ValidationException) {
            // Already reviewed — leave the queue state as-is.
        }
    }

    /**
     * Put the order back where the return interrupted it (rejection), so the
     * customer can keep using the normal workflow.
     */
    private function resumeOrder(?Order $order, ?string $previousStatus, string $message): void
    {
        if (! $order || $order->status !== Order::STATUS_REFUND_REQUESTED || ! $previousStatus) {
            return;
        }

        $order->update(['status' => $previousStatus]);

        \Modules\Orders\Entities\OrderTracking::create([
            'order_id' => $order->id,
            'order_type' => 'product',
            'user_id' => $order->user_id,
            'status' => $previousStatus,
            'status_message' => $message,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function audit(string $action, ReturnRequest $return, array $newValues, string $actorId): void
    {
        try {
            app(\Core\Services\Contracts\AuditServiceInterface::class)->log([
                'action' => $action,
                'entity_type' => 'return_request',
                'entity_id' => $return->id,
                'performed_by' => $actorId,
                'old_values' => ['status' => 'pending'],
                'new_values' => $newValues,
            ]);
        } catch (\Throwable) {
        }
    }
}
