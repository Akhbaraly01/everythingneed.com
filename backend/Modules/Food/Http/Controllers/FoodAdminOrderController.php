<?php

namespace Modules\Food\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Food\Entities\FoodOrder;

/**
 * Admin food orders queue: the fulfillment lifecycle the customer side
 * can only observe (pending -> confirmed -> preparing -> out_for_delivery
 * -> delivered, cancellable while still pending/confirmed).
 */
class FoodAdminOrderController extends Controller
{
    public function orders(Request $request): JsonResponse
    {
        $query = FoodOrder::with(['restaurant:id,name', 'user:id,name,email'])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $orders = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $orders->items(),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    public function transition(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'action' => 'required|in:confirm,prepare,out,deliver,cancel',
        ]);

        $action = (string) $request->input('action');
        $order = FoodOrder::find($id);

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $map = [
            'confirm' => [FoodOrder::STATUS_PENDING => FoodOrder::STATUS_CONFIRMED],
            'prepare' => [FoodOrder::STATUS_CONFIRMED => FoodOrder::STATUS_PREPARING],
            'out' => [FoodOrder::STATUS_PREPARING => FoodOrder::STATUS_OUT_FOR_DELIVERY],
            'deliver' => [FoodOrder::STATUS_OUT_FOR_DELIVERY => FoodOrder::STATUS_DELIVERED],
            'cancel' => [
                FoodOrder::STATUS_PENDING => FoodOrder::STATUS_CANCELLED,
                FoodOrder::STATUS_CONFIRMED => FoodOrder::STATUS_CANCELLED,
            ],
        ];

        $allowed = $map[$action];

        if (!isset($allowed[$order->status])) {
            return response()->json([
                'message' => "Cannot {$action} an order in status '{$order->status}'.",
            ], 422);
        }

        $order->update(['status' => $allowed[$order->status]]);

        return response()->json(['data' => $order->fresh()]);
    }
}
