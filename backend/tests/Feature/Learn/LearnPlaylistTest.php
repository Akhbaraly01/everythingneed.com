<?php

namespace Tests\Feature\Learn;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Learn\Entities\LearnPost;
use Tests\TestCase;

/**
 * Personal playlists: owner-scoped collections over approved feed posts.
 * Foreign collections answer 404 (no existence leak), removal is a hard
 * delete so the (playlist_id, post_id) unique index stays usable, and
 * unapproved content can never enter a collection.
 */
class LearnPlaylistTest extends TestCase
{
    use RefreshDatabase;

    private function makePost(array $overrides = []): LearnPost
    {
        $author = $this->createUser();

        return LearnPost::create(array_merge([
            'user_id' => $author->id,
            'title' => 'Irrigation schedule',
            'content' => 'Water early, deeply and less often.',
            'category' => 'agriculture',
            'media_type' => 'text',
            'status' => LearnPost::STATUS_APPROVED,
            'submitted_at' => now(),
            'published_at' => now(),
            'views_count' => 0,
        ], $overrides));
    }

    public function test_playlists_are_owner_scoped_and_only_hold_approved_posts(): void
    {
        $owner = $this->createUser();
        $stranger = $this->createUser();
        $approved = $this->makePost();
        $pending = $this->makePost(['status' => LearnPost::STATUS_PENDING, 'title' => 'Still in review']);

        $this->actingAs($owner, 'sanctum');

        $playlistId = $this->postJson('/api/learn/playlists', ['name' => 'Field notes'])
            ->assertStatus(201)
            ->json('data.id');

        // Duplicate collection names stay unique per owner.
        $this->postJson('/api/learn/playlists', ['name' => 'Field notes'])->assertStatus(409);

        // Only approved posts can be collected.
        $this->postJson("/api/learn/playlists/{$playlistId}/items", ['post_id' => $pending->id])
            ->assertNotFound();

        $this->postJson("/api/learn/playlists/{$playlistId}/items", ['post_id' => $approved->id])
            ->assertStatus(201);
        $this->postJson("/api/learn/playlists/{$playlistId}/items", ['post_id' => $approved->id])
            ->assertStatus(409);

        $this->getJson("/api/learn/playlists/{$playlistId}")
            ->assertOk()
            ->assertJsonPath('data.name', 'Field notes')
            ->assertJsonPath('posts.0.id', $approved->id);

        // Another account cannot read, grow or delete the collection.
        $this->actingAs($stranger, 'sanctum');
        $this->getJson("/api/learn/playlists/{$playlistId}")->assertNotFound();
        $this->postJson("/api/learn/playlists/{$playlistId}/items", ['post_id' => $approved->id])
            ->assertNotFound();
        $this->deleteJson("/api/learn/playlists/{$playlistId}")->assertNotFound();
        $this->deleteJson("/api/learn/playlists/{$playlistId}/items/{$approved->id}")->assertNotFound();
        $this->getJson('/api/learn/playlists')->assertOk()->assertJsonMissing(['id' => $playlistId]);

        // Back with the owner: removal is a hard delete and the post can
        // be collected again afterwards.
        $this->actingAs($owner, 'sanctum');
        $this->deleteJson("/api/learn/playlists/{$playlistId}/items/{$approved->id}")->assertOk();
        $this->assertDatabaseMissing('learn_playlist_items', [
            'playlist_id' => $playlistId,
            'post_id' => $approved->id,
        ]);
        $this->postJson("/api/learn/playlists/{$playlistId}/items", ['post_id' => $approved->id])
            ->assertStatus(201);

        // Removing something that is not in the collection is a 404.
        $this->deleteJson("/api/learn/playlists/{$playlistId}/items/{$pending->id}")->assertNotFound();

        // The collection disappears from the owner's own list once deleted.
        $this->deleteJson("/api/learn/playlists/{$playlistId}")->assertOk();
        $this->assertDatabaseMissing('learn_playlists', ['id' => $playlistId]);
        $this->getJson('/api/learn/playlists')->assertOk()->assertJsonMissing(['id' => $playlistId]);
    }

    public function test_guests_cannot_touch_playlists(): void
    {
        $this->getJson('/api/learn/playlists')->assertUnauthorized();
        $this->postJson('/api/learn/playlists', ['name' => 'Guest list'])->assertUnauthorized();
        $this->getJson('/api/learn/playlists/01990000-0000-7000-8000-000000000001')->assertUnauthorized();
    }

    public function test_duplicate_playlist_names_are_allowed_for_different_users(): void
    {
        $first = $this->createUser();
        $second = $this->createUser();

        $this->actingAs($first, 'sanctum');
        $this->postJson('/api/learn/playlists', ['name' => 'Field notes'])->assertStatus(201);

        $this->actingAs($second, 'sanctum');
        $this->postJson('/api/learn/playlists', ['name' => 'Field notes'])->assertStatus(201);
    }
}
