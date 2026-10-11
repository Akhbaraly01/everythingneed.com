<?php

namespace Tests\Feature\Products;

use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * Spec 101 (admin-created product example): a product created + published
 * through the admin console must automatically appear in the product
 * listing, its category, search, discovery, the vendor page and the
 * product detail - with no manual re-publish step.
 */
class AdminCreatedProductDiscoveryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        Cache::forget('rbac.matrix');
    }

    private function ids($rows): array
    {
        return collect($rows)->pluck('id')->all();
    }

    public function test_admin_created_published_product_appears_in_every_discovery_surface(): void
    {
        $vendor = $this->createVendor($this->createUser());
        $this->actingAsAdmin();

        $created = $this->postJson('/api/products', [
            'vendor_id' => $vendor->id,
            'name' => 'Zebra Discovery Widget',
            'description' => 'Spec 101 discovery probe product.',
            'category' => 'electronics',
            'price' => 42.0,
            'stock_quantity' => 5,
        ])->assertStatus(201)
            ->assertJsonPath('data.is_active', true);

        $productId = $created->json('data.id');
        $this->assertNotNull($productId);

        // 1. Product listing.
        $listing = $this->getJson('/api/products?per_page=100')->assertOk();
        $this->assertContains($productId, $this->ids($listing->json('data')), 'listing');

        // 2. Category filter.
        $category = $this->getJson('/api/products?category=electronics&per_page=100')
            ->assertOk();
        $this->assertContains($productId, $this->ids($category->json('data')), 'category');

        // 3. Name search on the listing API.
        $searchFilter = $this->getJson('/api/products?search=Zebra&per_page=100')
            ->assertOk();
        $this->assertContains($productId, $this->ids($searchFilter->json('data')), 'search filter');

        // 4. Vendor scoping (what the vendor storefront queries).
        $vendorScoped = $this->getJson('/api/products?vendor_id='.$vendor->id.'&per_page=100')
            ->assertOk();
        $this->assertContains($productId, $this->ids($vendorScoped->json('data')), 'vendor scope');

        // 5. Product detail.
        $this->getJson('/api/products/'.$productId)
            ->assertOk()
            ->assertJsonPath('data.id', $productId);

        // 6. Search (typed discovery).
        $typed = $this->getJson('/api/search?q=Zebra%20Discovery%20Widget&type=products')
            ->assertOk();
        $this->assertContains($productId, $this->ids($typed->json('data.products')), 'typed search');

        // 7. Discovery (unified search across verticals).
        $unified = $this->getJson('/api/search?q=Zebra%20Discovery%20Widget')->assertOk();
        $this->assertContains($productId, $this->ids($unified->json('data.products')), 'discovery');

        // 8. Vendor page renders the product server-side.
        $this->get('/vendors/'.$vendor->slug)
            ->assertOk()
            ->assertSee('Zebra Discovery Widget');
    }
}
