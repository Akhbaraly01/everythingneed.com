<?php

namespace Tests\Feature\Checkout;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Checkout\Entities\ShippingRate;
use Modules\Products\Entities\Product;
use Tests\TestCase;

class ShippingRateTest extends TestCase
{
    use RefreshDatabase;

    private string $vendorId = '';

    protected function setUp(): void
    {
        parent::setUp();

        $vendorUser = User::factory()->create();
        $this->vendorId = (string) Str::uuid();

        DB::table('vendors')->insert([
            'id' => $this->vendorId,
            'user_id' => $vendorUser->id,
            'store_name' => 'Shipping Test Vendor',
            'category' => 'general',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function seedStandardRate(): void
    {
        (new \Database\Seeders\ShippingRateSeeder())->run();
    }

    private function makeProduct(float $price, int $stock = 50): Product
    {
        return Product::factory()->create([
            'vendor_id' => $this->vendorId,
            'price' => $price,
            'stock_quantity' => $stock,
        ]);
    }

    public function test_no_rates_configured_means_zero_shipping(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct(20.00);

        $this->actingAs($user, 'sanctum')->postJson('/api/cart/items', [
            'product_id' => $product->id,
            'quantity' => 1,
        ])->assertOk();

        $res = $this->actingAs($user, 'sanctum')->getJson('/api/cart')->assertOk();

        $this->assertEquals('0.00', $res->json('data.shipping'));
        $this->assertEquals('20.00', $res->json('data.total'));
    }

    public function test_standard_rate_applies_under_free_threshold(): void
    {
        $this->seedStandardRate();
        $user = User::factory()->create();
        $product = $this->makeProduct(20.00);

        $this->actingAs($user, 'sanctum')->postJson('/api/cart/items', [
            'product_id' => $product->id,
            'quantity' => 1,
        ])->assertOk();

        $res = $this->actingAs($user, 'sanctum')->getJson('/api/cart')->assertOk();

        $this->assertEquals('4.99', $res->json('data.shipping'));
        $this->assertEquals('24.99', $res->json('data.total'));
    }

    public function test_shipping_is_free_at_threshold(): void
    {
        $this->seedStandardRate();
        $user = User::factory()->create();
        $product = $this->makeProduct(25.00);

        // 4 x 25 = 100 >= 50 free threshold
        $this->actingAs($user, 'sanctum')->postJson('/api/cart/items', [
            'product_id' => $product->id,
            'quantity' => 4,
        ])->assertOk();

        $res = $this->actingAs($user, 'sanctum')->getJson('/api/cart')->assertOk();

        $this->assertEquals('0.00', $res->json('data.shipping'));
        $this->assertEquals('100.00', $res->json('data.total'));
    }

    public function test_inactive_rates_are_ignored(): void
    {
        ShippingRate::create([
            'name' => 'Disabled',
            'rate' => 9.99,
            'is_active' => false,
        ]);

        $user = User::factory()->create();
        $product = $this->makeProduct(10.00);
        $this->actingAs($user, 'sanctum')->postJson('/api/cart/items', [
            'product_id' => $product->id,
            'quantity' => 1,
        ])->assertOk();

        $res = $this->actingAs($user, 'sanctum')->getJson('/api/cart')->assertOk();
        $this->assertEquals('0.00', $res->json('data.shipping'));
    }

    public function test_placing_order_stores_server_computed_shipping(): void
    {
        $this->seedStandardRate();
        $user = User::factory()->create();
        $product = $this->makeProduct(20.00);

        $res = $this->actingAs($user, 'sanctum')->postJson('/api/product-orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
            'shipping_address' => '1 Shipping Lane',
            // Client cannot inject a shipping fee - validation ignores it.
            'shipping_fee' => 0.01,
        ]);
        $res->assertStatus(201);

        $order = \Modules\Orders\Entities\Order::find($res->json('data.id'));
        $this->assertEquals(4.99, (float) $order->shipping_fee);
        $this->assertEquals(24.99, (float) $order->total_amount);
        $this->assertEquals(20.00, (float) $order->subtotal);
    }

    public function test_free_threshold_applies_to_discounted_subtotal(): void
    {
        $this->seedStandardRate();
        $user = User::factory()->create();
        $product = $this->makeProduct(60.00);

        // 60 >= 50 -> free even before coupon.
        $this->actingAs($user, 'sanctum')->postJson('/api/cart/items', [
            'product_id' => $product->id,
            'quantity' => 1,
        ])->assertOk();

        $coupon = \Modules\Checkout\Entities\Coupon::create([
            'code' => 'SHIPTEST',
            'type' => 'fixed',
            'value' => 20.00,
            'is_active' => true,
        ]);

        $this->actingAs($user, 'sanctum')->postJson('/api/cart/coupon', [
            'code' => 'SHIPTEST',
        ])->assertOk();

        $res = $this->actingAs($user, 'sanctum')->getJson('/api/cart')->assertOk();

        // Discounted subtotal = 40 < 50, so shipping charges below threshold.
        $this->assertEquals('20.00', $res->json('data.discount'));
        $this->assertEquals('4.99', $res->json('data.shipping'));
        $this->assertEquals('44.99', $res->json('data.total'));
        $this->assertNotNull($coupon->id);
    }
}
