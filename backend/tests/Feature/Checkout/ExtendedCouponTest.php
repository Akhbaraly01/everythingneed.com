<?php

namespace Tests\Feature\Checkout;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Checkout\Entities\Coupon;
use Modules\Orders\Actions\PlaceProductOrder;
use Modules\Orders\Entities\Order;
use Modules\Products\Entities\Product;
use Modules\Vendors\Entities\Vendor;
use Tests\TestCase;

class ExtendedCouponTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create(['email_verified_at' => now()]);
        $vendor = Vendor::create(['user_id' => $this->user->id, 'store_name' => 'V', 'category' => 'electronics']);
        $this->product = Product::create([
            'vendor_id' => $vendor->id,
            'name' => 'Widget',
            'category' => 'electronics',
            'price' => 100.00,
            'stock_quantity' => 50,
            'is_active' => true,
            'approved_at' => now(),
        ]);
    }

    public function test_per_user_limit_is_enforced(): void
    {
        $coupon = Coupon::create([
            'code' => 'ONCE',
            'type' => 'percentage',
            'value' => 10,
            'per_user_limit' => 1,
            'is_active' => true,
        ]);

        // First order uses the coupon successfully.
        $order1 = app(PlaceProductOrder::class)->execute([
            'user_id' => $this->user->id,
            'items' => [['product_id' => $this->product->id, 'quantity' => 1]],
            'shipping_address' => '123',
            'coupon_code' => 'ONCE',
        ]);

        $this->assertEquals(10.00, (float) $order1->discount);
        $this->assertEquals('ONCE', $order1->coupon_code);

        // Second order should not get the discount.
        $order2 = app(PlaceProductOrder::class)->execute([
            'user_id' => $this->user->id,
            'items' => [['product_id' => $this->product->id, 'quantity' => 1]],
            'shipping_address' => '123',
            'coupon_code' => 'ONCE',
        ]);

        $this->assertEquals(0.0, (float) $order2->discount);
    }

    public function test_category_restricted_coupon_only_applies_to_matching_items(): void
    {
        $coupon = Coupon::create([
            'code' => 'APPCAT',
            'type' => 'percentage',
            'value' => 20,
            'applicable_categories' => ['food'],
            'is_active' => true,
        ]);

        // Product is in 'electronics', coupon only for 'food' → no discount.
        $order = app(PlaceProductOrder::class)->execute([
            'user_id' => $this->user->id,
            'items' => [['product_id' => $this->product->id, 'quantity' => 1]],
            'shipping_address' => '123',
            'coupon_code' => 'APPCAT',
        ]);

        $this->assertEquals(0.0, (float) $order->discount);
    }

    public function test_category_restricted_coupon_applies_when_matching(): void
    {
        $coupon = Coupon::create([
            'code' => 'ELEC20',
            'type' => 'percentage',
            'value' => 20,
            'applicable_categories' => ['electronics'],
            'is_active' => true,
        ]);

        $order = app(PlaceProductOrder::class)->execute([
            'user_id' => $this->user->id,
            'items' => [['product_id' => $this->product->id, 'quantity' => 1]],
            'shipping_address' => '123',
            'coupon_code' => 'ELEC20',
        ]);

        $this->assertEquals(20.00, (float) $order->discount);
    }

    public function test_product_restricted_coupon_applies_only_to_specific_product(): void
    {
        $otherProduct = Product::create([
            'vendor_id' => $this->product->vendor_id,
            'name' => 'Other Widget',
            'category' => 'electronics',
            'price' => 50.00,
            'stock_quantity' => 20,
            'is_active' => true,
            'approved_at' => now(),
        ]);

        $coupon = Coupon::create([
            'code' => 'WIDGET10',
            'type' => 'fixed',
            'value' => 10,
            'applicable_product_id' => $this->product->id,
            'is_active' => true,
        ]);

        // Order with other product → no discount.
        $order1 = app(PlaceProductOrder::class)->execute([
            'user_id' => $this->user->id,
            'items' => [['product_id' => $otherProduct->id, 'quantity' => 1]],
            'shipping_address' => '123',
            'coupon_code' => 'WIDGET10',
        ]);
        $this->assertEquals(0.0, (float) $order1->discount);

        // Order with matching product → gets discount.
        $order2 = app(PlaceProductOrder::class)->execute([
            'user_id' => $this->user->id,
            'items' => [['product_id' => $this->product->id, 'quantity' => 1]],
            'shipping_address' => '123',
            'coupon_code' => 'WIDGET10',
        ]);
        $this->assertEquals(10.00, (float) $order2->discount);
    }
}
