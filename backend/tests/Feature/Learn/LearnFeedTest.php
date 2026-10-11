<?php

namespace Tests\Feature\Learn;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Master-plan phase 16: social educational feed moderation workflow.
 *
 * USER SUBMISSION -> pending (invisible publicly) -> APPROVED -> visible;
 * REJECTED stays invisible. Likes toggle atomically, comments count,
 * strangers cannot moderate, guests cannot write.
 */
class LearnFeedTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'title' => 'Composting basics',
            'content' => 'Turn kitchen waste into garden gold in 30 days.',
            'category' => 'agriculture',
        ], $overrides);
    }

    public function test_submission_is_pending_and_invisible_until_approved(): void
    {
        $author = $this->createUser();
        $this->actingAs($author, 'sanctum');

        $id = $this->postJson('/api/learn/posts', $this->payload())
            ->assertStatus(201)
            ->json('data.id');

        $this->assertDatabaseHas('learn_posts', ['id' => $id, 'status' => 'pending']);

        // Public feed and direct view hide pending posts.
        $this->getJson('/api/learn/posts')->assertOk()->assertJsonMissing(['id' => $id]);
        $this->getJson("/api/learn/posts/{$id}")->assertStatus(404);

        // Author sees it in their own list.
        $this->getJson('/api/learn/posts-mine')->assertOk()->assertJsonFragment(['id' => $id]);
    }

    public function test_approval_publishes_and_rejection_hides(): void
    {
        $author = $this->createUser();
        $this->actingAs($author, 'sanctum');
        $id = $this->postJson('/api/learn/posts', $this->payload())->assertStatus(201)->json('data.id');

        // Strangers cannot moderate.
        $stranger = $this->createUser();
        $this->actingAs($stranger, 'sanctum');
        $this->postJson("/api/learn/posts/{$id}/approve")->assertStatus(403);

        $admin = $this->createAdmin();
        $this->actingAs($admin, 'sanctum');
        $this->postJson("/api/learn/posts/{$id}/approve")->assertOk();
        $this->assertDatabaseHas('learn_posts', ['id' => $id, 'status' => 'approved']);

        $this->getJson('/api/learn/posts')->assertOk()->assertJsonFragment(['id' => $id]);
        $this->getJson("/api/learn/posts/{$id}")->assertOk();

        $this->postJson("/api/learn/posts/{$id}/reject")->assertOk();
        $this->getJson('/api/learn/posts')->assertOk()->assertJsonMissing(['id' => $id]);
        $this->getJson("/api/learn/posts/{$id}")->assertStatus(404);
    }

    public function test_likes_toggle_and_comments_count(): void
    {
        $author = $this->createUser();
        $this->actingAs($author, 'sanctum');
        $id = $this->postJson('/api/learn/posts', $this->payload())->assertStatus(201)->json('data.id');

        $admin = $this->createAdmin();
        $this->actingAs($admin, 'sanctum');
        $this->postJson("/api/learn/posts/{$id}/approve")->assertOk();

        $reader = $this->createUser();
        $this->actingAs($reader, 'sanctum');

        $this->postJson("/api/learn/posts/{$id}/like")->assertOk()->assertJsonPath('data.liked', true);
        $this->postJson("/api/learn/posts/{$id}/like")->assertOk()->assertJsonPath('data.liked', false);
        $this->assertDatabaseHas('learn_posts', ['id' => $id, 'likes_count' => 0]);

        $this->postJson("/api/learn/posts/{$id}/comments", ['content' => 'Great guide!'])
            ->assertStatus(201);
        $this->assertDatabaseHas('learn_posts', ['id' => $id, 'comments_count' => 1]);
        $this->getJson("/api/learn/posts/{$id}/comments")->assertOk()->assertJsonFragment(['content' => 'Great guide!']);
    }

    public function test_guests_cannot_write_and_markup_is_stripped(): void
    {
        $this->postJson('/api/learn/posts', $this->payload())->assertStatus(401);

        $author = $this->createUser();
        $this->actingAs($author, 'sanctum');
        $id = $this->postJson('/api/learn/posts', $this->payload([
            'title' => '<script>alert(1)</script>Clean title',
            'content' => 'Body <img src=x onerror=alert(1)> text.',
        ]))->assertStatus(201)->json('data.id');

        $row = \Modules\Learn\Entities\LearnPost::find($id);
        $this->assertStringNotContainsString('<script>', $row->title);
        $this->assertStringNotContainsString('<img', $row->content);

        $this->postJson('/api/learn/posts', ['title' => 'x'])->assertStatus(422);
    }
}
