<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Models\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * W4 generic approval engine contract: ordered multi-step requests stored in
 * approval_requests/approval_steps, decided one step at a time under the route
 * permission (products.products.approve — the Approvals console's declared
 * permission) plus the step's approver role (super_admin bypasses role gates,
 * a null approver_role accepts any permission-passed caller), reject ends the
 * request and skips the remainder, decisions are one-shot, and malformed
 * input never reaches the engine.
 */
class ApprovalEngineTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // The granular matrix gates the engine's routes.
        $this->seed(\Database\Seeders\PermissionSeeder::class);
        \Illuminate\Support\Facades\Cache::forget('rbac.matrix');
    }

    private function roleUser(string $role): User
    {
        $user = User::factory()->create();
        UserRole::create(['user_id' => $user->id, 'role' => $role]);

        return $user;
    }

    private function createRequest(User $actor, array $roles): string
    {
        return $this->actingAs($actor, 'sanctum')
            ->postJson('/api/admin/approval-requests', [
                'type' => 'payout.exception',
                'title' => 'Exception for Q3 payout batch',
                'approver_roles' => $roles,
            ])
            ->assertCreated()
            ->json('data.id');
    }

    public function test_store_creates_pending_request_with_ordered_steps(): void
    {
        $moderator = $this->roleUser('moderator');

        $this->createRequest($moderator, ['moderator', 'marketplace_admin']);

        $request = \App\Models\ApprovalRequest::firstOrFail();
        $this->assertSame('payout.exception', $request->type);
        $this->assertSame('pending', $request->status);
        $this->assertSame(1, $request->current_step);
        $this->assertSame($moderator->id, $request->requested_by);

        $steps = $request->steps()->orderBy('step_order')->get();
        $this->assertCount(2, $steps);
        $this->assertSame([1, 2], $steps->pluck('step_order')->all());
        $this->assertSame(['moderator', 'marketplace_admin'], $steps->pluck('approver_role')->all());
        $this->assertSame(['pending', 'pending'], $steps->pluck('status')->all());
    }

    public function test_two_step_journey_requires_each_step_role_in_order(): void
    {
        $moderator = $this->roleUser('moderator');
        $marketplace = $this->roleUser('marketplace_admin');
        $id = $this->createRequest($moderator, ['moderator', 'marketplace_admin']);

        // Step 1 belongs to the moderator role — marketplace_admin may not act yet.
        $this->actingAs($marketplace, 'sanctum')
            ->postJson("/api/admin/approval-requests/{$id}/approve", [])
            ->assertStatus(403)
            ->assertJsonFragment(['message' => 'You are not an approver for the current step']);

        // Moderator approves step 1 → the request advances but stays pending.
        $this->actingAs($moderator, 'sanctum')
            ->postJson("/api/admin/approval-requests/{$id}/approve", [])
            ->assertOk();
        $request = \App\Models\ApprovalRequest::findOrFail($id);
        $this->assertSame('pending', $request->status);
        $this->assertSame(2, $request->current_step);
        $this->assertSame('approved', $request->steps()->where('step_order', 1)->value('status'));

        // Now the moderator (still holding only the moderator role) is out of scope.
        $this->actingAs($moderator, 'sanctum')
            ->postJson("/api/admin/approval-requests/{$id}/approve", [])
            ->assertStatus(403);

        // Marketplace admin approves step 2 → the request is fully approved.
        $this->actingAs($marketplace, 'sanctum')
            ->postJson("/api/admin/approval-requests/{$id}/approve", ['comment' => 'Looks good'])
            ->assertOk();

        $request = \App\Models\ApprovalRequest::findOrFail($id);
        $this->assertSame('approved', $request->status);
        $this->assertNotNull($request->decided_at);
        $this->assertSame(
            ['approved', 'approved'],
            $request->steps()->orderBy('step_order')->pluck('status')->all(),
        );

        // Decisions are one-shot: a further decision answers 422.
        $this->actingAs($marketplace, 'sanctum')
            ->postJson("/api/admin/approval-requests/{$id}/approve", [])
            ->assertStatus(422)
            ->assertJsonFragment(['message' => 'Approval request already decided']);
    }

    public function test_super_admin_bypasses_step_role_gates(): void
    {
        $admin = $this->createAdmin();
        $id = $this->createRequest($admin, ['moderator', 'marketplace_admin']);

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/approval-requests/{$id}/approve", [])
            ->assertOk();
        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/approval-requests/{$id}/approve", [])
            ->assertOk();

        $this->assertSame(
            'approved',
            \App\Models\ApprovalRequest::findOrFail($id)->status,
        );
    }

    public function test_reject_ends_the_request_and_skips_remaining_steps(): void
    {
        $moderator = $this->roleUser('moderator');
        $id = $this->createRequest($moderator, ['moderator', 'marketplace_admin', 'platform_ops']);

        $this->actingAs($moderator, 'sanctum')
            ->postJson("/api/admin/approval-requests/{$id}/reject", ['comment' => 'Scope unclear'])
            ->assertOk();

        $request = \App\Models\ApprovalRequest::findOrFail($id);
        $this->assertSame('rejected', $request->status);
        $this->assertNotNull($request->decided_at);
        $this->assertSame(
            ['rejected', 'skipped', 'skipped'],
            $request->steps()->orderBy('step_order')->pluck('status')->all(),
        );
    }

    public function test_null_approver_role_accepts_any_permission_gated_caller(): void
    {
        $marketplace = $this->roleUser('marketplace_admin');
        $id = $this->createRequest($marketplace, [null]);

        $this->actingAs($marketplace, 'sanctum')
            ->postJson("/api/admin/approval-requests/{$id}/approve", [])
            ->assertOk();

        $this->assertSame(
            'approved',
            \App\Models\ApprovalRequest::findOrFail($id)->status,
        );
    }

    public function test_permission_gate_runs_before_the_engine(): void
    {
        // Guests are rejected before any role logic runs.
        $this->postJson('/api/admin/approval-requests', [
            'type' => 'payout.exception',
            'title' => 'Nope',
            'approver_roles' => ['moderator'],
        ])->assertStatus(401);

        // content_manager / customer_service lack products.products.approve.
        $content = $this->roleUser('content_manager');
        $this->actingAs($content, 'sanctum')
            ->postJson('/api/admin/approval-requests', [
                'type' => 'payout.exception',
                'title' => 'Nope',
                'approver_roles' => ['moderator'],
            ])
            ->assertStatus(403);

        $service = $this->roleUser('customer_service');
        $this->actingAs($service, 'sanctum')
            ->postJson('/api/admin/approval-requests', [
                'type' => 'payout.exception',
                'title' => 'Nope',
                'approver_roles' => ['moderator'],
            ])
            ->assertStatus(403);
    }

    public function test_store_validation_rejects_malformed_input(): void
    {
        $moderator = $this->roleUser('moderator');

        // Unknown role never reaches the engine.
        $this->actingAs($moderator, 'sanctum')
            ->postJson('/api/admin/approval-requests', [
                'type' => 'payout.exception',
                'title' => 'Ghost step',
                'approver_roles' => ['ghost_role'],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['approver_roles.0']);

        // Missing title.
        $this->actingAs($moderator, 'sanctum')
            ->postJson('/api/admin/approval-requests', [
                'type' => 'payout.exception',
                'approver_roles' => ['moderator'],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['title']);

        // Steps are required (at least one).
        $this->actingAs($moderator, 'sanctum')
            ->postJson('/api/admin/approval-requests', [
                'type' => 'payout.exception',
                'title' => 'No steps',
                'approver_roles' => [],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['approver_roles']);

        $this->assertSame(0, \App\Models\ApprovalRequest::count());
    }

    public function test_show_and_decide_answer_404_for_unknown_requests(): void
    {
        $moderator = $this->roleUser('moderator');
        $missing = (string) Str::uuid();

        $this->actingAs($moderator, 'sanctum')
            ->getJson("/api/admin/approval-requests/{$missing}")
            ->assertStatus(404);

        $this->actingAs($moderator, 'sanctum')
            ->postJson("/api/admin/approval-requests/{$missing}/approve", [])
            ->assertStatus(404);
    }

    public function test_index_filters_by_status(): void
    {
        $admin = $this->createAdmin();
        $done = $this->createRequest($admin, ['moderator']);
        $pending = $this->createRequest($admin, ['moderator']);

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/approval-requests/{$done}/approve", [])
            ->assertOk();

        $pendingRows = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/approval-requests?status=pending')
            ->assertOk()
            ->json('data');
        $this->assertSame([$pending], array_column($pendingRows, 'id'));

        $approvedRows = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/approval-requests?status=approved')
            ->assertOk()
            ->json('data');
        $this->assertSame([$done], array_column($approvedRows, 'id'));
    }

    public function test_approvals_console_renders_the_requests_prop(): void
    {
        $admin = $this->createAdmin();
        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/approval-requests', [
                'type' => 'payout.exception',
                'title' => 'Visible in console',
                'approver_roles' => ['moderator', 'marketplace_admin'],
            ])
            ->assertCreated();

        $this->actingAs($admin)
            ->get('/admin/approvals')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/Approvals')
                ->has('requests', 1)
                ->where('requests.0.title', 'Visible in console')
                ->has('requests.0.steps', 2)
                ->where('requests.0.status', 'pending')
                ->where('requests.0.current_step', 1)
            );
    }
}
