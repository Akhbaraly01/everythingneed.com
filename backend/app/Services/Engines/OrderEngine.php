<?php

namespace App\Services\Engines;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderEngine
{
    public function __construct(private PricingEngine $pricing, private CommissionEngine $commission) {}

    /**
     * Create a product order with per-vendor sub-orders atomically.
     * Used by both web checkout and API.
     */
    public function placeOrder(string $userId, array $cartItems, string $shippingAddress, ?array $coupon = null): array
    {
        return DB::transaction(function () use ($userId, $cartItems, $shippingAddress, $coupon) {
            $orderNumber = 'ORD-' . strtoupper(Str::random(10));
            $grouped = collect($cartItems)->groupBy('vendor_id');
            $orders = [];
            foreach ($grouped as $vendorId => $items) {
                $total = $this->pricing->orderTotal($items->toArray(), 0, $coupon);
                $split = $this->commission->split($items->toArray());
                $order = \Modules\Orders\Entities\Order::create([
                    'user_id' => $userId,
                    'vendor_id' => $vendorId,
                    'order_number' => $orderNumber . '-' . substr((string) $vendorId, 0, 4),
                    'total_amount' => $total,
                    'commission' => $split['commission'],
                    'status' => 'pending',
                    'shipping_address' => $shippingAddress,
                ]);
                foreach ($items as $item) {
                    \Modules\Orders\Entities\OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $item['product_id'],
                        'product_name' => $item['product_name'] ?? 'Product',
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'total_price' => $item['unit_price'] * $item['quantity'],
                    ]);
                }
                $orders[] = $order;
            }
            return $orders;
        });
    }
}
