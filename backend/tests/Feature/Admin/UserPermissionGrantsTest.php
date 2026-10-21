<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Models\UserRole;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * W1.5 — per-user permission grants (user_permissions) layered on the role
 * matrix: API contract, cache behavior, and end-to-end enforcement through
 * the permission: middleware.
 */
class UserPermissionGrantsTest extends TestCase
{
    use RefreshDatabase;

    private function seedMatrix(): void
    {
        $this->seed(PermissionSeeder::class);
        \Illuminate\Support\Facades\Cache::forget('rbac.matrix');
    }

    private function userWithRole(string $role): User
    {
        $user = User::factory()->create();
        UserRole::create(['user_id' => $user->id, 'role' => $role]);

        return $user;
    }

    public function test_grant_adds_revoke_removes_and_hasPermission_tracks_both(): void
    {
        $this->seedMatrix();

        $user = User::factory()->create();
        $this->assertFalse($user->hasPermission('inventory.stock.view'));

        $super = $this->userWithRole('super_admin');

        $this->actingAs($super, 'sanctum')->postJson("/api/admin/users/{$user->id}/permissions", [
            'permission' => 'inventory.stock.view',
            'note' => 'temporary stock duty',
        ])->assertOk();

        $fresh = User::find($user->id);
        $this->assertTrue($fresh->hasPermission('inventory.stock.view'));
        // Unrelated permissions stay denied.
        $this->assertFalse($fresh->hasPermission('orders.orders.manage'));

        $this->actingAs($super, 'sanctum')->getJson("/api/admin/users/{$user->id}/permissions")
            ->assertOk()
            ->assertJsonPath('data.0', 'inventory.stock.view');

        // Effective enforcement through the permission: middleware.
        $this->actingAs($fresh, 'sanctum')->getJson('/api/stock')->assertOk();

        $this->actingAs($super, 'sanctum')
            ->deleteJson("/api/admin/users/{$user->id}/permissions/inventory.stock.view")
            ->assertOk();

        $revoked = User::find($user->id);
        $this->assertFalse($revoked->hasPermission('inventory.stock.view'));
        $this->actingAs($revoked, 'sanctum')->getJson('/api/stock')->assertForbidden();
    }

    public function test_grant_is_idempotent(): void
    {
        $this->seedMatrix();

        $user = User::factory()->create();
        $super = $this->userWithRole('super_admin');

        $payload = ['permission' => 'inventory.stock.view'];
        $this->actingAs($super, 'sanctum')->postJson("/api/admin/users/{$user->id}/permissions", $payload)->assertOk();
        $this->actingAs($super, 'sanctum')->postJson("/api/admin/users/{$user->id}/permissions", $payload)->assertOk();

        $this->assertDatabaseHas('user_permissions', ['user_id' => $user->id, 'permission' => 'inventory.stock.view']);
        $this->assertSame(1, \Illuminate\Support\Facades\DB::table('user_permissions')->where('user_id', $user->id)->count());
    }

    public function test_a_role_without_the_permission_cannot_manage_user_permissions(): void
    {
        $this->seedMatrix();

        $target = User::factory()->create();
        $moderator = $this->userWithRole('moderator');

        $this->actingAs($moderator, 'sanctum')
            ->postJson("/api/admin/users/{$target->id}/permissions", ['permission' => 'inventory.stock.view'])
            ->assertForbidden();
        $this->actingAs($moderator, 'sanctum')
            ->getJson("/api/admin/users/{$target->id}/permissions")
            ->assertForbidden();
        $this->actingAs($moderator, 'sanctum')
            ->deleteJson("/api/admin/users/{$target->id}/permissions/inventory.stock.view")
            ->assertForbidden();

        // The permission is the authority: administrator holds
        // users.permissions.manage and can use the per-user editor.
        $administrator = $this->userWithRole('administrator');
        $this->actingAs($administrator, 'sanctum')
            ->getJson("/api/admin/users/{$target->id}/permissions")
            ->assertOk();
        $this->actingAs($administrator, 'sanctum')
            ->postJson("/api/admin/users/{$target->id}/permissions", ['permission' => 'inventory.stock.view'])
            ->assertOk();
    }

    public function test_invalid_permission_is_rejected_on_grant_and_revoke(): void
    {
        $this->seedMatrix();

        $target = User::factory()->create();
        $super = $this->userWithRole('super_admin');

        $this->actingAs($super, 'sanctum')
            ->postJson("/api/admin/users/{$target->id}/permissions", ['permission' => 'made.up.permission'])
            ->assertStatus(422);

        $this->actingAs($super, 'sanctum')
            ->deleteJson("/api/admin/users/{$target->id}/permissions/made.up.permission")
            ->assertStatus(422);
    }

    public function test_missing_user_returns_404(): void
    {
        $this->seedMatrix();

        $super = $this->userWithRole('super_admin');
        $missing = '00000000-0000-0000-0000-000000000000';

        $this->actingAs($super, 'sanctum')
            ->postJson("/api/admin/users/{$missing}/permissions", ['permission' => 'inventory.stock.view'])
            ->assertStatus(404);
        $this->actingAs($super, 'sanctum')
            ->getJson("/api/admin/users/{$missing}/permissions")
            ->assertStatus(404);
    }

    public function test_guests_receive_401(): void
    {
        $target = User::factory()->create();

        $this->postJson("/api/admin/users/{$target->id}/permissions", ['permission' => 'inventory.stock.view'])
            ->assertUnauthorized();
        $this->getJson("/api/admin/users/{$target->id}/permissions")->assertUnauthorized();
    }

    public function test_user_grant_layers_on_top_of_role_matrix(): void
    {
        $this->seedMatrix();

        // support_agent already holds support.* via the role matrix…
        $agent = $this->userWithRole('support_agent');
        $this->assertTrue($agent->hasPermission('support.tickets.assign'));

        $super = $this->userWithRole('super_admin');
        $this->actingAs($super, 'sanctum')->postJson("/api/admin/users/{$agent->id}/permissions", [
            'permission' => 'analytics.overview.view',
        ])->assertOk();

        // …and the per-user grant adds a permission the role does not carry.
        $fresh = User::find($agent->id);
        $this->assertTrue($fresh->hasPermission('support.tickets.assign'));
        $this->assertTrue($fresh->hasPermission('analytics.overview.view'));
        $this->assertFalse($fresh->hasPermission('analytics.overview.export'));
    }
}
