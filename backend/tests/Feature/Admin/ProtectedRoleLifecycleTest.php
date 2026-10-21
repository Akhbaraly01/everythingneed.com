<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Models\UserRole;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Built-in roles stay protected, but a super admin may take one out of
 * service and bring it back.
 */
class ProtectedRoleLifecycleTest extends TestCase
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

    private function moderator(): User
    {
        $user = User::factory()->create();
        UserRole::create(['user_id' => $user->id, 'role' => 'moderator']);

        return $user;
    }

    public function test_a_non_super_admin_cannot_retire_a_built_in_role(): void
    {
        $this->seedMatrix();
        $moderator = $this->moderator();

        // The route itself is super-admin only (403), and the controller
        // repeats the check (422) as a second layer.
        $this->actingAs($moderator)
            ->deleteJson('/api/admin/rbac/roles/moderator')
            ->assertStatus(403);

        $this->assertDatabaseCount('retired_roles', 0);
    }

    public function test_a_super_admin_retires_a_built_in_role_and_restores_it(): void
    {
        $this->seedMatrix();
        $super = $this->superAdmin();

        $this->actingAs($super)
            ->deleteJson('/api/admin/rbac/roles/moderator')
            ->assertStatus(200)
            ->assertJsonPath('retired', true);

        $this->assertDatabaseHas('retired_roles', ['role' => 'moderator']);

        // The role leaves the registry (every role picker) but stays
        // visible in the console so it can be restored.
        $registry = app(\Core\Services\Contracts\RoleRegistryInterface::class);
        $this->assertFalse($registry->exists('moderator'));
        $this->assertTrue($registry->isRetired('moderator'));

        $matrix = collect($this->actingAs($super)->getJson('/api/admin/rbac/matrix')->json('data'))
            ->firstWhere('role', 'moderator');

        $this->assertNotNull($matrix);
        $this->assertTrue($matrix['is_retired']);

        $this->actingAs($super)
            ->postJson('/api/admin/rbac/roles/moderator/restore')
            ->assertStatus(200);

        $this->assertDatabaseMissing('retired_roles', ['role' => 'moderator']);
        $this->assertTrue(app(\Core\Services\Contracts\RoleRegistryInterface::class)->exists('moderator'));
    }

    public function test_retiring_reassigns_the_holders(): void
    {
        $this->seedMatrix();
        $super = $this->superAdmin();
        $holder = $this->moderator();

        $this->actingAs($super)
            ->deleteJson('/api/admin/rbac/roles/moderator', ['reassign_to' => 'user'])
            ->assertStatus(200);

        $this->assertSame(
            'user',
            DB::table('user_roles')->where('user_id', $holder->id)->value('role'),
        );
    }

    public function test_the_super_admin_role_itself_is_never_deletable(): void
    {
        $this->seedMatrix();
        $super = $this->superAdmin();

        $this->actingAs($super)
            ->deleteJson('/api/admin/rbac/roles/super_admin')
            ->assertStatus(422);

        $this->assertDatabaseCount('retired_roles', 0);
    }

    public function test_only_a_super_admin_can_restore_a_retired_role(): void
    {
        $this->seedMatrix();
        $super = $this->superAdmin();

        $this->actingAs($super)
            ->deleteJson('/api/admin/rbac/roles/moderator')
            ->assertStatus(200);

        $this->actingAs($this->moderator())
            ->postJson('/api/admin/rbac/roles/moderator/restore')
            ->assertStatus(403);

        $this->assertDatabaseHas('retired_roles', ['role' => 'moderator']);
    }
}
