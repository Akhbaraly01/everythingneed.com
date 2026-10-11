<?php

namespace Tests\Feature\Admin;

use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Modules\Products\Entities\Product;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * W8 console product management: admins create/update/archive any
 * vendor's products through the same product routes the vendor portal
 * uses (isAdmin() bypass in ProductController), admins publish on create
 * (approved_at + is_active), and vendor submissions still land in the
 * approval queue.
 */
class AdminProductManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        Cache::forget('rbac.matrix');
    }

    #[Test]
    public function test_super_admin_creates_a_published_product_for_any_vendor(): void
    {
        $vendor = $this->createVendor($this->createUser());
        $this->actingAsAdmin();

        $this->postJson('/api/products', [
            'vendor_id' => $vendor->id,
            'name' => 'Admin Created Lamp',
            'description' => 'Published straight from the console.',
            'category' => 'home',
            'price' => 25.5,
            'stock_quantity' => 4,
        ])->assertStatus(201)
            ->assertJsonPath('data.name', 'Admin Created Lamp')
            ->assertJsonPath('data.is_active', true)
            ->assertJsonPath('data.vendor.store_name', $vendor->store_name);

        $product = Product::where('name', 'Admin Created Lamp')->firstOrFail();
        $this->assertNotNull($product->approved_at);
        $this->assertTrue((bool) $product->is_active);
    }

    #[Test]
    public function test_admin_updates_a_product_they_do_not_own(): void
    {
        $vendor = $this->createVendor($this->createUser());
        $product = Product::factory()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Old Name',
            'price' => 19.99,
        ]);

        $this->actingAsAdmin();

        $this->putJson("/api/products/{$product->id}", [
            'name' => 'Renamed By Console',
            'price' => 9.99,
        ])->assertOk()
            ->assertJsonPath('data.name', 'Renamed By Console')
            ->assertJsonPath('data.price', '9.99');

        $product->refresh();
        $this->assertSame('Renamed By Console', $product->name);
        $this->assertEqualsWithDelta(9.99, (float) $product->price, 0.001);
    }

    #[Test]
    public function test_admin_can_toggle_is_active(): void
    {
        $vendor = $this->createVendor($this->createUser());
        $product = Product::factory()->create([
            'vendor_id' => $vendor->id,
            'is_active' => true,
        ]);

        $this->actingAsAdmin();

        $this->putJson("/api/products/{$product->id}", ['is_active' => false])
            ->assertOk()
            ->assertJsonPath('data.is_active', false);

        $this->assertFalse((bool) $product->refresh()->is_active);
    }

    #[Test]
    public function test_admin_archives_a_product(): void
    {
        $vendor = $this->createVendor($this->createUser());
        $product = Product::factory()->create(['vendor_id' => $vendor->id]);

        $this->actingAsAdmin();

        $this->deleteJson("/api/products/{$product->id}")
            ->assertOk()
            ->assertJsonFragment(['message' => 'Product archived successfully']);

        $this->assertFalse((bool) $product->refresh()->is_active);
    }

    #[Test]
    public function test_vendor_submissions_still_enter_the_approval_queue(): void
    {
        $vendorUser = $this->createVendorUser();
        $vendor = $this->createVendor($vendorUser);

        $this->actingAs($vendorUser, 'sanctum');
        $this->postJson('/api/products', [
            'vendor_id' => $vendor->id,
            'name' => 'Pending Widget',
            'category' => 'electronics',
            'price' => 5.0,
            'stock_quantity' => 2,
        ])->assertStatus(201)
            ->assertJsonPath('data.is_active', false);

        $this->app['auth']->forgetGuards();
        $this->actingAsAdmin();
        $pending = $this->getJson('/api/admin/products/pending')->assertOk()->json('data');
        $ids = collect($pending)->pluck('id');
        $this->assertTrue(
            $ids->contains(Product::where('name', 'Pending Widget')->firstOrFail()->id),
            'Vendor submission must appear in the admin approval queue',
        );
    }
}
