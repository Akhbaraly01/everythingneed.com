<?php

namespace Tests\Feature\Needs;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Products\Entities\Product;
use Modules\Vendors\Entities\Vendor;
use Tests\TestCase;

/**
 * W10: agriculture marketplace surfaces.
 *
 * Pins GET /api/agriculture (active agri products only) and the farmer
 * directory backing /agriculture/farmers (vendor category filter).
 */
class AgricultureMarketplaceTest extends TestCase
{
    use RefreshDatabase;

    private function makeProduct(string $category, bool $active = true): Product
    {
        $vendorUser = $this->createVendorUser();
        $vendor = Vendor::create([
            'user_id' => $vendorUser->id,
            'store_name' => 'Agri Store '.$category,
            'category' => $category,
            'is_verified' => true,
        ]);

        return Product::create([
            'vendor_id' => $vendor->id,
            'name' => ucfirst($category).' Goods',
            'description' => 'Fixture',
            'category' => $category,
            'price' => 10,
            'stock_quantity' => 5,
            'is_active' => $active,
            'approved_at' => now(),
        ]);
    }

    public function test_agriculture_endpoint_returns_only_active_agriculture_products(): void
    {
        $agri = $this->makeProduct('agriculture');
        $this->makeProduct('electronics');
        $this->makeProduct('agriculture', active: false);

        $response = $this->getJson('/api/agriculture')->assertOk();
        $ids = collect($response->json('data'))->pluck('id');

        $this->assertTrue($ids->contains($agri->id));
        $this->assertCount(1, $ids, 'Inactive and non-agri products stay out');
        $this->assertArrayHasKey('meta', $response->json());
    }

    public function test_farmer_directory_filters_vendors_by_agriculture_category(): void
    {
        $farmer = Vendor::create([
            'user_id' => $this->createVendorUser()->id,
            'store_name' => 'Sunrise Farms',
            'category' => 'agriculture',
            'is_verified' => true,
        ]);
        Vendor::create([
            'user_id' => $this->createVendorUser()->id,
            'store_name' => 'City Electronics',
            'category' => 'electronics',
            'is_verified' => true,
        ]);

        $data = $this->getJson('/api/vendors?category=agriculture&per_page=50')
            ->assertOk()
            ->json('data');

        $ids = collect($data)->pluck('id');
        $this->assertTrue($ids->contains($farmer->id));
        $this->assertCount(1, $ids, 'Directory must only surface agriculture vendors');
    }
}
