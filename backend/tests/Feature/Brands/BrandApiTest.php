<?php

namespace Tests\Feature\Brands;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Products\Entities\Brand;
use Modules\Products\Entities\Product;
use Modules\Vendors\Entities\Vendor;
use Tests\TestCase;

class BrandApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_brand(): void
    {
        $user = $this->createAdmin();
        $this->actingAs($user, 'sanctum');

        $res = $this->postJson('/api/admin/brands', [
            'name' => 'TestBrand',
        ]);

        $res->assertStatus(201)->assertJsonStructure(['data' => ['id', 'name', 'slug', 'is_active']]);
        $this->assertDatabaseHas('brands', ['slug' => 'testbrand']);
    }

    public function test_admin_can_list_brands(): void
    {
        $user = $this->createAdmin();
        $this->actingAs($user, 'sanctum');

        Brand::create(['name' => 'BrandA', 'slug' => 'brand-a']);
        Brand::create(['name' => 'BrandB', 'slug' => 'brand-b']);

        $res = $this->getJson('/api/admin/brands');

        $res->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_admin_can_update_brand(): void
    {
        $user = $this->createAdmin();
        $this->actingAs($user, 'sanctum');

        $brand = Brand::create(['name' => 'OldName', 'slug' => 'old-name']);

        $res = $this->putJson("/api/admin/brands/{$brand->id}", [
            'name' => 'NewName',
        ]);

        $res->assertOk();
        $this->assertDatabaseHas('brands', ['id' => $brand->id, 'slug' => 'newname']);
    }

    public function test_admin_can_delete_brand(): void
    {
        $user = $this->createAdmin();
        $this->actingAs($user, 'sanctum');

        $brand = Brand::create(['name' => 'ToDelete', 'slug' => 'to-delete']);

        $res = $this->deleteJson("/api/admin/brands/{$brand->id}");

        $res->assertOk();
        $this->assertSoftDeleted('brands', ['id' => $brand->id]);
    }

    public function test_unauthorized_user_cannot_create_brand(): void
    {
        $user = $this->createUser();
        $this->actingAs($user, 'sanctum');

        $res = $this->postJson('/api/admin/brands', ['name' => 'Nope']);

        $res->assertStatus(403);
    }

    public function test_products_can_be_filtered_by_brand(): void
    {
        $user = $this->createAdmin();
        $vendor = Vendor::create(['user_id' => $user->id, 'store_name' => 'Test', 'category' => 'electronics']);

        $brand = Brand::create(['name' => 'TestBrand', 'slug' => 'test-brand']);
        $otherBrand = Brand::create(['name' => 'OtherBrand', 'slug' => 'other-brand']);

        Product::create([
            'vendor_id' => $vendor->id,
            'brand_id' => $brand->id,
            'name' => 'Product A',
            'category' => 'electronics',
            'price' => 99.99,
            'stock_quantity' => 10,
            'is_active' => true,
            'approved_at' => now(),
        ]);

        Product::create([
            'vendor_id' => $vendor->id,
            'brand_id' => $otherBrand->id,
            'name' => 'Product B',
            'category' => 'electronics',
            'price' => 149.99,
            'stock_quantity' => 10,
            'is_active' => true,
            'approved_at' => now(),
        ]);

        $this->actingAs($user, 'sanctum');

        $res = $this->getJson("/api/products?brand_id={$brand->id}");

        $res->assertOk();
        $this->assertCount(1, $res->json('data'));
        $this->assertEquals('Product A', $res->json('data.0.name'));
    }
}
