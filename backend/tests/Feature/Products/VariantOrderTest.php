<?php

namespace Tests\Feature\Products;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Orders\Actions\PlaceProductOrder;
use Modules\Orders\Entities\Order;
use Modules\Products\Entities\Product;
use Modules\Products\Entities\ProductVariant;
use Modules\Vendors\Entities\Vendor;
use Tests\TestCase;

class VariantOrderTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_with_variant_uses_variant_price(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $vendor = Vendor::create(['user_id' => $user->id, 'store_name' => 'V', 'category' => 'apparel']);

        $product = Product::create([
            'vendor_id' => $vendor->id,
            'name' => 'T-Shirt',
            'category' => 'apparel',
            'price' => 20.00,
            'stock_quantity' => 50,
            'is_active' => true,
            'approved_at' => now(),
        ]);

        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'name' => 'Large / Red',
            'sku' => 'TS-L-RED',
            'price' => 25.00,
            'stock_quantity' => 10,
            'attributes' => ['size' => 'L', 'color' => 'Red'],
        ]);

        $order = app(PlaceProductOrder::class)->execute([
            'user_id' => $user->id,
            'items' => [['product_id' => $product->id, 'variant_id' => $variant->id, 'quantity' => 2]],
            'shipping_address' => '123 Test St',
        ]);

        $this->assertEquals(50.00, (float) $order->subtotal);
        $this->assertDatabaseHas('order_items', [
            'order_id' => $order->id,
            'variant_id' => $variant->id,
            'variant_name' => 'Large / Red',
            'unit_price' => 25.00,
        ]);

        // Variant stock should be decremented
        $this->assertEquals(8, $variant->fresh()->stock_quantity);
    }

    public function test_order_without_variant_uses_product_price(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $vendor = Vendor::create(['user_id' => $user->id, 'store_name' => 'V', 'category' => 'electronics']);

        $product = Product::create([
            'vendor_id' => $vendor->id,
            'name' => 'Cable',
            'category' => 'electronics',
            'price' => 9.99,
            'stock_quantity' => 100,
            'is_active' => true,
            'approved_at' => now(),
        ]);

        $order = app(PlaceProductOrder::class)->execute([
            'user_id' => $user->id,
            'items' => [['product_id' => $product->id, 'quantity' => 3]],
            'shipping_address' => '123 Test St',
        ]);

        $this->assertEquals(29.97, (float) $order->subtotal);
        $this->assertDatabaseHas('order_items', [
            'order_id' => $order->id,
            'variant_id' => null,
            'unit_price' => 9.99,
        ]);
    }

    public function test_order_rejects_unavailable_variant(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $vendor = Vendor::create(['user_id' => $user->id, 'store_name' => 'V', 'category' => 'general']);

        $product = Product::create([
            'vendor_id' => $vendor->id,
            'name' => 'Item',
            'category' => 'general',
            'price' => 10.00,
            'stock_quantity' => 50,
            'is_active' => true,
            'approved_at' => now(),
        ]);

        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'name' => 'Variant A',
            'price' => 15.00,
            'stock_quantity' => 0,
        ]);

        $this->expectException(\Core\Exceptions\ValidationException::class);

        app(PlaceProductOrder::class)->execute([
            'user_id' => $user->id,
            'items' => [['product_id' => $product->id, 'variant_id' => $variant->id, 'quantity' => 1]],
            'shipping_address' => '123 Test St',
        ]);
    }
}
