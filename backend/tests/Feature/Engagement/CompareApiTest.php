<?php

namespace Tests\Feature\Engagement;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Products\Entities\Product;
use Tests\TestCase;

class CompareApiTest extends TestCase
{
    use RefreshDatabase;

    private function makeProduct(): Product
    {
        $user = User::factory()->create();
        $vendorId = (string) Str::uuid();

        DB::table('vendors')->insert([
            'id' => $vendorId,
            'user_id' => $user->id,
            'store_name' => 'Compare Vendor',
            'category' => 'general',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return Product::factory()->create(['vendor_id' => $vendorId]);
    }

    public function test_add_list_remove_roundtrip_with_cap(): void
    {
        $user = User::factory()->create();
        $api = $this->actingAs($user, 'sanctum');

        $ids = [];
        for ($i = 0; $i < 4; $i++) {
            $p = $this->makeProduct();
            $ids[] = $p->id;

            $res = $api->postJson('/api/compare', ['product_id' => $p->id]);
            if ($i < 3) {
                $res->assertStatus(201);
            } else {
                // 4th item exceeds cap of 3
                $res->assertStatus(422);
            }
        }

        $list = $api->getJson('/api/compare');
        $list->assertStatus(200);
        $this->assertCount(3, $list->json('data'));
        $this->assertNotNull($list->json('data.0.product.name'));

        // Idempotent re-add
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/compare', ['product_id' => $ids[0]])
            ->assertStatus(200);

        // Remove
        $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/compare/{$ids[0]}")
            ->assertStatus(200);

        $after = $this->actingAs($user, 'sanctum')->getJson('/api/compare');
        $this->assertCount(2, $after->json('data'));
    }

    public function test_comparisons_are_private_per_user(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        $product = $this->makeProduct();

        $this->actingAs($owner, 'sanctum')
            ->postJson('/api/compare', ['product_id' => $product->id])
            ->assertStatus(201);

        // Stranger sees an empty set — rows are user-scoped
        $peek = $this->actingAs($stranger, 'sanctum')->getJson('/api/compare');
        $this->assertCount(0, $peek->json('data'));

        // Stranger cannot remove owner's row (404 = nothing matched their scope)
        $this->actingAs($stranger, 'sanctum')
            ->deleteJson("/api/compare/{$product->id}")
            ->assertStatus(404);
    }
}
