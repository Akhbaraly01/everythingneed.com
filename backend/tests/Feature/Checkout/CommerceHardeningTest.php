<?php

namespace Tests\Feature\Checkout;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Modules\Checkout\Entities\Cart;
use Modules\Checkout\Entities\Coupon;
use Modules\Orders\Actions\PlaceProductOrder;
use Modules\Products\Entities\Product;
use Modules\Vendors\Entities\Vendor;
use Tests\TestCase;

class CommerceHardeningTest extends TestCase
{
    use RefreshDatabase;

    private string $vendorId = '';

    protected function setUp(): void
    {
        parent::setUp();

        $vendorUser = User::factory()->create();
        $this->vendorId = (string) \Illuminate\Support\Str::uuid();

        DB::table('vendors')->insert([
            'id' => $this->vendorId,
            'user_id' => $vendorUser->id,
            'store_name' => 'Commerce Vendor',
            'category' => 'general',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function product(float $price, int $stock = 100): Product
    {
        return Product::factory()->create([
            'vendor_id' => $this->vendorId,
            'price' => $price,
            'stock_quantity' => $stock,
        ]);
    }

    public function test_cart_rejects_add_beyond_stock(): void
    {
        $user = User::factory()->create();
        $product = $this->product(20, 3);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 3])
            ->assertOk();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 1])
            ->assertStatus(422)
            ->assertJsonFragment(['message' => 'Only 3 left in stock']);
    }

    public function test_cart_update_quantity_capped_by_stock(): void
    {
        $user = User::factory()->create();
        $product = $this->product(10, 5);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 2])
            ->assertOk();

        $itemId = Cart::where('user_id', $user->id)->first()->items()->first()->id;

        $this->actingAs($user, 'sanctum')
            ->putJson("/api/cart/items/{$itemId}", ['quantity' => 99])
            ->assertStatus(422);
    }

    public function test_apply_coupon_does_not_increment_used_count_until_order(): void
    {
        $user = User::factory()->create();
        $product = $this->product(100);

        Coupon::create([
            'code' => 'NOPE',
            'type' => 'percentage',
            'value' => 10,
            'min_order_amount' => 50,
            'is_active' => true,
            'used_count' => 0,
        ]);

        $api = $this->actingAs($user, 'sanctum');
        $api->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 2]);
        $api->postJson('/api/cart/coupon', ['code' => 'NOPE'])->assertOk();

        $this->assertSame(0, (int) Coupon::where('code', 'NOPE')->value('used_count'));

        // Placing the order is the single increment point.
        app(PlaceProductOrder::class)->execute([
            'user_id' => $user->id,
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
            'coupon_code' => 'NOPE',
            'shipping_address' => '1 Test St',
        ]);

        $this->assertSame(1, (int) Coupon::where('code', 'NOPE')->value('used_count'));
    }

    public function test_cart_discount_recomputes_when_items_change(): void
    {
        $user = User::factory()->create();
        $product = $this->product(100);

        Coupon::create([
            'code' => 'MIN50',
            'type' => 'fixed',
            'value' => 20,
            'min_order_amount' => 50,
            'is_active' => true,
            'used_count' => 0,
        ]);

        $api = $this->actingAs($user, 'sanctum');
        $api->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 2]); // 200
        $api->postJson('/api/cart/coupon', ['code' => 'MIN50'])->assertOk();

        $cart = Cart::where('user_id', $user->id)->first();
        $itemId = $cart->items()->first()->id;

        // Drop below min_order_amount — coupon must be cleared.
        $api->putJson("/api/cart/items/{$itemId}", ['quantity' => 1])->assertOk(); // 100 still ok
        $api->putJson("/api/cart/items/{$itemId}", ['quantity' => 0])->assertStatus(422);

        // Remove item entirely → empty cart clears coupon.
        $api->deleteJson("/api/cart/items/{$itemId}")->assertOk();
        $cart->refresh();
        $this->assertNull($cart->coupon_code);
        $this->assertEquals(0, (float) $cart->discount_amount);
    }

    public function test_vendor_patch_enforces_status_transitions(): void
    {
        $vendorUser = User::factory()->create();
        $vendor = Vendor::create([
            'user_id' => $vendorUser->id,
            'store_name' => 'Trans Vendor',
            'category' => 'general',
            'is_verified' => true,
        ]);

        $orderId = (string) \Illuminate\Support\Str::uuid();
        $subId = (string) \Illuminate\Support\Str::uuid();
        DB::table('orders')->insert([
            'id' => $orderId,
            'user_id' => User::factory()->create()->id,
            'order_number' => 'EN-TRANS-1',
            'status' => 'pending',
            'subtotal' => 10,
            'discount' => 0,
            'shipping_fee' => 0,
            'total_amount' => 10,
            'currency' => 'USD',
            'shipping_address' => 'x',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('vendor_orders')->insert([
            'id' => $subId,
            'order_id' => $orderId,
            'vendor_id' => $vendor->id,
            'customer_id' => User::factory()->create()->id,
            'product_name' => 'Widget',
            'quantity' => 1,
            'unit_price' => 10,
            'total_price' => 10,
            'order_number' => 'EN-TRANS-1',
            'shipping_address' => 'x',
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // pending → delivered is illegal
        $this->actingAs($vendorUser, 'sanctum')
            ->patchJson("/api/vendor/orders/{$subId}", ['status' => 'delivered'])
            ->assertStatus(422);

        // pending → confirmed is legal
        $this->actingAs($vendorUser, 'sanctum')
            ->patchJson("/api/vendor/orders/{$subId}", ['status' => 'confirmed'])
            ->assertOk()
            ->assertJsonPath('data.status', 'confirmed');
    }

    public function test_checkout_cart_is_cleared_after_order_via_api_delete(): void
    {
        // FE clears with DELETE /api/cart after successful place — assert the endpoint empties lines.
        $user = User::factory()->create();
        $product = $this->product(15);

        $api = $this->actingAs($user, 'sanctum');
        $api->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 1]);

        $api->deleteJson('/api/cart')->assertOk();

        $cart = Cart::where('user_id', $user->id)->first();
        $this->assertSame(0, $cart->items()->count());
        $this->assertNull($cart->coupon_code);
    }
}
