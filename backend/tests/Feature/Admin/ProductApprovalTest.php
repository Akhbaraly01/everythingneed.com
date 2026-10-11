<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Products\Entities\Product;
use Modules\Vendors\Entities\Vendor;
use Tests\TestCase;

class ProductApprovalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // The granular matrix gates the admin queue endpoints.
        $this->seed(\Database\Seeders\PermissionSeeder::class);
        \Illuminate\Support\Facades\Cache::forget('rbac.matrix');
    }

    private function vendorUser(): array
    {
        $user = User::factory()->create();
        $vendor = Vendor::create([
            'user_id' => $user->id,
            'store_name' => 'Queue Test Store',
            'category' => 'general',
        ]);

        return [$user, $vendor];
    }

    public function test_vendor_submission_enters_queue_and_is_hidden_from_catalogue(): void
    {
        [$user, $vendor] = $this->vendorUser();

        $created = $this->actingAs($user)->postJson('/api/products', [
            'vendor_id' => $vendor->id,
            'name' => 'Pending Gadget',
            'category' => 'electronics',
            'price' => 99.99,
            'stock_quantity' => 5,
        ]);

        $created->assertStatus(201);
        $this->assertNull($created->json('data.approved_at'));
        $this->assertFalse($created->json('data.is_active'));

        // Hidden from the default public listing
        $public = $this->getJson('/api/products?search=Pending+Gadget');
        $this->assertEquals(0, $public->json('meta.total'));
    }

    public function test_admin_sees_pending_queue_and_approval_publishes(): void
    {
        [$user, $vendor] = $this->vendorUser();

        $productId = $this->actingAs($user)->postJson('/api/products', [
            'vendor_id' => $vendor->id,
            'name' => 'Awaiting Review Item',
            'category' => 'home',
            'price' => 25,
            'stock_quantity' => 3,
        ])->json('data.id');

        $admin = User::factory()->create();
        \App\Models\UserRole::create(['user_id' => $admin->id, 'role' => 'administrator']);

        $queue = $this->actingAs($admin)->getJson('/api/admin/products/pending');
        $queue->assertStatus(200);
        $this->assertEquals(1, $queue->json('meta.total'));
        $this->assertEquals('Awaiting Review Item', $queue->json('data.0.name'));

        $approve = $this->actingAs($admin)
            ->postJson("/api/admin/products/{$productId}/approve");
        $approve->assertStatus(200);
        $this->assertNotNull($approve->json('data.approved_at'));
        $this->assertTrue($approve->json('data.is_active'));

        // Now publicly visible
        $public = $this->getJson('/api/products?search=Awaiting+Review');
        $this->assertEquals(1, $public->json('meta.total'));

        // Queue is empty again
        $queueAfter = $this->actingAs($admin)->getJson('/api/admin/products/pending');
        $this->assertEquals(0, $queueAfter->json('meta.total'));
    }

    public function test_rejection_records_reason_and_keeps_product_hidden(): void
    {
        [$user, $vendor] = $this->vendorUser();

        $productId = $this->actingAs($user)->postJson('/api/products', [
            'vendor_id' => $vendor->id,
            'name' => 'Reject Me',
            'category' => 'misc',
            'price' => 10,
            'stock_quantity' => 1,
        ])->json('data.id');

        $super = User::factory()->create();
        \App\Models\UserRole::create(['user_id' => $super->id, 'role' => 'super_admin']);

        $reject = $this->actingAs($super)
            ->postJson("/api/admin/products/{$productId}/reject", [
                'reason' => 'Images do not match description',
            ]);
        $reject->assertStatus(200);
        $this->assertFalse($reject->json('data.is_active'));

        $this->assertDatabaseHas('rejected_products', [
            'product_id' => $productId,
            'reason' => 'Images do not match description',
        ]);

        $public = $this->getJson('/api/products?search=Reject+Me');
        $this->assertEquals(0, $public->json('meta.total'));
    }

    public function test_vendors_cannot_access_the_approval_queue(): void
    {
        [$user] = $this->vendorUser();

        $this->actingAs($user)
            ->getJson('/api/admin/products/pending')
            ->assertStatus(403);

        $random = (string) \Illuminate\Support\Str::uuid();
        $this->actingAs($user)
            ->postJson("/api/admin/products/{$random}/approve")
            ->assertStatus(403);
    }

    public function test_admin_created_products_are_published_immediately(): void
    {
        $admin = User::factory()->create();
        \App\Models\UserRole::create(['user_id' => $admin->id, 'role' => 'super_admin']);
        $vendor = Vendor::create([
            'user_id' => User::factory()->create()->id,
            'store_name' => 'Admin Managed',
            'category' => 'general',
        ]);

        $created = $this->actingAs($admin)->postJson('/api/products', [
            'vendor_id' => $vendor->id,
            'name' => 'Direct Publish',
            'category' => 'books',
            'price' => 15,
            'stock_quantity' => 7,
        ]);

        $created->assertStatus(201);
        $this->assertNotNull($created->json('data.approved_at'));

        $product = Product::find($created->json('data.id'));
        $this->assertTrue((bool) $product->is_active);
    }

    private function pendingProduct(string $name, string $category): string
    {
        // StoreProductRequest authorizes against the submitting vendor's owner.
        $owner = User::factory()->create();
        $vendor = Vendor::create([
            'user_id' => $owner->id,
            'store_name' => 'Scope Store',
            'category' => 'general',
        ]);

        $response = $this->actingAs($owner)
            ->postJson('/api/products', [
                'vendor_id' => $vendor->id,
                'name' => $name,
                'category' => $category,
                'price' => 30,
                'stock_quantity' => 2,
            ]);
        $response->assertStatus(201);

        return $response->json('data.id');
    }

    private function categoryAdmin(?string $categoryName): User
    {
        $user = User::factory()->create();

        $categoryId = null;
        if ($categoryName !== null) {
            $categoryId = \Modules\Categories\Entities\Category::create([
                'name' => $categoryName,
                'slug' => strtolower($categoryName),
            ])->id;
        }

        \App\Models\UserRole::create([
            'user_id' => $user->id,
            'role' => 'marketplace_admin',
            'category_id' => $categoryId,
        ]);

        return $user;
    }

    public function test_marketplace_admin_is_confined_to_its_category_scope(): void
    {
        $inScope = $this->pendingProduct('In Scope Widget', 'electronics');
        $outOfScope = $this->pendingProduct('Out Of Scope Widget', 'home');

        $admin = $this->categoryAdmin('electronics');

        // Queue only shows the scoped category.
        $queue = $this->actingAs($admin)->getJson('/api/admin/products/pending');
        $queue->assertStatus(200);
        $this->assertEquals(1, $queue->json('meta.total'));
        $this->assertEquals('In Scope Widget', $queue->json('data.0.name'));

        // Deciding out of scope is indistinguishable from missing (no ID probe).
        $leak = $this->actingAs($admin)->postJson("/api/admin/products/{$outOfScope}/approve");
        $leak->assertStatus(404);
        $this->assertFalse((bool) Product::find($outOfScope)->is_active);

        // In-scope decisions still work.
        $approve = $this->actingAs($admin)->postJson("/api/admin/products/{$inScope}/approve");
        $approve->assertStatus(200);
        $this->assertNotNull($approve->json('data.approved_at'));
    }

    public function test_unassigned_marketplace_admin_fails_closed(): void
    {
        $productId = $this->pendingProduct('Unreachable Product', 'electronics');
        $admin = $this->categoryAdmin(null);

        $queue = $this->actingAs($admin)->getJson('/api/admin/products/pending');
        $queue->assertStatus(200);
        $this->assertEquals(0, $queue->json('meta.total'));

        $decide = $this->actingAs($admin)->postJson("/api/admin/products/{$productId}/approve");
        $decide->assertStatus(404);
        $this->assertNull(Product::find($productId)->approved_at);
    }

    public function test_moderator_keeps_the_full_queue_and_super_admin_is_unscoped(): void
    {
        $this->pendingProduct('Product A', 'electronics');
        $this->pendingProduct('Product B', 'home');

        $moderator = User::factory()->create();
        \App\Models\UserRole::create(['user_id' => $moderator->id, 'role' => 'moderator']);

        $queue = $this->actingAs($moderator)->getJson('/api/admin/products/pending');
        $queue->assertStatus(200);
        $this->assertEquals(2, $queue->json('meta.total'));

        $super = User::factory()->create();
        \App\Models\UserRole::create(['user_id' => $super->id, 'role' => 'super_admin']);

        $superQueue = $this->actingAs($super)->getJson('/api/admin/products/pending');
        $superQueue->assertStatus(200);
        $this->assertEquals(2, $superQueue->json('meta.total'));
    }
}
