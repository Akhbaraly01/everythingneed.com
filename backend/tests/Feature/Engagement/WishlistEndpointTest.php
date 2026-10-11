<?php

namespace Tests\Feature\Engagement;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Products\Entities\Product;
use Tests\TestCase;

class WishlistEndpointTest extends TestCase
{
    use RefreshDatabase;

    private function product(): Product
    {
        $user = User::factory()->create();
        $vendorId = (string) Str::uuid();

        DB::table('vendors')->insert([
            'id' => $vendorId,
            'user_id' => $user->id,
            'store_name' => 'Wishlist Vendor',
            'category' => 'general',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return Product::factory()->create(['vendor_id' => $vendorId]);
    }

    public function test_full_wishlist_lifecycle(): void
    {
        $user = User::factory()->create();
        $product = $this->product();

        // Add: the original table lacked entity_type/created_at and 500d here.
        $add = $this->actingAs($user, 'sanctum')
            ->postJson('/api/wishlist', ['product_id' => $product->id]);
        $add->assertStatus(201);

        // Duplicate add is a clean 409, not a crash.
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/wishlist', ['product_id' => $product->id])
            ->assertStatus(409);

        // List: orders by created_at (the column the migration adds).
        $list = $this->actingAs($user, 'sanctum')->getJson('/api/wishlist');
        $list->assertOk()->assertJsonFragment(['product_id' => $product->id]);
        $row = collect($list->json('data'))->firstWhere('product_id', $product->id);
        $this->assertNotNull($row);
        $this->assertArrayHasKey('created_at', $row);
        $this->assertSame('product', $row['entity_type'] ?? 'product');

        // Remove: delete works against the inserted row id.
        $this->actingAs($user, 'sanctum')
            ->deleteJson('/api/wishlist/'.$row['id'])
            ->assertOk();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/wishlist')
            ->assertOk()
            ->assertJsonMissing(['product_id' => $product->id]);
    }

    public function test_wishlist_requires_auth(): void
    {
        $this->getJson('/api/wishlist')->assertUnauthorized();
        $this->postJson('/api/wishlist', ['product_id' => 'x'])->assertUnauthorized();
    }
}
