<?php

namespace Modules\Orders\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\Orders\Actions\PlaceProductOrder;
use Modules\Orders\Entities\Order;
use Modules\Orders\Entities\OrderItem;
use Modules\Orders\Entities\OrderTracking;
use Modules\Orders\Events\OrderCancelled;

class ProductOrderController extends Controller
{
    private const VENDOR_TRANSITIONS = [
        'accept' => ['paid', Order::STATUS_PROCESSING],
        'ship' => [Order::STATUS_PROCESSING, Order::STATUS_SHIPPED],
        'deliver' => [Order::STATUS_SHIPPED, Order::STATUS_DELIVERED],
    ];

    public function __construct(
        private PlaceProductOrder $placeProductOrder
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Order::with(['items'])
            ->where('user_id', $request->user()->id);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $orders = $query->orderByDesc('created_at')
            ->paginate($request->get('per_page', 15));

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

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|uuid',
            'items.*.quantity' => 'required|integer|min:1|max:1000',
            'coupon_code' => 'nullable|string|max:50',
            'shipping_address' => 'required|string|max:1000',
            'shipping_city' => 'nullable|string|max:255',
            'shipping_country' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:30',
            'notes' => 'nullable|string|max:2000',
        ]);

        try {
            $order = $this->placeProductOrder->execute(array_merge($validated, [
                'user_id' => $request->user()->id,
            ]));
        } catch (\Core\Exceptions\ValidationException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => ['items' => [$e->getMessage()]],
            ], 422);
        }

        return response()->json([
            'message' => 'Order placed successfully',
            'data' => $order,
        ], 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $order = Order::with(['items.product'])->find($id);

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        if (!$this->canAccess($request, $order)) {
            return response()->json(['message' => 'You do not have access to this order'], 403);
        }

        return response()->json(['data' => $order]);
    }

    public function cancel(Request $request, string $id): JsonResponse
    {
        $order = Order::with('items')->find($id);

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        if ($order->user_id !== $request->user()->id && !$this->isAdmin($request)) {
            return response()->json(['message' => 'You do not have access to this order'], 403);
        }

        if (!in_array($order->status, [Order::STATUS_PENDING, Order::STATUS_PAID], true)) {
            return response()->json([
                'message' => "Order cannot be cancelled once it is '{$order->status}'",
            ], 422);
        }

        DB::transaction(function () use ($order) {
            foreach ($order->items as $item) {
                \Modules\Products\Entities\Product::where('id', $item->product_id)
                    ->increment('stock_quantity', $item->quantity);
            }

            $order->update(['status' => Order::STATUS_CANCELLED]);

            OrderTracking::create([
                'order_id' => $order->id,
                'order_type' => 'product',
                'user_id' => $order->user_id,
                'status' => Order::STATUS_CANCELLED,
                'status_message' => 'Order cancelled — stock restored',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $this->broadcastTracking(Order::STATUS_CANCELLED, 'Order cancelled — stock restored', $order);

            \Modules\Orders\Entities\VendorOrder::where('order_id', $order->id)
                ->whereIn('status', ['pending', 'processing'])
                ->update(['status' => 'cancelled']);

            OrderCancelled::dispatch($order->fresh());
        });

        return response()->json([
            'message' => 'Order cancelled successfully',
            'data' => $order->fresh(),
        ]);
    }

    /**
     * Customer-facing tracking timeline.
     */
    public function tracking(Request $request, string $id): JsonResponse
    {
        $order = Order::find($id);

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        if (!$this->canAccess($request, $order)) {
            return response()->json(['message' => 'You do not have access to this order'], 403);
        }

        $tracking = OrderTracking::where('order_id', $order->id)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json(['data' => $tracking]);
    }

    // ── Vendor fulfilment ────────────────────────────────────────

    public function vendorOrders(Request $request): JsonResponse
    {
        $vendor = \Modules\Vendors\Entities\Vendor::where('user_id', $request->user()->id)->first();

        if (!$vendor) {
            return response()->json(['message' => 'Vendor profile required'], 403);
        }

        $query = \Modules\Orders\Entities\VendorOrder::where('vendor_id', $vendor->id);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $orders = $query->orderByDesc('created_at')
            ->paginate($request->get('per_page', 15));

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

    public function vendorTransition(Request $request, string $id, string $action): JsonResponse
    {
        $vendor = \Modules\Vendors\Entities\Vendor::where('user_id', $request->user()->id)->first();

        if (!$vendor) {
            return response()->json(['message' => 'Vendor profile required'], 403);
        }

        if (!isset(self::VENDOR_TRANSITIONS[$action])) {
            return response()->json(['message' => "Unknown action '{$action}'"], 404);
        }

        [$fromStatuses, $newStatus] = self::VENDOR_TRANSITIONS[$action];

        $subOrder = \Modules\Orders\Entities\VendorOrder::where('id', $id)
            ->where('vendor_id', $vendor->id)
            ->first();

        if (!$subOrder) {
            return response()->json(['message' => 'Vendor order not found'], 404);
        }

        if (!in_array($subOrder->status, (array) $fromStatuses, true)) {
            return response()->json([
                'message' => "Cannot {$action} an order in status '{$subOrder->status}'",
            ], 422);
        }

        $subOrder->update(['status' => $newStatus]);

        // Commission accrual on delivery (idempotent per vendor order).
        if ($action === 'deliver') {
            DB::table('vendor_commissions')->updateOrInsert(
                ['vendor_id' => $vendor->id, 'order_id' => $subOrder->id],
                [
                    'id' => (string) \Illuminate\Support\Str::uuid(),
                    'amount' => round((float) $subOrder->total_price * 0.90, 2), // vendor share after 10% platform fee
                    'rate' => 0.10,
                    'status' => 'cleared',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        }

        // Roll up parent order status when all vendor legs reach this stage.
        $parent = Order::find($subOrder->order_id);
        if ($parent && !in_array($parent->status, [Order::STATUS_CANCELLED, Order::STATUS_REFUNDED], true)) {
            $allSameStage = !\Modules\Orders\Entities\VendorOrder::where('order_id', $parent->id)
                ->whereNotIn('status', [$newStatus])
                ->exists();

            if ($allSameStage) {
                $parent->update(['status' => $newStatus]);

                $tracking = OrderTracking::create([
                    'order_id' => $parent->id,
                    'order_type' => 'product',
                    'user_id' => $parent->user_id,
                    'vendor_id' => $vendor->id,
                    'status' => $newStatus,
                    'status_message' => match ($action) {
                        'accept' => 'Seller accepted your order',
                        'ship' => 'Package handed to delivery',
                        'deliver' => 'Delivered',
                        default => 'Status updated',
                    },
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                \Modules\Orders\Events\OrderStatusUpdated::dispatch($tracking);
            }
        }

        return response()->json([
            'message' => ucfirst($action).' successful',
            'data' => $subOrder->fresh(),
        ]);
    }

    // ── Internals ────────────────────────────────────────────────

    private function broadcastTracking(string $status, string $message, Order $order): void
    {
        $tracking = OrderTracking::where('order_id', $order->id)
            ->orderByDesc('created_at')
            ->first();

        if ($tracking) {
            \Modules\Orders\Events\OrderStatusUpdated::dispatch($tracking);
        }
    }

    private function canAccess(Request $request, Order $order): bool
    {
        if ($order->user_id === $request->user()->id) {
            return true;
        }

        $vendorId = $request->user()?->vendor?->id;
        if ($vendorId && OrderItem::where('order_id', $order->id)->where('vendor_id', $vendorId)->exists()) {
            return true;
        }

        return $this->isAdmin($request);
    }

    private function isAdmin(Request $request): bool
    {
        return $request->user()->hasRole('super_admin')
            || $request->user()->hasRole('administrator');
    }
}
