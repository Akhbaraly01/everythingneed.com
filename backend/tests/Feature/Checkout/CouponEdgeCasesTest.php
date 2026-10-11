<?php

namespace Tests\Feature\Checkout;

use Modules\Checkout\Entities\Coupon;
use Modules\Orders\Entities\Order;
use Modules\Products\Entities\Product;
use Modules\Vendors\Entities\Vendor;
use Tests\TestCase;

/**
 * W9 (Y-02): coupon edge cases at the HTTP surface.
 *
 * Complements ExtendedCouponTest (per-user/category/product rules) with
 * expiry, usage caps, minimum-order, inactivity, discount capping, and
 * the single-coupon (no stacking) rule - through POST /api/cart/coupon
 * and POST /api/product-orders.
 */
class CouponEdgeCasesTest extends TestCase
{
    private function makeVendorProduct(float $price = 25.0, int $stock = 50): Product
    {
        $vendorUser = $this->createVendorUser();
        $vendor = Vendor::create([
            'user_id' => $vendorUser->id,
            'store_name' => 'Coupon Store',
            'category' => 'electronics',
            'is_verified' => true,
        ]);

        return Product::create([
            'vendor_id' => $vendor->id,
            'name' => 'Coupon Widget',
            'description' => 'For coupon edges',
            'category' => 'electronics',
            'price' => $price,
            'stock_quantity' => $stock,
            'is_active' => true,
            'approved_at' => now(),
        ]);
    }

