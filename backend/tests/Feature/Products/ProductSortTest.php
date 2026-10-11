<?php

namespace Tests\Feature\Products;

use Tests\TestCase;
use Modules\Vendors\Entities\Vendor;
use Modules\Products\Entities\Product;

class ProductSortTest extends TestCase
{
    private function vendor(): Vendor
    {
        return $this->createVendor($this->createUser());
    }

    public function test_api_products_can_be_sorted_by_price(): void
    {
        $vendor = $this->vendor();
        Product::factory()->create(['vendor_id' => $vendor->id, 'name' => 'Mid', 'price' => 50]);
        Product::factory()->create(['vendor_id' => $vendor->id, 'name' => 'Expensive', 'price' => 200]);
        Product::factory()->create(['vendor_id' => $vendor->id, 'name' => 'Cheap', 'price' => 10]);

        $asc = $this->getJson('/api/products?sort=price_asc&per_page=10')->assertOk();
        $this->assertSame(
            ['Cheap', 'Mid', 'Expensive'],
            array_column($asc->json('data'), 'name'),
        );

        $desc = $this->getJson('/api/products?sort=price_desc&per_page=10')->assertOk();
        $this->assertSame(
            ['Expensive', 'Mid', 'Cheap'],
            array_column($desc->json('data'), 'name'),
        );
    }

    public function test_api_products_can_be_sorted_by_name_and_newest(): void
    {
        $vendor = $this->vendor();
        Product::factory()->create(['vendor_id' => $vendor->id, 'name' => 'Zebra', 'created_at' => now()->subDay()]);
        Product::factory()->create(['vendor_id' => $vendor->id, 'name' => 'Alpha', 'created_at' => now()->subDays(2)]);
        Product::factory()->create(['vendor_id' => $vendor->id, 'name' => 'Mango', 'created_at' => now()]);

        $byName = $this->getJson('/api/products?sort=name_asc&per_page=10')->assertOk();
        $this->assertSame(
            ['Alpha', 'Mango', 'Zebra'],
            array_column($byName->json('data'), 'name'),
        );

        $newest = $this->getJson('/api/products?per_page=10')->assertOk();
        $this->assertSame(
            ['Mango', 'Zebra', 'Alpha'],
            array_column($newest->json('data'), 'name'),
        );
    }

    public function test_unknown_sort_values_fall_back_to_newest(): void
    {
        $vendor = $this->vendor();
        Product::factory()->create(['vendor_id' => $vendor->id, 'name' => 'Older', 'created_at' => now()->subDay()]);
        Product::factory()->create(['vendor_id' => $vendor->id, 'name' => 'Newest', 'created_at' => now()]);

        $response = $this->getJson('/api/products?sort=; drop table products&per_page=10')->assertOk();
        $this->assertSame('Newest', $response->json('data.0.name'));
    }

    public function test_web_products_page_honours_the_sort_query(): void
    {
        $vendor = $this->vendor();
        Product::factory()->create(['vendor_id' => $vendor->id, 'name' => 'Spendy', 'price' => 500]);
        Product::factory()->create(['vendor_id' => $vendor->id, 'name' => 'Budget', 'price' => 5]);

        $this->get('/products?sort=price_asc')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('products/Index')
                ->where('products.data.0.name', 'Budget')
                ->where('filters.sort', 'price_asc'));
    }

    public function test_web_products_page_hides_unapproved_submissions(): void
    {
        $vendor = $this->vendor();
        Product::factory()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Approved Product',
            'approved_at' => now(),
        ]);
        Product::factory()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Pending Product',
            'approved_at' => null,
        ]);

        $this->get('/products')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('products/Index')
                ->where('products.meta.total', 1)
                ->where('products.data.0.name', 'Approved Product'));
    }
}
