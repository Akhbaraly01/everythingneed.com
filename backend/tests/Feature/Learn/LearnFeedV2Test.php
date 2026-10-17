<?php

namespace Tests\Feature\Learn;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Learn\Entities\LearnPost;
use Tests\TestCase;

/**
 * Learn 2.0 feed: drafts, video provenance, cursor pagination, watch
 * heartbeats, saves, reports, threaded comments and appeals.
 *
 * All numbers below come from real rows - no fabricated stats.
 */
class LearnFeedV2Test extends TestCase
{
    use RefreshDatabase;

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'title' => 'Soil pH in five minutes',
            'content' => 'Measure, adjust and re-test your garden soil pH.',
            'category' => 'agriculture',
        ], $overrides);
    }

    private function approvedPost(array $overrides = []): LearnPost
    {
        $author = $this->createUser();

        return LearnPost::create(array_merge([
            'user_id' => $author->id,
            'title' => 'Approved note',
            'content' => 'Body of an approved post.',
            'category' => 'agriculture',
            'media_type' => 'text',
            'status' => LearnPost::STATUS_APPROVED,
            'submitted_at' => now(),
            'published_at' => now(),
            'views_count' => 0,
        ], $overrides));
    }

    public function test_drafts_are_private_and_resubmit_to_the_queue(): void
    {
        $author = $this->createUser();
        $this->actingAs($author, 'sanctum');

        $id = $this->postJson('/api/learn/posts', $this->payload(['save_as_draft' => true]))
            ->assertStatus(201)
            ->json('data.id');

        $this->assertDatabaseHas('learn_posts', ['id' => $id, 'status' => 'draft']);

        // Invisible publicly and in the moderation queue.
        $this->getJson('/api/learn/posts')->assertOk()->assertJsonMissing(['id' => $id]);

        $admin = $this->createAdmin();
        $this->actingAs($admin, 'sanctum');
        $this->getJson('/api/learn/posts-queue')->assertOk()->assertJsonMissing(['id' => $id]);

        // Author resubmits the draft -> pending.
        $this->actingAs($author, 'sanctum');
        $this->patchJson("/api/learn/posts/{$id}", ['resubmit' => true])->assertOk();
        $this->assertDatabaseHas('learn_posts', ['id' => $id, 'status' => 'pending']);
        $this->assertNotNull(LearnPost::find($id)->submitted_at);
    }

    public function test_video_submission_resolves_provider_and_rejects_unknown_hosts(): void
    {
        $author = $this->createUser();
        $this->actingAs($author, 'sanctum');

        $id = $this->postJson('/api/learn/posts', $this->payload([
            'media_type' => 'video',
            'video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        ]))->assertStatus(201)->json('data.id');

        $post = LearnPost::find($id);
        $this->assertSame('youtube', $post->video_provider);
        $this->assertSame('dQw4w9WgXcQ', $post->provider_video_id);
        $this->assertSame('pending', $post->status);

        // Unknown hosts are rejected at submit time (no open embeds later).
        $this->postJson('/api/learn/posts', $this->payload([
            'media_type' => 'video',
            'video_url' => 'https://evil.example.com/embed/abc',
        ]))->assertStatus(422);

        // A shortener or bare link without a resolvable id also fails.
        $this->postJson('/api/learn/posts', $this->payload([
            'media_type' => 'video',
            'video_url' => 'https://youtube.com/nonsense',
        ]))->assertStatus(422);
    }

    public function test_video_submission_accepts_tiktok_and_direct_files(): void
    {
        $author = $this->createUser();
        $this->actingAs($author, 'sanctum');

        // TikTok links embed through the official /embed/v2 player.
        $ttId = $this->postJson('/api/learn/posts', $this->payload([
            'media_type' => 'video',
            'video_url' => 'https://www.tiktok.com/@everythingneed/video/7441671234567890123',
        ]))->assertStatus(201)->json('data.id');

        $tiktok = LearnPost::find($ttId);
        $this->assertSame('tiktok', $tiktok->video_provider);
        $this->assertSame('7441671234567890123', $tiktok->provider_video_id);

        // Direct media files play natively in-app (no third-party embed).
        $fileId = $this->postJson('/api/learn/posts', $this->payload([
            'media_type' => 'video',
            'video_url' => 'https://cdn.example.com/clips/lesson.mp4',
        ]))->assertStatus(201)->json('data.id');

        $file = LearnPost::find($fileId);
        $this->assertSame('file', $file->video_provider);
        $this->assertSame('https://cdn.example.com/clips/lesson.mp4', $file->video_url);

        // A TikTok profile page without a video id is still rejected.
        $this->postJson('/api/learn/posts', $this->payload([
            'media_type' => 'video',
            'video_url' => 'https://www.tiktok.com/@everythingneed',
        ]))->assertStatus(422);
    }

    public function test_cursor_pagination_walks_latest_without_gaps_or_repeats(): void
    {
        $ids = [];
        foreach (range(1, 5) as $i) {
            $post = $this->approvedPost(['title' => "Cursor sample {$i}"]);
            // Explicit spread so ordering is by timestamp, not by insert order.
            \Illuminate\Support\Facades\DB::table('learn_posts')
                ->where('id', $post->id)
                ->update(['created_at' => now()->subMinutes(10 - $i)]);
            $ids[] = $post->id;
        }
        // Newest first expected order.
        $expected = array_reverse($ids);

        $seen = [];
        $cursor = null;
        $pages = 0;

        do {
            $url = '/api/learn/posts?per_page=2'.($cursor ? '&cursor='.urlencode($cursor) : '');
            $res = $this->getJson($url)->assertOk();
            foreach ($res->json('data') as $row) {
                $seen[] = $row['id'];
            }
            $cursor = $res->json('meta.next_cursor');
            $pages++;
        } while ($cursor && $pages < 10);

        $this->assertSame($expected, $seen, 'cursor walk must be exact newest-first with no gaps or repeats');
        $this->assertSame(count($expected), count($seen));
    }

    public function test_heartbeat_accumulates_watch_time_and_counts_each_viewer_once(): void
    {
        $post = $this->approvedPost(['media_type' => 'video']);

        $viewer = $this->createUser();
        $this->actingAs($viewer, 'sanctum');

        $res = $this->postJson("/api/learn/posts/{$post->id}/view-heartbeat", ['watch_seconds' => 10])
            ->assertOk();
        $this->assertSame(10, $res->json('data.watch_seconds'));
        $this->assertFalse($res->json('data.completed'));
        $this->assertSame(1, $res->json('data.views_count'));

        // Accumulates instead of overwriting; completion needs 30s total.
        $res = $this->postJson("/api/learn/posts/{$post->id}/view-heartbeat", ['watch_seconds' => 25])
            ->assertOk();
        $this->assertSame(35, $res->json('data.watch_seconds'));
        $this->assertTrue($res->json('data.completed'));
        $this->assertSame(1, $res->json('data.views_count'), 'same viewer must not inflate views');

        // A second viewer counts as one more view.
        $other = $this->createUser();
        $this->actingAs($other, 'sanctum');
        $res = $this->postJson("/api/learn/posts/{$post->id}/view-heartbeat", ['watch_seconds' => 5])
            ->assertOk();
        $this->assertSame(2, $res->json('data.views_count'));

        // Guests cannot heartbeat (no fake guest views).
        $this->app['auth']->forgetGuards();
        $this->postJson("/api/learn/posts/{$post->id}/view-heartbeat", ['watch_seconds' => 10])
            ->assertStatus(401);
    }

    public function test_saves_and_reports_are_single_edge_per_user(): void
    {
        $post = $this->approvedPost();
        $user = $this->createUser();
        $this->actingAs($user, 'sanctum');

        $this->postJson("/api/learn/posts/{$post->id}/save")->assertOk()->assertJsonPath('data.saved', true);
        $this->getJson('/api/learn/saved')->assertOk()->assertJsonFragment(['id' => $post->id]);
        $this->postJson("/api/learn/posts/{$post->id}/save")->assertOk()->assertJsonPath('data.saved', false);
        $this->getJson('/api/learn/saved')->assertOk()->assertJsonMissing(['id' => $post->id]);

        $this->postJson("/api/learn/posts/{$post->id}/report", ['reason' => 'spam'])
            ->assertStatus(201);
        $this->postJson("/api/learn/posts/{$post->id}/report", ['reason' => 'spam'])
            ->assertStatus(409);

        $this->postJson("/api/learn/posts/{$post->id}/report", ['reason' => 'not-a-reason'])
            ->assertStatus(422);
    }

    public function test_replies_thread_and_comment_likes_toggle(): void
    {
        $post = $this->approvedPost();
        $user = $this->createUser();
        $this->actingAs($user, 'sanctum');

        $root = $this->postJson("/api/learn/posts/{$post->id}/comments", ['content' => 'Root question'])
            ->assertStatus(201)
            ->json('data.id');

        $this->postJson("/api/learn/posts/{$post->id}/comments", [
            'content' => 'Answer to the root',
            'parent_id' => $root,
        ])->assertStatus(201);

        $res = $this->getJson("/api/learn/posts/{$post->id}/comments")->assertOk();
        $this->assertCount(1, $res->json('data'), 'only top-level comments are roots');
        $this->assertCount(1, $res->json('data.0.replies'));
        $this->assertSame('Answer to the root', $res->json('data.0.replies.0.content'));

        $this->postJson("/api/learn/comments/{$root}/like")->assertOk()->assertJsonPath('data.liked', true);
        $this->postJson("/api/learn/comments/{$root}/like")->assertOk()->assertJsonPath('data.liked', false);

        // Reply counting: root + reply = 2.
        $this->assertDatabaseHas('learn_posts', ['id' => $post->id, 'comments_count' => 2]);
    }

    public function test_rejection_can_be_appealed_back_into_the_queue(): void
    {
        $author = $this->createUser();
        $this->actingAs($author, 'sanctum');
        $id = $this->postJson('/api/learn/posts', $this->payload())->assertStatus(201)->json('data.id');

        $admin = $this->createAdmin();
        $this->actingAs($admin, 'sanctum');
        $this->postJson("/api/learn/posts/{$id}/reject", ['reason' => 'Needs sources'])->assertOk();

        // Only the author may appeal, and only from rejected.
        $stranger = $this->createUser();
        $this->actingAs($stranger, 'sanctum');
        $this->postJson("/api/learn/posts/{$id}/appeal", ['reason' => 'Added sources'])->assertStatus(403);

        $this->actingAs($author, 'sanctum');
        $this->postJson("/api/learn/posts/{$id}/appeal", ['reason' => 'Added the requested sources'])
            ->assertOk()
            ->assertJsonPath('data.status', 'pending');

        $post = LearnPost::find($id);
        $this->assertSame('Added the requested sources', $post->appeal_reason);
        $this->assertNull($post->assigned_to, 'appeal returns to the unclaimed queue');

        // A pending post cannot be appealed again.
        $this->postJson("/api/learn/posts/{$id}/appeal", ['reason' => 'again'])->assertStatus(409);
    }

    public function test_creators_can_be_followed_and_listed_publicly(): void
    {
        $post = $this->approvedPost();
        $follower = $this->createUser();

        $this->actingAs($follower, 'sanctum');
        $this->postJson("/api/learn/creators/{$post->user_id}/follow")
            ->assertOk()
            ->assertJsonPath('data.following', true)
            ->assertJsonPath('data.followers_count', 1);

        $this->postJson("/api/learn/creators/{$post->user_id}/follow")
            ->assertOk()
            ->assertJsonPath('data.following', false)
            ->assertJsonPath('data.followers_count', 0);

        // Cannot follow yourself.
        $this->postJson("/api/learn/creators/{$follower->id}/follow")->assertStatus(422);

        // Public creator page exposes approved posts only.
        $this->getJson("/api/learn/creators/{$post->user_id}")->assertOk()
            ->assertJsonPath('data.posts_count', 1);
    }
}
