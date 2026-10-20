<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Models\UserRole;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class RbacBulkUpdateTest extends TestCase
{
    use RefreshDatabase;

    private function seedMatrix(): void
    {
        $this->seed(PermissionSeeder::class);
        Cache::forget('rbac.matrix');
    }

    private function superAdmin(): User
    {
        $user = User::factory()->create();
        UserRole::create(['user_id' => $user->id, 'role' => 'super_admin']);

        return $user;
    }

    public function test_bulk_grant_and_revoke_applies_immediately(): void
    {
        $this->seedMatrix();
        $super = $this->superAdmin();

        $moderator = User::factory()->create();
        UserRole::create(['user_id' => $moderator->id, 'role' => 'moderator']);

        // Before: moderator holds products.products.view, not analytics.
        $this->assertTrue($moderator->hasPermission('products.products.view'));
        $this->assertFalse($moderator->hasPermission('analytics.overview.export'));

        $response = $this->actingAs($super)->postJson('/api/admin/rbac/bulk', [
            'role' => 'moderator',
            'grant' => ['analytics.overview.export'],
            'revoke' => ['products.products.view'],
        ]);
        $response->assertStatus(200);

        // Same request cycle: both changes are already effective.
        $this->assertTrue($moderator->hasPermission('analytics.overview.export'));
        $this->assertFalse($moderator->hasPermission('products.products.view'));

        $matrix = collect($this->actingAs($super)->getJson('/api/admin/rbac/matrix')->json('data'))
            ->firstWhere('role', 'moderator');
        $this->assertContains('analytics.overview.export', $matrix['permissions']);
        $this->assertNotContains('products.products.view', $matrix['permissions']);

        $denied = collect($this->actingAs($super)->getJson('/api/admin/rbac/matrix')->json('denied'))
            ->firstWhere('role', 'moderator');
        $this->assertContains('products.products.view', $denied['permissions']);
    }

    public function test_bulk_update_is_atomic_when_payload_is_invalid(): void
    {
        $this->seedMatrix();
        $super = $this->superAdmin();

        $response = $this->actingAs($super)->postJson('/api/admin/rbac/bulk', [
            'role' => 'moderator',
            'grant' => ['analytics.overview.export', 'made.up.permission'],
            'revoke' => [],
        ]);
        $response->assertStatus(422);

        // The valid entry must not have been applied (no partial write).
        $moderator = User::factory()->create();
        UserRole::create(['user_id' => $moderator->id, 'role' => 'moderator']);
        $this->assertFalse($moderator->hasPermission('analytics.overview.export'));
    }

    public function test_bulk_update_rejects_unknown_role(): void
    {
        $this->seedMatrix();
        $super = $this->superAdmin();

        $this->actingAs($super)->postJson('/api/admin/rbac/bulk', [
            'role' => 'not_a_role',
            'grant' => ['analytics.overview.export'],
        ])->assertStatus(422);
    }

    public function test_bulk_update_requires_super_admin(): void
    {
        $this->seedMatrix();

        $plain = User::factory()->create();
        UserRole::create(['user_id' => $plain->id, 'role' => 'user']);

        $this->actingAs($plain)->postJson('/api/admin/rbac/bulk', [
            'role' => 'moderator',
            'grant' => ['analytics.overview.export'],
        ])->assertStatus(403);
    }

    public function test_bulk_update_works_on_custom_roles(): void
    {
        $this->seedMatrix();
        $super = $this->superAdmin();

        // Create the custom role first, then bulk-fill it from the console.
        $this->actingAs($super)->postJson('/api/admin/rbac/roles', [
            'name' => 'Regional Ops',
            'slug' => 'regional_ops',
        ])->assertStatus(201);

        $this->actingAs($super)->postJson('/api/admin/rbac/bulk', [
            'role' => 'regional_ops',
            'grant' => ['products.products.view', 'orders.orders.view'],
            'revoke' => [],
        ])->assertStatus(200);

        $holder = User::factory()->create();
        UserRole::create(['user_id' => $holder->id, 'role' => 'regional_ops']);

        $this->assertTrue($holder->hasPermission('products.products.view'));
        $this->assertTrue($holder->hasPermission('orders.orders.view'));
        $this->assertFalse($holder->hasPermission('orders.orders.refund'));
    }
}
