<?php

namespace Tests\Feature\Admin;

use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedRequest;
use Tests\TestCase;

/**
 * TODO 21 needs RBAC: the read-only viewer sees every queue and mutates
 * nothing; privileged roles cannot self-escalate through the RBAC API.
 */
class NeedsViewerRbacTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\PermissionSeeder::class);
    }

    public function test_viewer_reads_queues_but_writes_nothing(): void
    {
        $category = NeedCategory::create([
            'name' => 'Cleaning',
            'slug' => 'cleaning-' . uniqid(),
            'icon' => 'sparkles',
            'color' => '#10B981',
        ]);
        $owner = $this->actingAsUser();
        $request = NeedRequest::create([
            'user_id' => $owner->id,
            'category_id' => $category->id,
            'request_number' => 'NR-' . strtoupper(uniqid()),
            'title' => 'Clean',
            'description' => 'D',
            'status' => NeedRequest::STATUS_PENDING,
        ]);

        $this->actingAsUser('needs_viewer');

        // Every queue reads fine.
        foreach ([
            '/api/admin/needs/overview',
            '/api/admin/needs/requests',
            "/api/admin/needs/requests/{$request->id}",
            '/api/admin/needs/offers',
            '/api/admin/needs/tasks',
            '/api/admin/needs/disputes',
            '/api/admin/needs/fraud-flags',
            '/api/admin/needs/providers',
            '/api/admin/needs/listings',
        ] as $path) {
            $this->getJson($path)->assertOk();
        }

        // Every write is refused.
        $this->postJson("/api/admin/needs/requests/{$request->id}/moderate", ['action' => 'reject'])->assertStatus(403);
        $this->postJson('/api/admin/needs/fraud-scan')->assertStatus(403);
        $this->postJson("/api/admin/needs/tasks/{$request->id}/cancel")->assertStatus(403);
        $this->postJson('/api/admin/needs/categories', ['name' => 'X', 'slug' => 'x'])->assertStatus(403);
    }

    public function test_fraud_decide_needs_manage_not_view(): void
    {
        $this->actingAsUser('needs_viewer');

        // View-only fraud triage cannot decide flags (tested with a bogus id
        // only after the gate — the gate fires first by middleware order).
        $this->postJson('/api/admin/needs/fraud-flags/' . (string) \Illuminate\Support\Str::uuid() . '/decide', [
            'decision' => 'dismiss',
        ])->assertStatus(403);
    }

    public function test_needs_roles_cannot_self_escalate(): void
    {
        foreach (['needs_admin', 'needs_viewer', 'moderator'] as $role) {
            $this->actingAsUser($role);

            // Role grants are super_admin-only; operational roles get 403.
            $this->postJson('/api/admin/rbac/grant', [
                'role' => 'needs_admin',
                'permission' => 'needs.requests.moderate',
            ])->assertStatus(403);

            // Per-user grants are super_admin-only too (role gate fires first).
            $this->postJson('/api/admin/users/' . (string) \Illuminate\Support\Str::uuid() . '/permissions', [
                'permission' => 'needs.requests.moderate',
            ])->assertStatus(403);
        }
    }

    public function test_viewer_reaches_console_page_but_not_rbac(): void
    {
        $viewer = $this->actingAsUser('needs_viewer');

        $this->actingAs($viewer, 'web')->get('/admin/needs')->assertOk();
        $this->actingAs($viewer, 'web')->get('/admin/rbac')->assertStatus(302);
    }
}
