<?php

namespace Tests\Feature\WaveS;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Wave S — server page contracts the browser depends on: the products
 * listing must serve the wrapped {data, meta} shape (a raw paginator has
 * no `meta` key and crashes products/Index on `.total`).
 */
class WaveSPageContractsTest extends TestCase
{
    public function test_products_page_serves_wrapped_data_meta_shape(): void
    {
        DB::table('products')->insert([
            'id' => (string) Str::uuid(),
            'vendor_id' => (string) Str::uuid(),
            'name' => 'WaveS Widget',
            'description' => 'x',
            'category' => 'misc',
            'price' => 9,
            'stock_quantity' => 2,
            'is_active' => true,
            'approved_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $res = $this->get('/products')->assertOk();

        $products = $res->viewData('page')['props']['products'];
        $this->assertIsArray($products['data']);
        $this->assertNotEmpty($products['data']);
        foreach (['current_page', 'last_page', 'per_page', 'total'] as $key) {
            $this->assertArrayHasKey($key, $products['meta']);
        }
    }
}
