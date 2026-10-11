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
use Modules\Orders\Http\Requests\PlaceProductOrderRequest;
use Modules\Orders\Http\Requests\VendorUpdateOrderStatusRequest;
use Core\Services\Contracts\VendorQueryInterface;

class ProductOrderController extends Controller
{
    private const VENDOR_TRANSITIONS = [
        'accept' => ['paid', Order::STATUS_PROCESSING],
        'ship' => [Order::STATUS_PROCESSING, Order::STATUS_SHIPPED],
        'deliver' => [Order::STATUS_SHIPPED, Order::STATUS_DELIVERED],
    ];

    public function __construct(
        private PlaceProductOrder $placeProductOrder,
        private VendorQueryInterface $vendors,
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

    public function store(PlaceProductOrderRequest $request): JsonResponse
    {
        $validated = $request->validated();

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

        // Gap 3: cancelling a PAID order raises a refund REQUEST immediately
        // (pending, no money moves) — support processes it same-method later.
        $wasPaid = $order->status === Order::STATUS_PAID;
        $paidPayment = $wasPaid
            ? \Modules\Payments\Entities\Payment::where('order_id', $order->id)
                ->where('status', \Modules\Payments\Entities\Payment::STATUS_SUCCEEDED)
                ->orderByDesc('created_at')
                ->first()
            : null;

        DB::transaction(function () use ($order) {
            foreach ($order->items as $item) {
                if ($item->variant_id) {
                    \Modules\Products\Entities\ProductVariant::where('id', $item->variant_id)
                        ->increment('stock_quantity', $item->quantity);
                } else {
                    \Modules\Products\Entities\Product::where('id', $item->product_id)
                        ->increment('stock_quantity', $item->quantity);
                }
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

        if ($paidPayment) {
            try {
                app(\Modules\Payments\Actions\RequestRefund::class)->execute([
                    'payment_id' => $paidPayment->id,
                    'requested_by' => $request->user()->id,
                    'reason' => 'Order cancelled — refund requested',
                    'cancellation_id' => $order->id,
                    'idempotency_key' => 'order-cancel-'.$order->id,
                ]);
            } catch (\Core\Exceptions\ValidationException) {
                // Already fully refunded — the cancellation still stands.
            }
        }

        return response()->json([
            'message' => 'Order cancelled successfully',
            'data' => $order->fresh(),
        ]);
    }

    /**
     * Spec §32 workflow: the customer marks a delivered order completed.
     */
    public function complete(Request $request, string $id): JsonResponse
    {
        $order = Order::find($id);

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        if ($order->user_id !== $request->user()->id) {
            return response()->json(['message' => 'You do not have access to this order'], 403);
        }

        if ($order->status !== Order::STATUS_DELIVERED) {
            return response()->json([
                'message' => "Only a delivered order can be completed - this one is '{$order->status}'",
            ], 422);
        }

        $order->update(['status' => Order::STATUS_COMPLETED]);

        OrderTracking::create([
            'order_id' => $order->id,
            'order_type' => 'product',
            'user_id' => $order->user_id,
            'status' => Order::STATUS_COMPLETED,
            'status_message' => 'Order completed',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->broadcastTracking(Order::STATUS_COMPLETED, 'Order completed', $order);

        return response()->json([
            'message' => 'Order completed',
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

    /**
     * Real per-product aggregates for the vendor console (top sellers by
     * revenue). Lives in the Orders module because vendor_orders is its
     * table - other modules must not read it directly.
     */
    public function vendorTopProducts(Request $request): JsonResponse
    {
        $vendor = \Modules\Vendors\Entities\Vendor::where('user_id', $request->user()->id)->first();

        if (!$vendor) {
            return response()->json(['message' => 'Vendor profile required'], 403);
        }

        $rows = \Modules\Orders\Entities\VendorOrder::where('vendor_id', $vendor->id)
            ->whereNull('deleted_at')
            ->groupBy('product_id', 'product_name')
            ->selectRaw('product_id as id, product_name as name, SUM(quantity) as sold, SUM(total_price) as revenue')
            ->orderByDesc('revenue')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'id' => (string) $row->id,
                'name' => (string) $row->name,
                'sold' => (int) $row->sold,
                'revenue' => round((float) $row->revenue, 2),
            ])
            ->all();

        return response()->json(['data' => $rows]);
    }

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

        // §61: proof of delivery captured at the delivered transition.
        $request->validate([
            'proof' => 'nullable|string|max:500',
        ]);
        $proof = $request->input('proof');

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
            $this->vendors->recordCommission($vendor->id, $subOrder->id, (float) $subOrder->total_price);
        }

        // Roll up parent order status when all vendor legs reach this stage.
        $parent = Order::find($subOrder->order_id);
        $rolledUp = false;
        $holdStates = [
            Order::STATUS_CANCELLED,
            Order::STATUS_REFUNDED,
            Order::STATUS_REFUND_REQUESTED,
            Order::STATUS_DISPUTED,
        ];
        if ($parent && !in_array($parent->status, $holdStates, true)) {
            $allSameStage = !\Modules\Orders\Entities\VendorOrder::where('order_id', $parent->id)
                ->whereNotIn('status', [$newStatus])
                ->exists();

            if ($allSameStage) {
                $rolledUp = true;
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
                    'proof_of_delivery' => $action === 'deliver' ? $proof : null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                \Modules\Orders\Events\OrderStatusUpdated::dispatch($tracking);
            }
        }

        // Multi-vendor orders: keep this seller's proof visible on the
        // customer timeline even when the parent does not roll up yet.
        if ($action === 'deliver' && $proof !== null && ! $rolledUp && $parent) {
            OrderTracking::create([
                'order_id' => $parent->id,
                'order_type' => 'product',
                'user_id' => $parent->user_id,
                'vendor_id' => $vendor->id,
                'status' => Order::STATUS_DELIVERED,
                'status_message' => 'Delivered',
                'proof_of_delivery' => $proof,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json([
            'message' => ucfirst($action).' successful',
            'data' => $subOrder->fresh(),
        ]);
    }

    // ── Internals ────────────────────────────────────────────────

    /**
     * Vendor's own view of a single sub-order (ownership enforced).
     */
    public function vendorShow(Request $request, string $id): JsonResponse
    {
        $order = \Modules\Orders\Entities\VendorOrder::with('customer:id,name,email')->find($id);
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $vendor = \Modules\Vendors\Entities\Vendor::where('user_id', $request->user()->id)->first();
        if (!$vendor || (string) $order->vendor_id !== (string) $vendor->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json(['data' => $order]);
    }

    /**
     * Vendor status transition with workflow guard (ownership enforced).
     */
    public function vendorUpdate(VendorUpdateOrderStatusRequest $request, string $id): JsonResponse
    {
        $order = \Modules\Orders\Entities\VendorOrder::find($id);
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $vendor = \Modules\Vendors\Entities\Vendor::where('user_id', $request->user()->id)->first();
        if (!$vendor || (string) $order->vendor_id !== (string) $vendor->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validated();

        $allowed = [
            'pending' => ['confirmed', 'processing', 'cancelled'],
            'paid' => ['confirmed', 'processing', 'cancelled'],
            'confirmed' => ['processing', 'shipped', 'cancelled'],
            'processing' => ['shipped', 'cancelled'],
            'shipped' => ['delivered'],
            'delivered' => [],
            'cancelled' => [],
        ];
        $next = $validated['status'];
        if (! in_array($next, $allowed[$order->status] ?? [], true)) {
            return response()->json([
                'message' => "Cannot transition vendor order from '{$order->status}' to '{$next}'",
            ], 422);
        }

        $order->update(['status' => $next]);

        return response()->json(['data' => $order->fresh()]);
    }

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
