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
use Modules\Products\Entities\ProductVariant;
use Core\Exceptions\ValidationException;

class PlaceProductOrder
{
    public function execute(array $data): Order
    {
        $key = isset($data['idempotency_key']) && is_string($data['idempotency_key']) && trim($data['idempotency_key']) !== ''
            ? trim($data['idempotency_key'])
            : null;

        try {
            return DB::transaction(function () use ($data, $key) {
                // Idempotent replay: the same key returns the original order
                // with zero side effects (no stock movement, no coupon use).
                if ($key !== null) {
                    $existing = Order::where('user_id', $data['user_id'])
                        ->where('idempotency_key', $key)
                        ->first();
                    if ($existing) {
                        return $existing;
                    }
                }
            $items = collect($data['items'])
                ->map(fn ($i) => [
                    'product_id' => $i['product_id'],
                    'variant_id' => $i['variant_id'] ?? null,
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

            // Eager-load active variants for all products in this order.
            // W19 (F-04): locked too - products were already lockForUpdate'd
            // above, but unlocked variant rows allowed concurrent oversell.
            $variants = ProductVariant::whereIn('product_id', $items->pluck('product_id'))
                ->where('is_active', true)
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

                $variant = null;
                if ($requested['variant_id']) {
                    $variant = $variants->get($requested['variant_id']);
                    if (!$variant || $variant->product_id !== $product->id) {
                        throw new ValidationException("Variant unavailable: {$requested['variant_id']}");
                    }
                    if ((int) $variant->stock_quantity < $requested['quantity']) {
                        throw new ValidationException("Insufficient stock for {$product->name} - {$variant->name}");
                    }
                    $variant->decrement('stock_quantity', $requested['quantity']);
                } else {
                    if ((int) $product->stock_quantity < $requested['quantity']) {
                        throw new ValidationException("Insufficient stock for {$product->name}");
                    }
                    $product->decrement('stock_quantity', $requested['quantity']);
                }

                // Server-side price only — never trust the client.
                $unitPrice = $variant ? (float) $variant->price : (float) $product->price;
                $lineTotal = round($unitPrice * $requested['quantity'], 2);
                $subtotal += $lineTotal;

                $itemRows[] = [
                    'product_id' => $product->id,
                    'variant_id' => $variant?->id,
                    'vendor_id' => $product->vendor_id,
                    'product_name' => $product->name,
                    'variant_name' => $variant?->name,
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
                    && (!$coupon->min_order_amount || $subtotal >= (float) $coupon->min_order_amount)
                    && (!$coupon->max_uses || $coupon->used_count < $coupon->max_uses)) {

                    // Per-user usage limit.
                    if ($coupon->per_user_limit) {
                        $userUsage = Order::where('user_id', $data['user_id'])
                            ->where('coupon_code', $coupon->code)
                            ->count();
                        if ($userUsage >= $coupon->per_user_limit) {
                            $coupon = null;
                        }
                    }

                    // Applicable categories restriction.
                    if ($coupon && $coupon->applicable_categories) {
                        $itemCategories = $items->map(fn ($i) => $products[$i['product_id']]->category)->unique()->all();
                        $allowed = array_intersect($itemCategories, $coupon->applicable_categories);
                        if (empty($allowed)) {
                            $coupon = null;
                        }
                    }

                    // Single product restriction.
                    if ($coupon && $coupon->applicable_product_id) {
                        $hasProduct = $items->contains('product_id', $coupon->applicable_product_id);
                        if (!$hasProduct) {
                            $coupon = null;
                        }
                    }

                    if ($coupon) {
                        $discount = match ($coupon->type) {
                            'percentage' => round($subtotal * ((float) $coupon->value / 100), 2),
                            'fixed' => min((float) $coupon->value, $subtotal),
                            default => 0.0,
                        };
                        $couponCode = $coupon->code;
                        $coupon->increment('used_count');
                    }
                }
            }

            // Server-computed shipping (rates table; 0.00 when not configured).
            // Based on the discounted amount the customer actually pays for goods.
            $shippingService = app(\Core\Services\ShippingService::class);
            $shippingFee = $shippingService->calculate(max(0, $subtotal - $discount));

            // §33: tax is server-computed (config/commerce.php) - never from
            // the browser. 0 when no tax is configured, so totals stay
            // merchandise-only until a rate is set.
            $taxable = max(0, $subtotal - $discount);
            $tax = \Core\Support\CommerceTax::amount($taxable);
            $total = round($taxable + $shippingFee + $tax, 2);

            /** @var Order $order */
            $order = Order::create([
                'user_id' => $data['user_id'],
                'order_number' => 'EN-'.strtoupper(uniqid()),
                'idempotency_key' => $key,
                'status' => Order::STATUS_PENDING,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'shipping_fee' => $shippingFee,
                'tax' => $tax,
                'total_amount' => $total,
                'currency' => collect($items)->map(fn ($i) => $products[$i['product_id']]->currency)->filter()->first() ?: \Core\Support\Currencies::default(),
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

            // §61: ETA from the active shipping provider's advertised window
            // (null when none is configured - never a fabricated date).
            $etaDays = $shippingService->estimatedDays();

            OrderTracking::create([
                'order_id' => $order->id,
                'order_type' => 'product',
                'user_id' => $data['user_id'],
                'status' => Order::STATUS_PENDING,
                'status_message' => 'Order placed successfully',
                'estimated_delivery' => $etaDays !== null ? now()->addDays($etaDays) : null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Stock is consumed above - release this buyer's cart holds for
            // the ordered products so other carts can buy them again.
            \Modules\Inventory\Entities\InventoryReservation::withTrashed()
                ->where('user_id', $data['user_id'])
                ->whereIn('product_id', $items->pluck('product_id'))
                ->forceDelete();

            // §32 checkout: the server consumes the ordered lines from the
            // buyer's cart - the client never decides what gets cleared.
            $this->clearOrderedCartLines($data['user_id'], $items);

        $fresh = $order->fresh(['items']);

        OrderPlaced::dispatch($fresh);

        return $fresh;
        });
        } catch (\Illuminate\Database\QueryException $e) {
            // Concurrent double-submit: the loser hits the partial unique
            // index - return the winner's order instead of a 500.
            if ($key !== null && (string) ($e->errorInfo[0] ?? '') === '23505') {
                $winner = Order::where('user_id', $data['user_id'])
                    ->where('idempotency_key', $key)
                    ->first();
                if ($winner) {
                    return $winner;
                }
            }

            throw $e;
        }
    }

    /**
     * Remove exactly the ordered product/variant lines from the buyer's cart
     * and keep the stored coupon discount honest about what is left.
     *
     * @param  \Illuminate\Support\Collection<int, array{product_id: string, variant_id: ?string, quantity: int}>  $items
     */
    private function clearOrderedCartLines(string $userId, $items): void
    {
        $cart = \Modules\Checkout\Entities\Cart::where('user_id', $userId)->first();

        if (! $cart) {
            return;
        }

        foreach ($items as $item) {
            $cart->items()
                ->where('product_id', $item['product_id'])
                ->when(
                    $item['variant_id'],
                    fn ($query) => $query->where('product_variant_id', $item['variant_id']),
                    fn ($query) => $query->whereNull('product_variant_id')
                )
                ->delete();
        }

        $remaining = $cart->items()->count();

        if ($remaining === 0) {
            $cart->update(['coupon_code' => null, 'discount_amount' => 0]);
        }
    }
}
