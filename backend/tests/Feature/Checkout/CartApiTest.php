<?php

namespace Tests\Feature\Checkout;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Checkout\Entities\Coupon;
use Modules\Products\Entities\Product;
use Tests\TestCase;

class CartApiTest extends TestCase
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
            'store_name' => 'Cart Test Vendor',
            'category' => 'general',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

private function makeProduct(float $price): Product
    {
        return Product::factory()->create([
            'vendor_id' => $this->vendorId,
            'price' => $price,
            'stock_quantity' => 50,
        ]);
    }

    public function test_guest_cannot_access_cart(): void
    {
        $this->getJson('/api/cart')->assertStatus(401);
        $this->postJson('/api/cart/items', [
            'product_id' => '00000000-0000-0000-0000-000000000000',
            'quantity' => 1,
        ])->assertStatus(401);
    }

public function test_add_item_uses_server_side_pricing_and_merges_duplicates(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create([
            'vendor_id' => $this->vendorId,
            'price' => 40.00,
            'stock_quantity' => 50,
        ]);

        $add = $this->actingAs($user, 'sanctum')->postJson('/api/cart/items', [
            'product_id' => $product->id,
            'quantity' => 2,
        ]);
        $add->assertStatus(200);

        // Client cannot dictate price — assert stored unit price matches catalogue
        $cart = \Modules\Checkout\Entities\Cart::where('user_id', $user->id)->with('items')->first();
        $item = $cart->items->first();
        $this->assertEquals('40.00', $item->unit_price);
        $this->assertEquals(2, $item->quantity);

        // Adding the same product merges quantities instead of duplicating lines
        $this->actingAs($user, 'sanctum')->postJson('/api/cart/items', [
            'product_id' => $product->id,
            'quantity' => 3,
        ])->assertStatus(200);

        $cart->refresh();
        $this->assertEquals(1, $cart->items()->count());
        $this->assertEquals(5, $cart->items()->first()->quantity);
    }

public function test_show_returns_computed_totals(): void
    {
        $user = User::factory()->create();
        $p1 = Product::factory()->create(['vendor_id' => $this->vendorId, 'price' => 30, 'stock_quantity' => 50]);
        $p2 = Product::factory()->create(['vendor_id' => $this->vendorId, 'price' => 12.5, 'stock_quantity' => 50]);

        $api = $this->actingAs($user, 'sanctum');
        $api->postJson('/api/cart/items', ['product_id' => $p1->id, 'quantity' => 2]); // 60
        $api->postJson('/api/cart/items', ['product_id' => $p2->id, 'quantity' => 4]); // 50

        $show = $api->getJson('/api/cart');
        $show->assertStatus(200);
        $this->assertEquals('110.00', $show->json('data.subtotal'));
        $this->assertEquals('110.00', $show->json('data.total'));
        $this->assertEquals(6, $show->json('data.item_count'));
    }

public function test_update_quantity_recomputes_total(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create([
            'vendor_id' => $this->vendorId,
            'price' => 20,
            'stock_quantity' => 50,
        ]);

        $itemId = null;
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 1])
            ->assertStatus(200);

        $itemId = \Modules\Checkout\Entities\Cart::where('user_id', $user->id)->first()->items()->first()->id;

        $update = $this->actingAs($user, 'sanctum')
            ->putJson("/api/cart/items/{$itemId}", ['quantity' => 7]);
        $update->assertStatus(200);

        $total = $this->actingAs($user, 'sanctum')->getJson('/api/cart')->json('data.total');
        $this->assertEquals('140.00', $total);
    }

public function test_percentage_coupon_applies_discount(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create([
            'vendor_id' => $this->vendorId,
            'price' => 100,
            'stock_quantity' => 50,
        ]);

        Coupon::create([
            'code' => 'SAVE10',
            'type' => 'percentage',
            'value' => 10,
            'min_order_amount' => 50,
            'is_active' => true,
            'used_count' => 0,
        ]);

        $api = $this->actingAs($user, 'sanctum');
        $api->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 2]); // 200

        $applied = $api->postJson('/api/cart/coupon', ['code' => 'SAVE10']);
        $applied->assertStatus(200);
        $this->assertEquals('20.00', $applied->json('data.discount'));
        $this->assertEquals('180.00', $applied->json('data.total'));
    }

    public function test_remove_and_clear_behave(): void
    {
        $user = User::factory()->create();
        $p1 = $this->makeProduct(10.0);
        $p2 = $this->makeProduct(10.0);

        $api = $this->actingAs($user, 'sanctum');
        $api->postJson('/api/cart/items', ['product_id' => $p1->id, 'quantity' => 1]);
        $api->postJson('/api/cart/items', ['product_id' => $p2->id, 'quantity' => 1]);

        $cart = \Modules\Checkout\Entities\Cart::where('user_id', $user->id)->first();
        $firstId = $cart->items()->orderBy('created_at')->first()->id;

        $api->deleteJson("/api/cart/items/{$firstId}")->assertStatus(200);
        $this->assertEquals(1, $cart->items()->count());

        $api->deleteJson('/api/cart')->assertStatus(200);
        $this->assertEquals(0, $cart->items()->count());
    }
}