    /** Seed a cart holding 2x25.00 = 50.00 subtotal for cart-level coupon calls. */
    private function seedCart(Product $product): void
    {
        $this->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 2])
            ->assertOk();
    }

    private function placeOrder(Product $product, ?string $couponCode, int $qty = 2): Order
    {
        $payload = [
            'items' => [['product_id' => $product->id, 'quantity' => $qty]],
            'shipping_address' => '1 Coupon Way',
            'shipping_city' => 'Accra',
        ];
        if ($couponCode !== null) {
            $payload['coupon_code'] = $couponCode;
        }

        $response = $this->postJson('/api/product-orders', $payload);
        $response->assertStatus(201);

        return Order::find($response->json('data.id'));
    }

    public function test_expired_and_inactive_coupons_never_discount_an_order(): void
    {
        $product = $this->makeVendorProduct();
        $customer = $this->createUser();
        $this->actingAs($customer, 'sanctum');

        Coupon::create([
            'code' => 'EXPIRED10',
            'type' => 'fixed',
            'value' => 10,
            'expires_at' => now()->subDay(),
            'is_active' => true,
        ]);
        Coupon::create([
            'code' => 'INACTIVE10',
            'type' => 'fixed',
            'value' => 10,
            'is_active' => false,
        ]);

        // Cart-level application rejects both explicitly.
        $this->seedCart($product);
        $this->postJson('/api/cart/coupon', ['code' => 'EXPIRED10'])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Coupon has expired');
        $this->postJson('/api/cart/coupon', ['code' => 'INACTIVE10'])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Invalid coupon code');

        // Placement silently drops an expired/inactive code: full price.
        $order = $this->placeOrder($product, 'EXPIRED10');
        $this->assertNull($order->coupon_code);
        $this->assertEquals(0.0, (float) $order->discount);
        $this->assertEquals(50.0, (float) $order->total_amount);

        $order2 = $this->placeOrder($product, 'INACTIVE10');
        $this->assertNull($order2->coupon_code);
        $this->assertEquals(0.0, (float) $order2->discount);
    }

    public function test_max_uses_and_min_order_amount_boundaries(): void
    {
        $product = $this->makeVendorProduct();
        $customer = $this->createUser();
        $this->actingAs($customer, 'sanctum');

        Coupon::create([
            'code' => 'MAXEDOUT',
            'type' => 'fixed',
            'value' => 5,
            'max_uses' => 1,
            'used_count' => 1,
            'is_active' => true,
        ]);
        Coupon::create([
            'code' => 'BIGMIN',
            'type' => 'percentage',
            'value' => 20,
            'min_order_amount' => 1000,
            'is_active' => true,
        ]);
        Coupon::create([
            'code' => 'EXACTMIN',
            'type' => 'fixed',
            'value' => 7,
            'min_order_amount' => 50,
            'is_active' => true,
        ]);

        $this->seedCart($product); // subtotal 50.00

        $this->postJson('/api/cart/coupon', ['code' => 'MAXEDOUT'])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Coupon usage limit reached');
        $bigMin = $this->postJson('/api/cart/coupon', ['code' => 'BIGMIN']);
        $bigMin->assertStatus(422);
        $this->assertStringContainsString('Minimum order amount', (string) $bigMin->json('message'));
        // Boundary: subtotal exactly equals min_order_amount - still qualifies.
        $this->postJson('/api/cart/coupon', ['code' => 'EXACTMIN'])->assertOk();

        // Exhausted cap also loses its discount at placement.
        $order = $this->placeOrder($product, 'MAXEDOUT');
        $this->assertNull($order->coupon_code);
        $this->assertEquals(0.0, (float) $order->discount);
    }

    public function test_fixed_discount_is_capped_at_subtotal_and_percentage_computes(): void
    {
        $product = $this->makeVendorProduct();
        $customer = $this->createUser();
        $this->actingAs($customer, 'sanctum');

        Coupon::create(['code' => 'HUGE', 'type' => 'fixed', 'value' => 999, 'is_active' => true]);
        Coupon::create(['code' => 'TENPCT', 'type' => 'percentage', 'value' => 10, 'is_active' => true]);

        // Fixed 999 on a 50 subtotal can never create negative money.
        $capped = $this->placeOrder($product, 'HUGE');
        $this->assertEquals(50.0, (float) $capped->discount, 'Discount capped at subtotal');
        $this->assertEquals(0.0, (float) $capped->total_amount, 'Server total never negative');

        // 10% of 50 = 5.00.
        $pct = $this->placeOrder($product, 'TENPCT');
        $this->assertEquals(5.0, (float) $pct->discount);
        $this->assertEquals(45.0, (float) $pct->total_amount);
    }

    public function test_single_coupon_rule_replaces_previous_code_never_stacks(): void
    {
        $product = $this->makeVendorProduct();
        $customer = $this->createUser();
        $this->actingAs($customer, 'sanctum');

        Coupon::create(['code' => 'FIVE', 'type' => 'fixed', 'value' => 5, 'is_active' => true]);
        Coupon::create(['code' => 'TEN', 'type' => 'fixed', 'value' => 10, 'is_active' => true]);

        $this->seedCart($product); // subtotal 50.00

        // Applying a second code replaces the first (single active code).
        $this->postJson('/api/cart/coupon', ['code' => 'FIVE'])->assertOk();
        $this->postJson('/api/cart/coupon', ['code' => 'TEN'])->assertOk();

        $cartRow = \Modules\Checkout\Entities\Cart::where('user_id', $customer->id)->firstOrFail();
        $this->assertSame('TEN', (string) $cartRow->coupon_code, 'Second code replaces the first');
        $this->assertEquals(10.0, (float) $cartRow->discount_amount);

        // Placement honours exactly one code - never FIVE+TEN combined.
        $order = $this->placeOrder($product, 'TEN');
        $this->assertSame('TEN', $order->coupon_code);
        $this->assertEquals(10.0, (float) $order->discount);
        $this->assertEquals(40.0, (float) $order->total_amount);
        $this->assertLessThan(15.0, (float) $order->discount, 'Coupons must never stack');
    }

    public function test_unknown_coupon_is_rejected_and_order_stays_full_price(): void
    {
        $product = $this->makeVendorProduct();
        $customer = $this->createUser();
        $this->actingAs($customer, 'sanctum');

        $this->seedCart($product);
        $this->postJson('/api/cart/coupon', ['code' => 'NOPE404'])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Invalid coupon code');

        $order = $this->placeOrder($product, 'NOPE404');
        $this->assertNull($order->coupon_code);
        $this->assertEquals(50.0, (float) $order->total_amount);
    }
}
