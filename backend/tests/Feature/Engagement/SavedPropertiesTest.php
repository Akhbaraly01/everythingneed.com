<?php

namespace Tests\Feature\Engagement;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Modules\RealEstate\Entities\Property;
use Tests\TestCase;

/**
 * N-41 saved homes: properties ride the wishlist convention (typed
 * existence check + batched snapshot resolution + the shared /wishlist UI).
 */
class SavedPropertiesTest extends TestCase
{
    use RefreshDatabase;

    private function property(array $over = []): Property
    {
        return Property::create(array_merge([
            'user_id' => User::factory()->create()->id,
            'title' => 'Sunny 3-bedroom in East Legon',
            'description' => 'Quiet street, gated compound.',
            'property_type' => 'house',
            'price' => 120000,
            'currency' => 'USD',
            'address' => '12 Mango Lane',
            'city' => 'Accra',
            'country' => 'Ghana',
            'images' => ['https://cdn.example.com/home.jpg'],
            'is_active' => true,
        ], $over));
    }

    public function test_save_property_lists_snapshot_and_unsaves(): void
    {
        $user = User::factory()->create();
        $home = $this->property();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/wishlist', ['product_id' => $home->id, 'entity_type' => 'property'])
            ->assertStatus(201);

        // Duplicate is a clean 409.
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/wishlist', ['product_id' => $home->id, 'entity_type' => 'property'])
            ->assertStatus(409);

        $list = $this->actingAs($user, 'sanctum')->getJson('/api/wishlist');
        $list->assertOk();
        $row = collect($list->json('data'))->firstWhere('entity_id', $home->id);
        $this->assertNotNull($row);
        $this->assertSame('property', $row['entity_type']);
        $this->assertSame('Sunny 3-bedroom in East Legon', $row['snapshot']['title']);
        $this->assertSame('Accra, Ghana', $row['snapshot']['subtitle']);
        $this->assertSame('https://cdn.example.com/home.jpg', $row['snapshot']['image_url']);
        $this->assertSame(120000.0, (float) $row['snapshot']['price']);
        $this->assertSame("/properties/{$home->id}", $row['snapshot']['link']);

        $this->actingAs($user, 'sanctum')
            ->deleteJson('/api/wishlist/' . $row['id'])
            ->assertOk();
        $this->assertDatabaseMissing('wishlists', ['id' => $row['id']]);
    }

    public function test_save_unknown_property_is_404_and_bad_type_is_422(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/wishlist', ['product_id' => (string) Str::uuid(), 'entity_type' => 'property'])
            ->assertNotFound();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/wishlist', ['product_id' => 'x', 'entity_type' => 'spaceship'])
            ->assertStatus(422);
    }

    public function test_gone_property_resolves_to_null_snapshot(): void
    {
        $user = User::factory()->create();
        $home = $this->property();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/wishlist', ['product_id' => $home->id, 'entity_type' => 'property'])
            ->assertStatus(201);

        $home->delete();

        $list = $this->actingAs($user, 'sanctum')->getJson('/api/wishlist');
        $row = collect($list->json('data'))->firstWhere('entity_id', $home->id);
        $this->assertNotNull($row);
        $this->assertNull($row['snapshot']);
    }
}
