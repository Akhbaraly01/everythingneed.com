<?php

namespace Tests\Feature\Products;

use Tests\TestCase;
use App\Models\User;
use Modules\Vendors\Entities\Vendor;
use Modules\Products\Entities\Product;

class ProductCrudTest extends TestCase
{
    public function test_anyone_can_list_products(): void
    {
        $vendorUser = $this->createUser();
        $vendor = $this->createVendor($vendorUser);
        Product::factory()->create(['vendor_id' => $vendor->id]);

        $response = $this->actingAs($this->createUser(), 'sanctum')
            ->getJson('/api/products');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'name', 'price']],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);
    }

    public function test_unauthenticated_user_can_list_products(): void
    {
        $vendorUser = $this->createUser();
        $vendor = $this->createVendor($vendorUser);
        Product::factory()->create(['vendor_id' => $vendor->id]);

        $response = $this->getJson('/api/products');

        $response->assertOk()
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_anyone_can_view_a_product(): void
    {
        $vendorUser = $this->createUser();
        $vendor = $this->createVendor($vendorUser);
        $product = Product::factory()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Test Product',
        ]);

        $response = $this->actingAs($this->createUser(), 'sanctum')
            ->getJson("/api/products/{$product->id}");

        $response->assertOk()
            ->assertJsonFragment(['name' => 'Test Product']);
    }

    public function test_unauthenticated_user_can_view_a_product(): void
    {
        $vendorUser = $this->createUser();
        $vendor = $this->createVendor($vendorUser);
        $product = Product::factory()->create(['vendor_id' => $vendor->id]);

        $response = $this->getJson("/api/products/{$product->id}");

        $response->assertOk()
            ->assertJsonStructure(['data']);
    }

    public function test_authenticated_vendor_can_create_product(): void
    {
        $vendorUser = $this->createUser();
        $vendor = $this->createVendor($vendorUser);

        $response = $this->actingAs($vendorUser, 'sanctum')
            ->postJson('/api/products', [
                'vendor_id' => $vendor->id,
                'name' => 'Wireless Headphones',
                'category' => 'electronics',
                'price' => 49.99,
                'stock_quantity' => 100,
            ]);

        $response->assertStatus(201)
            ->assertJsonFragment(['message' => 'Product created successfully']);

        $this->assertDatabaseHas('products', [
            'vendor_id' => $vendor->id,
            'name' => 'Wireless Headphones',
        ]);
    }

    public function test_product_creation_requires_name(): void
    {
        $vendorUser = $this->createUser();
        $vendor = $this->createVendor($vendorUser);

        $response = $this->actingAs($vendorUser, 'sanctum')
            ->postJson('/api/products', [
                'vendor_id' => $vendor->id,
                'category' => 'electronics',
                'price' => 49.99,
                'stock_quantity' => 100,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_product_creation_requires_price(): void
    {
        $vendorUser = $this->createUser();
        $vendor = $this->createVendor($vendorUser);

        $response = $this->actingAs($vendorUser, 'sanctum')
            ->postJson('/api/products', [
                'vendor_id' => $vendor->id,
                'name' => 'Test Product',
                'category' => 'electronics',
                'stock_quantity' => 100,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['price']);
    }

    public function test_product_creation_requires_stock_quantity(): void
    {
        $vendorUser = $this->createUser();
        $vendor = $this->createVendor($vendorUser);

        $response = $this->actingAs($vendorUser, 'sanctum')
            ->postJson('/api/products', [
                'vendor_id' => $vendor->id,
                'name' => 'Test Product',
                'category' => 'electronics',
                'price' => 29.99,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['stock_quantity']);
    }

    public function test_product_creation_requires_vendor_id(): void
    {
        $vendorUser = $this->createUser();

        $response = $this->actingAs($vendorUser, 'sanctum')
            ->postJson('/api/products', [
                'name' => 'Test Product',
                'category' => 'electronics',
                'price' => 29.99,
                'stock_quantity' => 50,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['vendor_id']);
    }

    public function test_unauthenticated_user_cannot_create_product(): void
    {
        $response = $this->postJson('/api/products', [
            'name' => 'Test Product',
            'category' => 'electronics',
            'price' => 29.99,
            'stock_quantity' => 50,
        ]);

        $response->assertStatus(401);
    }

    public function test_vendor_can_update_own_product(): void
    {
        $vendorUser = $this->createUser();
        $vendor = $this->createVendor($vendorUser);
        $product = Product::factory()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Old Name',
            'price' => 10.00,
        ]);

        $response = $this->actingAs($vendorUser, 'sanctum')
            ->putJson("/api/products/{$product->id}", [
                'name' => 'New Name',
                'price' => 25.00,
            ]);

        $response->assertOk()
            ->assertJsonFragment(['message' => 'Product updated successfully']);

        $product->refresh();
        $this->assertEquals('New Name', $product->name);
        $this->assertEquals('25.00', $product->price);
    }

    public function test_vendor_cannot_update_another_vendors_product(): void
    {
        $vendorUser1 = $this->createUser();
        $vendor1 = $this->createVendor($vendorUser1);

        $vendorUser2 = $this->createUser();
        $vendor2 = $this->createVendor($vendorUser2);

        $product = Product::factory()->create([
            'vendor_id' => $vendor1->id,
            'name' => 'Vendor 1 Product',
        ]);

        $response = $this->actingAs($vendorUser2, 'sanctum')
            ->putJson("/api/products/{$product->id}", [
                'name' => 'Hacked Name',
            ]);

        $response->assertStatus(403);
    }

    public function test_vendor_can_delete_own_product(): void
    {
        $vendorUser = $this->createUser();
        $vendor = $this->createVendor($vendorUser);
        $product = Product::factory()->create(['vendor_id' => $vendor->id]);

        $response = $this->actingAs($vendorUser, 'sanctum')
            ->deleteJson("/api/products/{$product->id}");

        $response->assertOk()
            ->assertJsonFragment(['message' => 'Product archived successfully']);

        $product->refresh();
        $this->assertFalse($product->is_active);
    }

    public function test_vendor_cannot_delete_another_vendors_product(): void
    {
        $vendorUser1 = $this->createUser();
        $vendor1 = $this->createVendor($vendorUser1);

        $vendorUser2 = $this->createUser();
        $vendor2 = $this->createVendor($vendorUser2);

        $product = Product::factory()->create(['vendor_id' => $vendor1->id]);

        $response = $this->actingAs($vendorUser2, 'sanctum')
            ->deleteJson("/api/products/{$product->id}");

        $response->assertStatus(403);
    }

    public function test_admin_can_update_any_product(): void
    {
        $admin = $this->createAdmin();
        $vendorUser = $this->createUser();
        $vendor = $this->createVendor($vendorUser);
        $product = Product::factory()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Original Name',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->putJson("/api/products/{$product->id}", [
                'name' => 'Admin Updated Name',
            ]);

        $response->assertOk();

        $product->refresh();
        $this->assertEquals('Admin Updated Name', $product->name);
    }

    public function test_admin_can_delete_any_product(): void
    {
        $admin = $this->createAdmin();
        $vendorUser = $this->createUser();
        $vendor = $this->createVendor($vendorUser);
        $product = Product::factory()->create(['vendor_id' => $vendor->id]);

        $response = $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/products/{$product->id}");

        $response->assertOk();

        $product->refresh();
        $this->assertFalse($product->is_active);
    }

    public function test_product_creation_requires_category(): void
    {
        $vendorUser = $this->createUser();
        $vendor = $this->createVendor($vendorUser);

        $response = $this->actingAs($vendorUser, 'sanctum')
            ->postJson('/api/products', [
                'vendor_id' => $vendor->id,
                'name' => 'Test Product',
                'price' => 29.99,
                'stock_quantity' => 50,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['category']);
    }

    public function test_non_vendor_user_cannot_create_product(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/products', [
                'vendor_id' => 'some-vendor-id',
                'name' => 'Test Product',
                'category' => 'electronics',
                'price' => 29.99,
                'stock_quantity' => 50,
            ]);

        $response->assertStatus(403);
    }
}
