<?php

namespace Tests\Feature\Learn;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Modules\Learn\Entities\LearnPost;
use Tests\TestCase;

/**
 * Learn 2.0 moderation: claim locks, no self-approval, sensitive
 * two-tier gate, queue filters/counts, notifications + audit rows,
 * hide/restore, report inbox, and senior-only actions.
 */
class LearnModerationV2Test extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Review routes now carry permission:learn.posts.review alongside the
        // role gate (spec 2682); the resolver reads the seeded role matrix.
        $this->seed(\Database\Seeders\PermissionSeeder::class);
        \Illuminate\Support\Facades\Cache::forget('rbac.matrix');
        \Illuminate\Support\Facades\Cache::forget('rbac.catalog');
    }

    private function reviewer()
    {
        $user = $this->createUser();
        $this->assignRole($user, 'learning_reviewer');

        return $user;
    }

    private function submit(array $overrides = [], $as = null): string
    {
        $author = $as ?? $this->createUser();
        $this->actingAs($author, 'sanctum');

        return $this->postJson('/api/learn/posts', array_merge([
            'title' => 'Queue sample post',
            'content' => 'Body for the moderation queue test.',
            'category' => 'agriculture',
        ], $overrides))->assertStatus(201)->json('data.id');
    }

    public function test_claim_is_an_atomic_single_owner_lock(): void
    {
        $id = $this->submit();

        $first = $this->reviewer();
        $this->actingAs($first, 'sanctum');
        $res = $this->postJson("/api/learn/posts/{$id}/claim")->assertOk();
        $this->assertSame($first->id, $res->json('data.assigned_to'));
        $this->assertSame('under_review', $res->json('data.status'));

        // A second reviewer cannot steal the claim.
        $second = $this->reviewer();
        $this->actingAs($second, 'sanctum');
        $this->postJson("/api/learn/posts/{$id}/claim")->assertStatus(409);

        // The owner can re-claim their own claim (idempotent).
        $this->actingAs($first, 'sanctum');
        $this->postJson("/api/learn/posts/{$id}/claim")->assertOk();
    }

    public function test_reviewers_cannot_moderate_their_own_posts(): void
    {
        $self = $this->reviewer();
        $this->actingAs($self, 'sanctum');
        $id = $this->postJson('/api/learn/posts', [
            'title' => 'My own video',
            'content' => 'I should not be able to approve this myself.',
            'category' => 'agriculture',
        ])->assertStatus(201)->json('data.id');

        $this->postJson("/api/learn/posts/{$id}/approve")->assertStatus(403);
        $this->postJson("/api/learn/posts/{$id}/reject", ['reason' => 'x'])->assertStatus(403);
        $this->assertDatabaseHas('learn_posts', ['id' => $id, 'status' => 'pending']);
    }

    public function test_sensitive_topics_require_a_senior_reviewer(): void
    {
        $id = $this->submit(['category' => 'health']);

        $reviewer = $this->reviewer();
        $this->actingAs($reviewer, 'sanctum');
        $this->postJson("/api/learn/posts/{$id}/approve")->assertStatus(403);

        // Senior tier approves the same post without changes.
        $admin = $this->createAdmin();
        $this->actingAs($admin, 'sanctum');
        $this->postJson("/api/learn/posts/{$id}/approve")->assertOk();
        $this->assertDatabaseHas('learn_posts', ['id' => $id, 'status' => 'approved']);

        // Non-sensitive topics are inside the reviewer's own tier.
        $normal = $this->submit(['category' => 'agriculture']);
        $this->actingAs($reviewer, 'sanctum');
        $this->postJson("/api/learn/posts/{$normal}/approve")->assertOk();
    }

    public function test_queue_exposes_filters_counts_and_sla_order(): void
    {
        $oldest = $this->submit(['title' => 'Oldest waiting item']);
        DB::table('learn_posts')->where('id', $oldest)->update(['submitted_at' => now()->subHours(3)]);
        $newest = $this->submit(['title' => 'Fresh waiting item']);
        DB::table('learn_posts')->where('id', $newest)->update(['submitted_at' => now()->subMinutes(5)]);

        $reviewer = $this->reviewer();
        $this->actingAs($reviewer, 'sanctum');

        $res = $this->getJson('/api/learn/posts-queue')->assertOk();
        $this->assertSame(2, $res->json('meta.total'));
        $this->assertSame(2, $res->json('counts.pending'));
        $this->assertSame(0, $res->json('counts.approved'));
        // Oldest-first: SLA aging puts the 3-hour-old item on top.
        $this->assertSame($oldest, $res->json('data.0.id'));

        // Search narrows the queue.
        $this->getJson('/api/learn/posts-queue?q=Fresh')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.id', $newest);

        // Unassigned filter after one claim.
        $this->postJson("/api/learn/posts/{$oldest}/claim")->assertOk();
        $this->getJson('/api/learn/posts-queue?assignee=unassigned')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.id', $newest);
        $this->getJson('/api/learn/posts-queue?assignee=me')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.id', $oldest);

        // Approved posts are visible through status=all, not the waiting set.
        $this->postJson("/api/learn/posts/{$newest}/approve")->assertOk();
        $this->getJson('/api/learn/posts-queue')->assertJsonPath('meta.total', 1);
        $this->getJson('/api/learn/posts-queue?status=all')->assertJsonPath('meta.total', 2);
    }

    public function test_transitions_write_notifications_and_audit_rows(): void
    {
        $author = $this->createUser();
        $id = $this->submit(['category' => 'agriculture'], $author);

        $admin = $this->createAdmin();
        $this->actingAs($admin, 'sanctum');

        // needs-information notifies the author with the reviewer note.
        $this->postJson("/api/learn/posts/{$id}/needs-info", ['note' => 'Add a source link'])
            ->assertOk()
            ->assertJsonPath('data.status', 'needs_information');
        $this->assertDatabaseHas('notifications', [
            'user_id' => $author->id,
            'type' => 'moderation',
            'related_id' => $id,
        ]);

        // approve writes an audit trail and publishes.
        $this->postJson("/api/learn/posts/{$id}/approve")->assertOk();
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'learn.post.approve',
            'entity_type' => 'learn_posts',
            'entity_id' => $id,
        ]);

        // reject records the reason.
        $this->postJson("/api/learn/posts/{$id}/reject", ['reason' => 'Duplicate of an existing guide'])
            ->assertOk();
        $post = LearnPost::find($id);
        $this->assertSame('rejected', $post->status);
        $this->assertSame('Duplicate of an existing guide', $post->rejection_reason);
        $this->assertDatabaseHas('audit_logs', ['action' => 'learn.post.rejected', 'entity_id' => $id]);
    }

    public function test_hide_and_restore_move_content_in_and_out_of_the_feed(): void
    {
        $id = $this->submit();
        $admin = $this->createAdmin();
        $this->actingAs($admin, 'sanctum');
        $this->postJson("/api/learn/posts/{$id}/approve")->assertOk();
        $this->getJson('/api/learn/posts')->assertOk()->assertJsonFragment(['id' => $id]);

        $this->postJson("/api/learn/posts/{$id}/hide", ['reason' => 'Reported by community'])
            ->assertOk()
            ->assertJsonPath('data.status', 'hidden');
        $this->getJson('/api/learn/posts')->assertOk()->assertJsonMissing(['id' => $id]);

        $this->postJson("/api/learn/posts/{$id}/restore")
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');
        $this->getJson('/api/learn/posts')->assertOk()->assertJsonFragment(['id' => $id]);

        // restore only works from hidden.
        $this->postJson("/api/learn/posts/{$id}/restore")->assertStatus(409);
    }

    public function test_reviewer_role_is_denied_senior_only_actions(): void
    {
        $id = $this->submit();
        $admin = $this->createAdmin();
        $this->actingAs($admin, 'sanctum');
        $this->postJson("/api/learn/posts/{$id}/approve")->assertOk();

        $reviewer = $this->reviewer();
        $this->actingAs($reviewer, 'sanctum');

        // Pin and reassign are section-admin powers.
        $this->postJson("/api/learn/posts/{$id}/pin")->assertStatus(403);
        $this->postJson("/api/learn/posts/{$id}/reassign", ['user_id' => $reviewer->id])->assertStatus(403);

        // But the queue and ordinary review actions are reachable.
        $this->getJson('/api/learn/posts-queue')->assertOk();

        $other = $this->submit(['title' => 'Second post for pin']);
        $this->actingAs($admin, 'sanctum');
        $this->postJson("/api/learn/posts/{$other}/approve")->assertOk();
        $this->postJson("/api/learn/posts/{$other}/pin")
            ->assertOk()
            ->assertJsonPath('data.is_pinned', true);
    }

    public function test_report_inbox_resolves_once_per_report(): void
    {
        $id = $this->submit();
        $admin = $this->createAdmin();
        $this->actingAs($admin, 'sanctum');
        $this->postJson("/api/learn/posts/{$id}/approve")->assertOk();

        $reader = $this->createUser();
        $this->actingAs($reader, 'sanctum');
        $this->postJson("/api/learn/posts/{$id}/report", ['reason' => 'misinformation', 'details' => 'Cites nothing'])
            ->assertStatus(201);

        $reviewer = $this->reviewer();
        $this->actingAs($reviewer, 'sanctum');
        $res = $this->getJson('/api/learn/reports')->assertOk();
        $this->assertSame(1, $res->json('meta.total'));
        $reportId = $res->json('data.0.id');
        $this->assertSame($id, $res->json('data.0.post.id'));

        $this->postJson("/api/learn/reports/{$reportId}/resolve", ['action' => 'dismiss'])
            ->assertOk()
            ->assertJsonPath('data.status', 'dismissed');
        $this->getJson('/api/learn/reports')->assertJsonPath('meta.total', 0);

        // Handled reports cannot be handled twice.
        $this->postJson("/api/learn/reports/{$reportId}/resolve", ['action' => 'resolve'])
            ->assertStatus(409);
    }

    public function test_guests_cannot_reach_any_review_endpoint(): void
    {
        $id = $this->submit();

        // Role gates run ahead of the auth guard on these routes, so guests
        // are refused (403) exactly like unauthorized members are.
        foreach ([
            "/api/learn/posts/{$id}/approve",
            "/api/learn/posts/{$id}/claim",
            "/api/learn/posts/{$id}/reject",
        ] as $path) {
            $this->postJson($path)->assertStatus(403);
        }
        foreach (['/api/learn/posts-queue', '/api/learn/reports'] as $path) {
            $this->getJson($path)->assertStatus(403);
        }

        // A plain user (no review role) is forbidden on the same gates.
        $plain = $this->createUser();
        $this->actingAs($plain, 'sanctum');
        $this->getJson('/api/learn/posts-queue')->assertStatus(403);
        $this->postJson("/api/learn/posts/{$id}/approve")->assertStatus(403);
    }
}
