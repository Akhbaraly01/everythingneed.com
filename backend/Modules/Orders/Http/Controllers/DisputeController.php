<?php

namespace Modules\Orders\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Orders\Entities\Dispute;

class DisputeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $disputes = Dispute::where('user_id', $request->user()->id)
            ->with('order')
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $disputes->items(),
            'meta' => [
                'current_page' => $disputes->currentPage(),
                'last_page' => $disputes->lastPage(),
                'total' => $disputes->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'order_id' => 'nullable|uuid|exists:orders,id',
            'subject' => 'required|string|max:255',
            'description' => 'required|string|max:5000',
        ]);

        $order = null;

        if ($request->order_id) {
            $order = \Modules\Orders\Entities\Order::find($request->order_id);

            if (! $order || $order->user_id !== $request->user()->id) {
                return response()->json(['message' => 'Not your order'], 403);
            }

            if (in_array($order->status, [\Modules\Orders\Entities\Order::STATUS_CANCELLED, \Modules\Orders\Entities\Order::STATUS_REFUNDED], true)) {
                return response()->json(['message' => "This order can no longer be disputed - it is '{$order->status}'"], 422);
            }
        }

        $dispute = Dispute::create([
            'user_id' => $request->user()->id,
            'order_id' => $request->order_id,
            'subject' => $request->subject,
            'description' => $request->description,
            'status' => 'open',
            'previous_status' => $order?->status,
        ]);

        // §32: the order shows as disputed while the case is open; closing or
        // resolving it restores the status it interrupted.
        if ($order && $order->status !== \Modules\Orders\Entities\Order::STATUS_DISPUTED) {
            $order->update(['status' => \Modules\Orders\Entities\Order::STATUS_DISPUTED]);

            \Modules\Orders\Entities\OrderTracking::create([
                'order_id' => $order->id,
                'order_type' => 'product',
                'user_id' => $order->user_id,
                'status' => \Modules\Orders\Entities\Order::STATUS_DISPUTED,
                'status_message' => 'Dispute opened - order under review',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json(['data' => $dispute], 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $dispute = Dispute::with('order')->find($id);

        if (!$dispute || $dispute->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Dispute not found'], 404);
        }

        return response()->json(['data' => $dispute]);
    }

    public function resolve(Request $request, string $id): JsonResponse
    {
        $dispute = Dispute::find($id);
        if (!$dispute) {
            return response()->json(['message' => 'Dispute not found'], 404);
        }

        if (!$request->user()->hasPermission('orders.orders.manage')) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $request->validate([
            'resolution' => 'required|in:refund,replacement,credit,dismissed',
            'resolution_notes' => 'nullable|string|max:2000',
        ]);

        $dispute->update([
            'status' => 'resolved',
            'resolution' => $request->resolution,
            'resolution_notes' => $request->resolution_notes,
        ]);

        return response()->json(['data' => $dispute]);
    }

    public function close(Request $request, string $id): JsonResponse
    {
        $dispute = Dispute::find($id);
        if (!$dispute || $dispute->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Dispute not found'], 404);
        }

        $dispute->update(['status' => 'closed']);
        $this->resumeOrder($dispute);

        return response()->json(['data' => $dispute]);
    }

    /**
     * Restore the interrupted order status when a dispute stops being open.
     * A refund resolution keeps the order disputed until the gateway refund
     * marks it refunded (admin-managed).
     */
    private function resumeOrder(Dispute $dispute): void
    {
        if (! $dispute->order_id || ! $dispute->previous_status) {
            return;
        }

        $order = \Modules\Orders\Entities\Order::find($dispute->order_id);

        if (! $order || $order->status !== \Modules\Orders\Entities\Order::STATUS_DISPUTED) {
            return;
        }

        $order->update(['status' => $dispute->previous_status]);

        \Modules\Orders\Entities\OrderTracking::create([
            'order_id' => $order->id,
            'order_type' => 'product',
            'user_id' => $order->user_id,
            'status' => $dispute->previous_status,
            'status_message' => 'Dispute closed - order resumed',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
