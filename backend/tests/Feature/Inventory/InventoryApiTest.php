<?php

namespace Tests\Feature\Inventory;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Entities\StockLevel;
use Modules\Products\Entities\Product;
use Modules\Vendors\Entities\Vendor;
use Tests\TestCase;

class InventoryApiTest extends TestCase
{
    use RefreshDatabase;

    private function makeProduct($vendorUser): Product
    {
        $vendor = Vendor::create([
            'user_id' => $vendorUser->id,
            'store_name' => 'InvStore',
            'category' => 'electronics',
        ]);

        return Product::create([
            'vendor_id' => $vendor->id,
            'name' => 'Widget',
            'category' => 'electronics',
            'price' => 10,
            'stock_quantity' => 5,
            'is_active' => true,
            'approved_at' => now(),
        ]);
    }

    public function test_guest_cannot_access_stock(): void
    {
        $this->getJson('/api/stock')->assertUnauthorized();
        $this->postJson('/api/stock/adjust', [])->assertUnauthorized();
    }

    public function test_user_without_inventory_permission_forbidden(): void
    {
        $this->seed(\Database\Seeders\PermissionSeeder::class);
        \Illuminate\Support\Facades\Cache::forget('rbac.matrix');

        $user = $this->createUser();
        $this->assignRole($user, 'user');
        $this->actingAs($user, 'sanctum');

        $this->getJson('/api/stock')->assertForbidden();
        $this->postJson('/api/stock/adjust', [])->assertForbidden();
    }

    public function test_admin_can_list_all_stock_and_manage(): void
    {
        $this->seed(\Database\Seeders\PermissionSeeder::class);
        \Illuminate\Support\Facades\Cache::forget('rbac.matrix');

        $vendorUser = $this->createUser();
        $product = $this->makeProduct($vendorUser);
        StockLevel::create([
            'product_id' => $product->id,
            'quantity' => 5,
            'reorder_point' => 2,
        ]);

        $admin = $this->createAdmin();
        $this->actingAs($admin, 'sanctum');

        $res = $this->getJson('/api/stock');
        $res->assertOk();
        $this->assertGreaterThanOrEqual(1, $res->json('meta.total'));

        $this->postJson('/api/stock/adjust', [
            'product_id' => $product->id,
            'type' => 'in',
            'quantity' => 10,
            'notes' => 'restock',
        ])->assertOk();
    }

    public function test_vendor_scoped_to_own_products(): void
    {
        $this->seed(\Database\Seeders\PermissionSeeder::class);
        \Illuminate\Support\Facades\Cache::forget('rbac.matrix');

        $vendorUser = $this->createUser();
        $this->assignRole($vendorUser, 'vendor_admin');
        $myProduct = $this->makeProduct($vendorUser);

        $otherVendorUser = $this->createUser();
        $otherProduct = $this->makeProduct($otherVendorUser);

        StockLevel::create(['product_id' => $myProduct->id, 'quantity' => 1, 'reorder_point' => 0]);
        StockLevel::create(['product_id' => $otherProduct->id, 'quantity' => 99, 'reorder_point' => 0]);

        $this->actingAs($vendorUser, 'sanctum');
        $res = $this->getJson('/api/stock');
        $res->assertOk();
        $this->assertSame(1, $res->json('meta.total'));
        $this->assertSame($myProduct->id, $res->json('data.0.product_id'));
    }
}
