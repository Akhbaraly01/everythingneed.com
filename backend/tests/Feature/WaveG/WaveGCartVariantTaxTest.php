<?php

namespace Tests\Feature\WaveG;

use App\Models\User;
use Modules\Checkout\Entities\Cart;
use Modules\Products\Entities\Product;
use Modules\Products\Entities\ProductVariant;
use Modules\Vendors\Entities\Vendor;
use Tests\TestCase;

/**
 * Wave G - spec §33 cart: variants, server-computed tax keys, vendor
 * summary and the accepting-orders guard.
 */
class WaveGCartVariantTaxTest extends TestCase
{
    private string $vendorId = '';
    private Vendor $vendor;

    protected function setUp(): void
    {
        parent::setUp();

        $vendorUser = $this->createVendorUser();
        $this->vendor = Vendor::create([
            'user_id' => $vendorUser->id,
            'store_name' => 'Cart Variant Store',
            'category' => 'general',
        ]);
        $this->vendorId = $this->vendor->id;
    }

    private function makeProduct(float $price = 40.00, int $stock = 50): Product
    {
        return Product::create([
            'vendor_id' => $this->vendorId,
            'name' => 'Variant Product',
            'category' => 'general',
            'price' => $price,
            'stock_quantity' => $stock,
            'is_active' => true,
            'approved_at' => now(),
        ]);
    }

    public function test_cart_show_exposes_wave_g_totals_shape(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct();

        $api = $this->actingAs($user, 'sanctum');
        $api->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 1]);

        $show = $api->getJson('/api/cart');
        $show->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'cart', 'subtotal', 'discount', 'shipping', 'tax', 'tax_rate',
                    'total', 'item_count', 'availability', 'vendors', 'estimated_delivery',
                ],
            ]);

        // Default commerce tax rate is 0 - totals stay pinned to subtotal+shipping.
        $this->assertEquals('0.00', $show->json('data.tax'));
        $this->assertEquals($show->json('data.subtotal'), $show->json('data.total'));
        $this->assertTrue($show->json('data.vendors.0.accepting_orders'));
        $this->assertEquals($this->vendor->slug, $show->json('data.vendors.0.slug'));
    }

    public function test_variant_line_uses_variant_pricing_and_carries_variant_name(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct(price: 40.00, stock: 10);
        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'name' => 'Deluxe Edition',
            'price' => 59.99,
            'stock_quantity' => 3,
            'is_active' => true,
        ]);

        $api = $this->actingAs($user, 'sanctum');
        $api->postJson('/api/cart/items', [
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'quantity' => 2,
        ])->assertStatus(200);

        $item = Cart::where('user_id', $user->id)->with('items')->first()->items->first();
        $this->assertEquals('59.99', $item->unit_price);
        $this->assertEquals($variant->id, $item->product_variant_id);
        $this->assertEquals('Deluxe Edition', $item->variant_name);

        $show = $api->getJson('/api/cart');
        $this->assertEquals('119.98', $show->json('data.subtotal'));
        $this->assertEquals('Deluxe Edition', $show->json('data.cart.items.0.variant_name'));
    }

    public function test_variant_stock_is_validated_on_update(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct();
        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'name' => 'Limited',
            'price' => 15.00,
            'stock_quantity' => 2,
            'is_active' => true,
        ]);

        $api = $this->actingAs($user, 'sanctum');
        $api->postJson('/api/cart/items', [
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'quantity' => 1,
        ])->assertStatus(200);

        $itemId = Cart::where('user_id', $user->id)->first()->items()->first()->id;

        $api->putJson("/api/cart/items/{$itemId}", ['quantity' => 5])->assertStatus(422);
        $api->putJson("/api/cart/items/{$itemId}", ['quantity' => 2])->assertStatus(200);
    }

    public function test_paused_vendor_blocks_add_to_cart(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct();
        $this->vendor->update(['settings' => ['accepting_orders' => false]]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 1])
            ->assertStatus(422)
            ->assertJsonFragment(['message' => 'Vendor is not accepting orders']);
    }

    public function test_inactive_variant_is_rejected(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct();
        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'name' => 'Retired',
            'price' => 9.99,
            'stock_quantity' => 5,
            'is_active' => false,
        ]);

        // An unavailable variant resolves to a not-found answer (same as a
        // vanished product) - never silently added at base-product pricing.
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/cart/items', [
                'product_id' => $product->id,
                'product_variant_id' => $variant->id,
                'quantity' => 1,
            ])
            ->assertStatus(404);
    }
}
