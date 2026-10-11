<?php

namespace Modules\Checkout\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Services\ShippingService;
use Core\Support\CommerceTax;
use Modules\Checkout\Entities\Cart;
use Modules\Checkout\Entities\Coupon;
use Modules\Inventory\Entities\InventoryReservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CartController extends Controller
{
    public function __construct(private ShippingService $shippingService)
    {
    }

    public function show(): JsonResponse
    {
        $cart = Cart::with(['items.product.vendor', 'items.variant'])
            ->where('user_id', Auth::id())
            ->firstOrCreate(['user_id' => Auth::id()]);

        $cart->loadMissing('items');
        $this->recomputeDiscount($cart);

        $subtotal = (float) $cart->items->sum(fn ($item) => $item->unit_price * $item->quantity);
        $discount = min((float) ($cart->discount_amount ?? 0), $subtotal);
        $shipping = $this->shippingService->calculate(max(0, $subtotal - $discount));
        $tax = CommerceTax::amount(max(0, $subtotal - $discount));

        // Units still purchasable by this user (stock minus other carts' holds).
        $availability = [];
        foreach ($cart->items as $item) {
            $resolved = $this->resolveItem($item->product_id, $item->product_variant_id);
            if ($resolved === null) {
                continue;
            }
            $foreign = InventoryReservation::reservedByOthers($item->product_id, (string) Auth::id());
            $availability[$item->product_id] = max(0, $resolved[1] - $foreign);
        }

        // §33: every line carries its vendor; the summary lets the checkout
        // group per store and surface paused stores honestly.
        $vendors = $cart->items
            ->map(fn ($item) => $item->product?->vendor)
            ->filter()
            ->unique('id')
            ->map(fn ($vendor) => [
                'id' => $vendor->id,
                'store_name' => $vendor->store_name,
                'slug' => $vendor->slug,
                'accepting_orders' => $vendor->isAcceptingOrders(),
            ])
            ->values();

        return response()->json([
            'data' => [
                'cart' => $cart->fresh(['items.product.vendor', 'items.variant']),
                'subtotal' => number_format($subtotal, 2, '.', ''),
                'discount' => number_format($discount, 2, '.', ''),
                'shipping' => number_format($shipping, 2, '.', ''),
                'tax' => number_format($tax, 2, '.', ''),
                'tax_rate' => CommerceTax::rateLabel(),
                'total' => number_format(max(0, $subtotal - $discount + $shipping + $tax), 2, '.', ''),
                'item_count' => $cart->items->sum('quantity'),
                'availability' => $availability,
                'vendors' => $vendors,
                'estimated_delivery' => $this->estimatedDelivery(),
            ],
        ]);
    }

    public function addItem(Request $request): JsonResponse
    {
        $request->validate([
            'product_id' => 'required|uuid',
            'product_variant_id' => 'nullable|uuid',
            'quantity' => 'required|integer|min:1|max:1000',
        ]);

        $cart = Cart::firstOrCreate(['user_id' => Auth::id()]);

        $resolved = $this->resolveItem($request->product_id, $request->product_variant_id);
        if ($resolved === null) {
            return response()->json(['message' => 'Item not found'], 404);
        }

        [$unitPrice, $stock, $variantName] = $resolved;

        $product = \Modules\Products\Entities\Product::find($request->product_id);
        $vendor = $product?->vendor;
        if ($vendor && ! $vendor->isAcceptingOrders()) {
            return response()->json(['message' => 'Vendor is not accepting orders'], 422);
        }

        // Hold from other users' carts no longer counts as available stock.
        $foreignHeld = InventoryReservation::reservedByOthers($request->product_id, (string) Auth::id());
        $available = max(0, $stock - $foreignHeld);

        $existingItem = $cart->items()
            ->where('product_id', $request->product_id)
            ->when(
                $request->product_variant_id,
                fn ($query) => $query->where('product_variant_id', $request->product_variant_id),
                fn ($query) => $query->whereNull('product_variant_id')
            )
            ->first();
        $newQty = (int) ($existingItem->quantity ?? 0) + (int) $request->quantity;

        if ($newQty > $available) {
            return response()->json([
                'message' => $available <= 0
                    ? 'Item is out of stock'
                    : "Only {$available} left in stock",
            ], 422);
        }

        if ($existingItem) {
            $existingItem->increment('quantity', $request->quantity);
        } else {
            $cart->items()->create([
                'product_id' => $request->product_id,
                'product_variant_id' => $request->product_variant_id,
                'variant_name' => $variantName,
                'quantity' => $request->quantity,
                'unit_price' => $unitPrice,
            ]);
        }

        $this->syncReservations($cart);
        $this->recomputeDiscount($cart);

        return response()->json([
            'message' => 'Item added to cart',
            'data' => $cart->fresh('items.product'),
        ]);
    }

    public function updateItem(Request $request, string $itemId): JsonResponse
    {
        $request->validate([
            'quantity' => 'required|integer|min:1|max:1000',
        ]);

        $cart = Cart::where('user_id', Auth::id())->firstOrFail();
        $item = $cart->items()->where('id', $itemId)->first();
        if (! $item) {
            return response()->json(['message' => 'Cart item not found'], 404);
        }

        $resolved = $this->resolveItem($item->product_id, $item->product_variant_id);
        $stock = $resolved[1] ?? PHP_INT_MAX;
        $foreignHeld = $item->product_variant_id
            ? 0
            : InventoryReservation::reservedByOthers($item->product_id, (string) Auth::id());
        $available = max(0, $stock - $foreignHeld);

        if ((int) $request->quantity > $available) {
            return response()->json([
                'message' => $available <= 0
                    ? 'Item is out of stock'
                    : "Only {$available} left in stock",
            ], 422);
        }

        $item->update(['quantity' => $request->quantity]);
        $this->syncReservations($cart);
        $this->recomputeDiscount($cart);

        return response()->json([
            'message' => 'Cart item updated',
            'data' => $cart->fresh('items.product'),
        ]);
    }

    public function removeItem(string $itemId): JsonResponse
    {
        $cart = Cart::where('user_id', Auth::id())->firstOrFail();
        $cart->items()->where('id', $itemId)->delete();
        $this->syncReservations($cart);
        $this->recomputeDiscount($cart);

        return response()->json([
            'message' => 'Item removed from cart',
            'data' => $cart->fresh('items.product'),
        ]);
    }

    public function clear(): JsonResponse
    {
        $cart = Cart::where('user_id', Auth::id())->first();
        if ($cart) {
            $cart->items()->delete();
            $cart->update(['coupon_code' => null, 'discount_amount' => 0]);
        }

        $this->releaseReservations(Auth::id());

        return response()->json(['message' => 'Cart cleared']);
    }

    /**
     * Store the coupon on the cart and preview the discount.
     * used_count is NOT incremented here — PlaceProductOrder increments once
     * when the order is actually placed (avoids double-counting).
     */
    public function applyCoupon(Request $request): JsonResponse
    {
        $request->validate(['code' => 'required|string']);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($request) {
            $coupon = Coupon::where('code', $request->code)
                ->where('is_active', true)
                ->lockForUpdate()
                ->first();

            if (!$coupon) {
                return response()->json(['message' => 'Invalid coupon code'], 422);
            }

            if ($coupon->expires_at && $coupon->expires_at->isPast()) {
                return response()->json(['message' => 'Coupon has expired'], 422);
            }

            if ($coupon->max_uses && $coupon->used_count >= $coupon->max_uses) {
                return response()->json(['message' => 'Coupon usage limit reached'], 422);
            }

            $cart = Cart::where('user_id', Auth::id())->firstOrFail();
            $cart->loadMissing('items');
            $subtotal = (float) $cart->items->sum(fn ($item) => $item->unit_price * $item->quantity);

            if ($coupon->min_order_amount && $subtotal < $coupon->min_order_amount) {
                return response()->json([
                    'message' => "Minimum order amount of {$coupon->min_order_amount} not met",
                ], 422);
            }

            $discount = match ($coupon->type) {
                'percentage' => round($subtotal * ((float) $coupon->value / 100), 2),
                'fixed' => min((float) $coupon->value, $subtotal),
                default => 0,
            };

            $shipping = $this->shippingService->calculate(max(0, $subtotal - $discount));
            $tax = CommerceTax::amount(max(0, $subtotal - $discount));

            $cart->update([
                'coupon_code' => $coupon->code,
                'discount_amount' => $discount,
            ]);

            return response()->json([
                'message' => 'Coupon applied successfully',
                'data' => [
                    'discount' => number_format($discount, 2, '.', ''),
                    'shipping' => number_format($shipping, 2, '.', ''),
                    'tax' => number_format($tax, 2, '.', ''),
                    'tax_rate' => CommerceTax::rateLabel(),
                    'total' => number_format(max(0, $subtotal - $discount + $shipping + $tax), 2, '.', ''),
                ],
            ]);
        });
    }

    /**
     * Keep the stored discount in sync when items change; clear if the coupon
     * no longer qualifies.
     */
    private function recomputeDiscount(Cart $cart): void
    {
        $cart->loadMissing('items');
        $subtotal = (float) $cart->items->sum(fn ($item) => $item->unit_price * $item->quantity);

        if (! $cart->coupon_code) {
            $cart->update(['discount_amount' => 0]);

            return;
        }

        $coupon = Coupon::where('code', $cart->coupon_code)
            ->where('is_active', true)
            ->first();

        if (
            ! $coupon
            || ($coupon->expires_at && $coupon->expires_at->isPast())
            || ($coupon->max_uses && $coupon->used_count >= $coupon->max_uses)
            || ($coupon->min_order_amount && $subtotal < (float) $coupon->min_order_amount)
            || $subtotal <= 0
        ) {
            $cart->update(['coupon_code' => null, 'discount_amount' => 0]);

            return;
        }

        $discount = match ($coupon->type) {
            'percentage' => round($subtotal * ((float) $coupon->value / 100), 2),
            'fixed' => min((float) $coupon->value, $subtotal),
            default => 0,
        };

        $cart->update(['discount_amount' => $discount]);
    }

    /**
     * Keep this user's active reservations in lock-step with their cart:
     * one row per cart product, refreshed hold window, and hard removal of
     * anything no longer in the cart (avoids unique-index clashes with the
     * soft-delete column, which only the scheduler uses transiently).
     */
    private function syncReservations(Cart $cart): void
    {
        $cart->loadMissing('items');
        $inCart = $cart->items->pluck('quantity', 'product_id');
        $userId = (string) Auth::id();

        InventoryReservation::withTrashed()
            ->where('user_id', $userId)
            ->whereNotIn('product_id', $inCart->keys()->all())
            ->forceDelete();

        foreach ($inCart as $productId => $quantity) {
            InventoryReservation::withTrashed()
                ->where('user_id', $userId)
                ->where('product_id', $productId)
                ->forceDelete();

            InventoryReservation::create([
                'user_id' => $userId,
                'product_id' => (string) $productId,
                'quantity' => max(1, (int) $quantity),
                'expires_at' => now()->addMinutes(InventoryReservation::MINUTES_TO_LIVE),
            ]);
        }
    }

    /**
     * Hard-release every active reservation a user holds (cart cleared,
     * order placed).
     */
    private function releaseReservations(string $userId): void
    {
        InventoryReservation::withTrashed()
            ->where('user_id', $userId)
            ->forceDelete();
    }

    /**
     * Spec §61: ETA date from the active shipping provider's advertised
     * window, or null when none is configured (never a fabricated date).
     */
    private function estimatedDelivery(): ?string
    {
        $days = $this->shippingService->estimatedDays();

        return $days !== null ? now()->addDays($days)->toDateString() : null;
    }

    /**
     * @return array{0: float, 1: int, 2: string|null}|null [unit_price, stock, variant_name]
     */
    private function resolveItem(string $productId, ?string $variantId = null): ?array
    {
        if ($variantId !== null) {
            $variant = \Modules\Products\Entities\ProductVariant::find($variantId);

            if (! $variant
                || $variant->product_id !== $productId
                || ! $variant->is_active
                || $variant->trashed()) {
                return null;
            }

            return [
                (float) $variant->price,
                (int) $variant->stock_quantity,
                (string) $variant->name,
            ];
        }

        $product = \Modules\Products\Entities\Product::find($productId);
        if ($product) {
            return [(float) $product->price, (int) $product->stock_quantity, null];
        }

        $medicine = \Modules\Pharmacy\Entities\Medicine::find($productId);
        if ($medicine) {
            return [(float) $medicine->price, (int) ($medicine->stock_quantity ?? PHP_INT_MAX), null];
        }

        return null;
    }
}
