<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Database\Seeders\PermissionSeeder;
use Tests\TestCase;

class RbacMatrixTest extends TestCase
{
    use RefreshDatabase;

    private function seedMatrix(): void
    {
        $this->seed(PermissionSeeder::class);
        \Illuminate\Support\Facades\Cache::forget('rbac.matrix');
    }

    public function test_super_admin_implicitly_holds_every_permission(): void
    {
        $this->seedMatrix();

        $admin = User::factory()->create();
        \App\Models\UserRole::create(['user_id' => $admin->id, 'role' => 'super_admin']);

        $this->assertTrue($admin->hasPermission('finance.refunds.process'));
        $this->assertTrue($admin->hasPermission('anything.at.all'));
    }

    public function test_scoped_roles_hold_only_granted_permissions(): void
    {
        $this->seedMatrix();

        // finance_admin holds finance.* but not healthcare.*
        $finance = User::factory()->create();
        \App\Models\UserRole::create(['user_id' => $finance->id, 'role' => 'finance_admin']);

        $this->assertTrue($finance->hasPermission('finance.payments.manage'));
        $this->assertTrue($finance->hasPermission('finance.payouts.manage'));
        $this->assertFalse($finance->hasPermission('healthcare.records.view'));

        // customer_service holds support.* but cannot refund
        $cs = User::factory()->create();
        \App\Models\UserRole::create(['user_id' => $cs->id, 'role' => 'customer_service']);

        $this->assertTrue($cs->hasPermission('support.tickets.escalate'));
        $this->assertFalse($cs->hasPermission('orders.orders.refund'));
    }

    public function test_plain_user_has_no_permissions(): void
    {
        $this->seedMatrix();

        $user = User::factory()->create();
        \App\Models\UserRole::create(['user_id' => $user->id, 'role' => 'user']);

        $this->assertFalse($user->hasPermission('products.products.view'));
        $this->assertFalse($user->hasPermission('analytics.overview.export'));
    }

    public function test_super_admin_can_grant_and_revoke_via_api(): void
    {
        $this->seedMatrix();

        $super = User::factory()->create();
        \App\Models\UserRole::create(['user_id' => $super->id, 'role' => 'super_admin']);

        // Grant a new pair (moderator gets analytics.overview.export)
        $grant = $this->actingAs($super)->postJson('/api/admin/rbac/grant', [
            'role' => 'moderator',
            'permission' => 'analytics.overview.export',
        ]);
        $grant->assertStatus(200);

        $matrix = $this->actingAs($super)->getJson('/api/admin/rbac/matrix');
        $matrix->assertStatus(200);
        $moderator = collect($matrix->json('data'))->firstWhere('role', 'moderator');
        $this->assertContains('analytics.overview.export', $moderator['permissions']);

        // Non-super admin is blocked
        $pleb = User::factory()->create();
        $blocked = $this->actingAs($pleb)->postJson('/api/admin/rbac/revoke', [
            'role' => 'moderator',
            'permission' => 'analytics.overview.export',
        ]);
        $blocked->assertStatus(403);

        // Revoke works for super admin
        $revoke = $this->actingAs($super)->postJson('/api/admin/rbac/revoke', [
            'role' => 'moderator',
            'permission' => 'analytics.overview.export',
        ]);
        $revoke->assertStatus(200);

        $after = collect(
            $this->actingAs($super)->getJson('/api/admin/rbac/matrix')->json('data')
        )->firstWhere('role', 'moderator');
        $this->assertNotContains('analytics.overview.export', $after['permissions']);
    }

    public function test_invalid_role_or_permission_rejected(): void
    {
        $this->seedMatrix();

        $super = User::factory()->create();
        \App\Models\UserRole::create(['user_id' => $super->id, 'role' => 'super_admin']);

        $this->actingAs($super)->postJson('/api/admin/rbac/grant', [
            'role' => 'hacker_role',
            'permission' => 'products.products.view',
        ])->assertStatus(422);

        $this->actingAs($super)->postJson('/api/admin/rbac/grant', [
            'role' => 'moderator',
            'permission' => 'made.up.permission',
        ])->assertStatus(422);
    }
}
