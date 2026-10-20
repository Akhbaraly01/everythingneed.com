<?php

namespace Modules\Food\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Modules\Food\Entities\FoodOrder;
use Modules\Food\Entities\MenuItem;
use Modules\Food\Entities\Restaurant;

/**
 * Food order endpoints (previously route closures).
 */
class FoodOrderController extends Controller
{
    /**
     * The current user's food orders.
     */
    public function index(Request $request): JsonResponse
    {
        $orders = FoodOrder::where('user_id', $request->user()->id)
            ->with('restaurant:id,name')
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $orders]);
    }

    /**
     * A single food order (own records only).
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $order = FoodOrder::where('user_id', $request->user()->id)
            ->with('restaurant:id,name')
            ->find($id);

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        return response()->json(['data' => $order]);
    }

    /**
     * Customer-side cancellation: pending orders only. Once the kitchen
     * confirms, fulfillment has started and staff cancels from the admin
     * console.
     */
    public function cancel(Request $request, string $id): JsonResponse
    {
        $order = FoodOrder::where('user_id', $request->user()->id)->find($id);

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        if ($order->status !== FoodOrder::STATUS_PENDING) {
            return response()->json([
                'message' => "Only pending orders can be cancelled (current: {$order->status}).",
            ], 422);
        }

        $order->update(['status' => FoodOrder::STATUS_CANCELLED]);

        return response()->json(['data' => $order->fresh()]);
    }

    /**
     * Place a food order.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'restaurant_id' => 'required|uuid',
            'items' => 'required|array|min:1',
            'items.*.menu_item_id' => 'nullable|uuid',
            'items.*.id' => 'nullable|uuid',
            'items.*.quantity' => 'nullable|integer|min:1',
            'items.*.special_instructions' => 'nullable|string|max:500',
            'delivery_address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:1000',
            // N-42 scheduled orders: future slot, max 7 days out.
            'scheduled_for' => 'nullable|date|after:now|before:' . now()->addDays(7)->toIso8601String(),
        ]);

        $order = app(\Modules\Food\Actions\PlaceFoodOrder::class)->execute(
            $request->user()->id,
            $validated['restaurant_id'],
            $validated['items'],
            [
                'delivery_address' => $validated['delivery_address'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'scheduled_for' => $validated['scheduled_for'] ?? null,
            ]
        );

        return response()->json(['data' => $order], 201);
    }
}
