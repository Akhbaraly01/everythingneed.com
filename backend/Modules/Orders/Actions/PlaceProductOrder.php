<?php

namespace Modules\Orders\Actions;

use Illuminate\Support\Facades\DB;
use Modules\Checkout\Entities\Coupon;
use Modules\Orders\Entities\Order;
use Modules\Orders\Entities\OrderItem;
use Modules\Orders\Entities\OrderTracking;
use Modules\Orders\Entities\VendorOrder;
use Modules\Orders\Events\OrderPlaced;
use Modules\Products\Entities\Product;
use Core\Exceptions\ValidationException;

class PlaceProductOrder
{
    public function execute(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            $items = collect($data['items'])
                ->map(fn ($i) => [
                    'product_id' => $i['product_id'],
                    'quantity' => max(1, (int) $i['quantity']),
                ]);

            if ($items->isEmpty()) {
                throw new ValidationException('Order must contain at least one item');
            }

            // Lock all products up front to prevent concurrent oversell.
            $products = Product::whereIn('id', $items->pluck('product_id'))
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $subtotal = 0.0;
            $itemRows = [];

            foreach ($items as $requested) {
                $product = $products->get($requested['product_id']);

                if (!$product || !$product->is_active) {
                    throw new ValidationException("Product unavailable: {$requested['product_id']}");
                }

                if ((int) $product->stock_quantity < $requested['quantity']) {
                    throw new ValidationException("Insufficient stock for {$product->name}");
                }

                // Server-side price only — never trust the client.
                $unitPrice = (float) $product->price;
                $lineTotal = round($unitPrice * $requested['quantity'], 2);
                $subtotal += $lineTotal;

                $product->decrement('stock_quantity', $requested['quantity']);

                $itemRows[] = [
                    'product_id' => $product->id,
                    'vendor_id' => $product->vendor_id,
                    'product_name' => $product->name,
                    'quantity' => $requested['quantity'],
                    'unit_price' => $unitPrice,
                    'total_price' => $lineTotal,
                ];
            }

            $subtotal = round($subtotal, 2);

            // Coupon: validate against server-computed subtotal.
            $discount = 0.0;
            $couponCode = null;
            if (!empty($data['coupon_code'])) {
                $coupon = Coupon::where('code', $data['coupon_code'])
                    ->where('is_active', true)
                    ->lockForUpdate()
                    ->first();

                if ($coupon
                    && (!$coupon->expires_at || !$coupon->expires_at->isPast())
                    && (!$coupon->min_order_amount || $subtotal >= (float) $coupon->min_order_amount)) {
                    $discount = match ($coupon->type) {
                        'percentage' => round($subtotal * ((float) $coupon->value / 100), 2),
                        'fixed' => min((float) $coupon->value, $subtotal),
                        default => 0.0,
                    };
                    $couponCode = $coupon->code;
                    $coupon->increment('used_count');
                }
            }

            $shippingFee = 0.0;
            $total = round(max(0, $subtotal - $discount + $shippingFee), 2);

            /** @var Order $order */
            $order = Order::create([
                'user_id' => $data['user_id'],
                'order_number' => 'EN-'.strtoupper(uniqid()),
                'status' => Order::STATUS_PENDING,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'shipping_fee' => $shippingFee,
                'total_amount' => $total,
                'currency' => 'USD',
                'coupon_code' => $couponCode,
                'shipping_address' => $data['shipping_address'],
                'shipping_city' => $data['shipping_city'] ?? null,
                'shipping_country' => $data['shipping_country'] ?? null,
                'phone' => $data['phone'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($itemRows as $row) {
                $row['order_id'] = $order->id;
                OrderItem::create($row);
            }

            // Split into per-vendor sub-orders for vendor fulfilment.
            $byVendor = collect($itemRows)->groupBy('vendor_id');
            foreach ($byVendor as $vendorId => $lines) {
                VendorOrder::create([
                    'order_id' => $order->id,
                    'vendor_id' => $vendorId,
                    'customer_id' => $data['user_id'],
                    'product_name' => $lines->count() > 1
                        ? $lines->first()['product_name'].' (+'.($lines->count() - 1).' more)'
                        : $lines->first()['product_name'],
                    'quantity' => (int) $lines->sum('quantity'),
                    'unit_price' => $lines->first()['unit_price'],
                    'total_price' => round((float) $lines->sum('total_price'), 2),
                    'order_number' => $order->order_number,
                    'shipping_address' => $data['shipping_address'],
                    'notes' => $data['notes'] ?? null,
                    'status' => 'pending',
                ]);
            }

            OrderTracking::create([
                'order_id' => $order->id,
                'order_type' => 'product',
                'user_id' => $data['user_id'],
                'status' => Order::STATUS_PENDING,
                'status_message' => 'Order placed successfully',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

        $fresh = $order->fresh(['items']);

        OrderPlaced::dispatch($fresh);

        return $fresh;
    });
    }
}
