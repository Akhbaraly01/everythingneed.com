<?php

namespace Tests\Feature\Engagement;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class FavoritesAndRecentlyViewedTest extends TestCase
{
    use RefreshDatabase;

    public function test_favorite_toggle_round_trip(): void
    {
        $user = User::factory()->create();
        $payload = [
            'entity_type' => 'product',
            'entity_id' => (string) Str::uuid(),
        ];

        // First toggle inserts (the original insert omitted the uuid id and
        // a created_at column that did not exist - 500 for every caller).
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/favorites/toggle', $payload)
            ->assertStatus(201)
            ->assertJson(['favorited' => true]);

        // Second toggle removes the row it just created.
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/favorites/toggle', $payload)
            ->assertOk()
            ->assertJson(['favorited' => false]);

        $this->assertDatabaseCount('favorites', 0);
    }

    public function test_recently_viewed_orders_by_viewed_at(): void
    {
        $user = User::factory()->create();
        $olderId = (string) Str::uuid();
        $newerId = (string) Str::uuid();

        DB::table('recently_viewed')->insert([
            [
                'id' => $olderId,
                'user_id' => $user->id,
                'entity_type' => 'product',
                'entity_id' => (string) Str::uuid(),
                'viewed_at' => now()->subHour(),
            ],
            [
                'id' => $newerId,
                'user_id' => $user->id,
                'entity_type' => 'product',
                'entity_id' => (string) Str::uuid(),
                'viewed_at' => now(),
            ],
        ]);

        // The query used to order by a nonexistent created_at column (500).
        $res = $this->actingAs($user, 'sanctum')->getJson('/api/recently-viewed');
        $res->assertOk();

        $rows = collect($res->json('data'));
        $this->assertCount(2, $rows);
        $this->assertSame($newerId, $rows[0]->id ?? $rows[0]['id']);
        $this->assertSame($olderId, $rows[1]->id ?? $rows[1]['id']);
    }

    public function test_engagement_endpoints_require_auth(): void
    {
        $this->getJson('/api/recently-viewed')->assertUnauthorized();
        $this->postJson('/api/favorites/toggle', [
            'entity_type' => 'product',
            'entity_id' => 'x',
        ])->assertUnauthorized();
    }
}
