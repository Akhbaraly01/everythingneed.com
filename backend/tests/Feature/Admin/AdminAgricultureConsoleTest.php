<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Modules\JobSeekers\Entities\WorkerProfile;
use Modules\Products\Entities\Product;
use Modules\Vendors\Entities\Vendor;
use Tests\TestCase;

class AdminAgricultureConsoleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        Cache::forget('rbac.matrix');
    }

    private function farmer(string $category = 'agriculture'): Vendor
    {
        return Vendor::create([
            'user_id' => User::factory()->create()->id,
            'store_name' => 'Farm ' . uniqid(),
            'category' => $category,
            'is_verified' => false,
        ]);
    }

    private function product(Vendor $vendor, string $category = 'agriculture'): Product
    {
        return Product::create([
            'vendor_id' => $vendor->id,
            'name' => 'Produce ' . uniqid(),
            'category' => $category,
            'price' => 25,
            'stock_quantity' => 4,
            'is_active' => false,
        ]);
    }

    private function worker(string $category = 'agriculture'): WorkerProfile
    {
        return WorkerProfile::create([
            'user_id' => User::factory()->create()->id,
            'headline' => 'Farm hand',
            'category' => $category,
            'availability' => 'available',
            'is_verified' => false,
        ]);
    }

    public function test_plain_user_is_forbidden(): void
    {
        $this->actingAsUser();

        $this->getJson('/api/admin/agriculture/overview')->assertStatus(403);
        $this->getJson('/api/admin/agriculture/products')->assertStatus(403);
    }

    public function test_agriculture_admin_sees_only_agriculture_records(): void
    {
        $farmer = $this->farmer();
        $otherVendor = $this->farmer('electronics');
        $product = $this->product($farmer);
        $otherProduct = $this->product($otherVendor, 'electronics');
        $worker = $this->worker();
        $otherWorker = $this->worker('construction');

        $this->actingAsUser('agriculture_admin');

        $this->getJson('/api/admin/agriculture/overview')
            ->assertOk()
            ->assertJsonPath('data.products_total', 1)
            ->assertJsonPath('data.farmers_total', 1)
            ->assertJsonPath('data.workers_total', 1);

        $this->getJson('/api/admin/agriculture/products')
            ->assertOk()
            ->assertJsonFragment(['id' => $product->id])
            ->assertJsonMissing(['id' => $otherProduct->id]);

        $this->getJson('/api/admin/agriculture/farmers')
            ->assertOk()
            ->assertJsonFragment(['id' => $farmer->id])
            ->assertJsonMissing(['id' => $otherVendor->id]);

        $this->getJson('/api/admin/agriculture/workers')
            ->assertOk()
            ->assertJsonFragment(['id' => $worker->id])
            ->assertJsonMissing(['id' => $otherWorker->id]);
    }

    public function test_product_moderation_approves_and_rejects_only_agriculture_products(): void
    {
        $product = $this->product($this->farmer());
        $other = $this->product($this->farmer('electronics'), 'electronics');

        $this->actingAsUser('agriculture_admin');

        $this->postJson("/api/admin/agriculture/products/{$product->id}/moderate", [
            'action' => 'approve',
        ])->assertOk();

        $product->refresh();
        $this->assertNotNull($product->approved_at);
        $this->assertTrue($product->is_active);
        $this->assertSame('published', $product->publication_state);

        $this->postJson("/api/admin/agriculture/products/{$other->id}/moderate", [
            'action' => 'approve',
        ])->assertStatus(404);
    }

    public function test_farmer_and_worker_verification_toggles(): void
    {
        $farmer = $this->farmer();
        $worker = $this->worker();

        $this->actingAsUser('agriculture_admin');

        $this->postJson("/api/admin/agriculture/farmers/{$farmer->id}/moderate", [
            'action' => 'verify',
        ])->assertOk();
        $this->assertTrue($farmer->fresh()->is_verified);

        $this->postJson("/api/admin/agriculture/workers/{$worker->id}/moderate", [
            'action' => 'verify',
        ])->assertOk();
        $this->assertTrue($worker->fresh()->is_verified);
    }
}
