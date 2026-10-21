<?php

namespace Tests\Feature\Products;

use Modules\Products\Entities\Product;
use Modules\Vendors\Entities\Vendor;
use Tests\TestCase;

/**
 * Ranked recommendations ("Related items" / "More to love").
 *
 * The rails must show comparable products, not an arbitrary slice of the
 * catalogue: same shelf first, discovery across categories second, and
 * never an unpublished row.
 */
class ProductRecommendationTest extends TestCase
{
    private function vendor(string $name = 'Store'): Vendor
    {
        return $this->createVendor($this->createUser(), ['store_name' => $name]);
    }

    public function test_related_ranks_the_same_category_first(): void
    {
        $vendor = $this->vendor();

        $subject = Product::factory()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Running shoes',
            'category' => 'electronics',
            'subcategory' => 'shoes',
            'price' => 100,
            'rating' => 4.5,
            'is_active' => true,
        ]);

        $sibling = Product::factory()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Trail shoes',
            'category' => 'electronics',
            'subcategory' => 'shoes',
            'price' => 105,
            'rating' => 4.8,
            'is_active' => true,
        ]);

        $other = Product::factory()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Garden hose',
            'category' => 'home',
            'price' => 20,
            'is_active' => true,
        ]);

        $response = $this->getJson("/api/products/{$subject->id}/related")->assertOk();

        $related = array_column($response->json('related'), 'name');

        $this->assertContains('Trail shoes', $related);
        $this->assertNotContains('Running shoes', $related, 'The product itself is never recommended.');
        $this->assertNotContains('Garden hose', $related, 'Another category belongs in "More to love".');

        $more = array_column($response->json('more'), 'name');
        $this->assertContains('Garden hose', $more);
    }

    public function test_inactive_products_never_reach_the_rails(): void
    {
        $vendor = $this->vendor();

        $subject = Product::factory()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Live product',
            'category' => 'electronics',
            'is_active' => true,
        ]);

        Product::factory()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Hidden product',
            'category' => 'electronics',
            'is_active' => false,
        ]);

        $response = $this->getJson("/api/products/{$subject->id}/related")->assertOk();

        $names = array_merge(
            array_column($response->json('related'), 'name'),
            array_column($response->json('more'), 'name'),
        );

        $this->assertNotContains('Hidden product', $names);
    }

    public function test_unknown_product_returns_404(): void
    {
        $this->getJson('/api/products/does-not-exist/related')->assertStatus(404);
    }
}
