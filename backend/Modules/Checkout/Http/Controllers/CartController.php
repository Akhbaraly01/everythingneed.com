<?php

namespace Modules\Checkout\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Checkout\Entities\Cart;
use Modules\Checkout\Entities\CartItem;
use Modules\Checkout\Entities\Coupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CartController extends Controller
{
    public function show(): JsonResponse
    {
        $cart = Cart::with('items.product')
            ->where('user_id', Auth::id())
            ->firstOrCreate(['user_id' => Auth::id()]);

        $subtotal = $cart->items->sum(fn ($item) => $item->unit_price * $item->quantity);
        $discount = $cart->discount_amount ?? 0;

        return response()->json([
            'data' => [
                'cart' => $cart,
                'subtotal' => number_format($subtotal, 2, '.', ''),
                'discount' => number_format($discount, 2, '.', ''),
                'total' => number_format($subtotal - $discount, 2, '.', ''),
                'item_count' => $cart->items->sum('quantity'),
            ],
        ]);
    }

    public function addItem(Request $request): JsonResponse
    {
        $request->validate([
            'product_id' => 'required|uuid',
            'quantity' => 'required|integer|min:1',
        ]);

        $cart = Cart::firstOrCreate(['user_id' => Auth::id()]);

        $existingItem = $cart->items()->where('product_id', $request->product_id)->first();

        if ($existingItem) {
            $existingItem->increment('quantity', $request->quantity);
        } else {
            // Cart accepts marketplace products and pharmacy medicines.
            $unitPrice = \Modules\Products\Entities\Product::where('id', $request->product_id)
                ->value('price');

            if ($unitPrice === null) {
                $unitPrice = \Modules\Pharmacy\Entities\Medicine::where('id', $request->product_id)
                    ->value('price');
            }

            if ($unitPrice === null) {
                return response()->json(['message' => 'Item not found'], 404);
            }

            $cart->items()->create([
                'product_id' => $request->product_id,
                'quantity' => $request->quantity,
                'unit_price' => $unitPrice,
            ]);
        }

        return response()->json([
            'message' => 'Item added to cart',
            'data' => $cart->fresh('items.product'),
        ]);
    }

    public function updateItem(Request $request, string $itemId): JsonResponse
    {
        $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $cart = Cart::where('user_id', Auth::id())->firstOrFail();
        $item = $cart->items()->findOrFail($itemId);
        $item->update(['quantity' => $request->quantity]);

        return response()->json([
            'message' => 'Cart item updated',
            'data' => $cart->fresh('items.product'),
        ]);
    }

    public function removeItem(string $itemId): JsonResponse
    {
        $cart = Cart::where('user_id', Auth::id())->firstOrFail();
        $cart->items()->where('id', $itemId)->delete();

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

        return response()->json(['message' => 'Cart cleared']);
    }

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
            $subtotal = $cart->items->sum(fn ($item) => $item->unit_price * $item->quantity);

            if ($coupon->min_order_amount && $subtotal < $coupon->min_order_amount) {
                return response()->json([
                    'message' => "Minimum order amount of {$coupon->min_order_amount} not met",
                ], 422);
            }

            $discount = match ($coupon->type) {
                'percentage' => $subtotal * ($coupon->value / 100),
                'fixed' => min($coupon->value, $subtotal),
                default => 0,
            };

            $cart->update([
                'coupon_code' => $coupon->code,
                'discount_amount' => $discount,
            ]);

            $coupon->increment('used_count');

            return response()->json([
                'message' => 'Coupon applied successfully',
                'data' => [
                    'discount' => number_format($discount, 2, '.', ''),
                    'total' => number_format($subtotal - $discount, 2, '.', ''),
                ],
            ]);
        });
    }
}
