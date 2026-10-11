<?php

namespace Tests\Feature\Checkout;

use App\Models\User;
use Core\Exceptions\ValidationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Modules\Orders\Actions\PlaceProductOrder;
use Modules\Products\Entities\Product;
use Modules\Products\Entities\ProductVariant;
use Tests\TestCase;

/**
 * W19 (F-04): variant rows are locked inside the checkout transaction
 * (products already were) so the last unit of variant stock can only
 * ever be sold once. Pins sequential exhaustion end-to-end.
 */
class VariantStockLockTest extends TestCase
{
    use RefreshDatabase;

    private function variant(int $stock): ProductVariant
    {
        $vendorUser = User::factory()->create();
        $vendorId = (string) \Illuminate\Support\Str::uuid();

        DB::table('vendors')->insert([
            'id' => $vendorId,
            'user_id' => $vendorUser->id,
            'store_name' => 'Variant Vendor',
            'category' => 'general',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $product = Product::factory()->create([
            'vendor_id' => $vendorId,
            'price' => 25,
            'stock_quantity' => 50,
        ]);

        return ProductVariant::create([
            'product_id' => $product->id,
            'name' => 'Size M',
            'sku' => 'VAR-'.uniqid(),
            'price' => 25,
            'stock_quantity' => $stock,
            'is_active' => true,
        ]);
    }

    public function test_last_variant_unit_sells_exactly_once(): void
    {
        $variant = $this->variant(1);
        $buyer = User::factory()->create();
        $other = User::factory()->create();

        app(PlaceProductOrder::class)->execute([
            'user_id' => $buyer->id,
            'items' => [[
                'product_id' => $variant->product_id,
                'variant_id' => $variant->id,
                'quantity' => 1,
            ]],
            'shipping_address' => '1 Test St',
        ]);

        $this->assertSame(0, (int) $variant->fresh()->stock_quantity);

        // The second buyer now sees the exhausted stock - 422, never negative.
        try {
            app(PlaceProductOrder::class)->execute([
                'user_id' => $other->id,
                'items' => [[
                    'product_id' => $variant->product_id,
                    'variant_id' => $variant->id,
                    'quantity' => 1,
                ]],
                'shipping_address' => '2 Test St',
            ]);
            $this->fail('Second order on exhausted variant stock must fail');
        } catch (ValidationException $e) {
            $this->assertStringContainsString('Insufficient stock', $e->getMessage());
        }

        $this->assertSame(0, (int) $variant->fresh()->stock_quantity);
    }

    public function test_variant_stock_partial_orders(): void
    {
        $variant = $this->variant(5);
        $buyer = User::factory()->create();

        app(PlaceProductOrder::class)->execute([
            'user_id' => $buyer->id,
            'items' => [[
                'product_id' => $variant->product_id,
                'variant_id' => $variant->id,
                'quantity' => 2,
            ]],
            'shipping_address' => '1 Test St',
        ]);

        $this->assertSame(3, (int) $variant->fresh()->stock_quantity);
    }
}
