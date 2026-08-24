<?php

namespace Modules\Orders\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Orders\Services\OrderService;
use Modules\Orders\Http\Requests\PlaceOrderRequest;
use Modules\Orders\Http\Resources\OrderResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(
        private OrderService $orderService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $orders = $this->orderService->getUserOrders(
            $request->user()->id,
            $request->get('page', 1),
            $request->get('per_page', 15)
        );

        return response()->json([
            'data' => OrderResource::collection($orders->items()),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $order = $this->orderService->getOrder($id);

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        if (!$this->canAccess($request, $order->user_id, $order)) {
            return response()->json(['message' => 'You do not have access to this order'], 403);
        }

        return response()->json([
            'data' => new OrderResource($order),
        ]);
    }

    public function store(PlaceOrderRequest $request): JsonResponse
    {
        $order = $this->orderService->placeOrder(
            array_merge($request->validated(), ['user_id' => $request->user()->id])
        );

        return response()->json([
            'message' => 'Order placed successfully',
            'data' => new OrderResource($order),
        ], 201);
    }

    public function cancel(Request $request, string $id): JsonResponse
    {
        $order = $this->orderService->getOrder($id);

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        if (!$this->canAccess($request, $order->user_id, $order)) {
            return response()->json(['message' => 'You do not have access to this order'], 403);
        }

        $order = $this->orderService->cancelOrder($id);

        return response()->json([
            'message' => 'Order cancelled successfully',
            'data' => new OrderResource($order),
        ]);
    }

    private function canAccess(Request $request, string $ownerId, object $order): bool
    {
        $user = $request->user();

        if ($ownerId === $user->id) {
            return true;
        }

        // Vendor of the order items may view orders containing their products
        if ($user->vendor && isset($order->vendor_id) && $order->vendor_id === $user->vendor->id) {
            return true;
        }

        return $user->hasRole('super_admin')
            || $user->hasRole('administrator');
    }
}
