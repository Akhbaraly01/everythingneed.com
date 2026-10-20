<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Models\UserRole;
use Database\Seeders\PermissionSeeder;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class RoleEscalationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        \Illuminate\Support\Facades\Cache::forget('rbac.matrix');
    }

    private function userWithRole(string $role): User
    {
        $user = User::factory()->create();
        UserRole::create(['user_id' => $user->id, 'role' => $role]);

        return $user;
    }

    public function test_administrator_can_assign_a_non_super_role(): void
    {
        $actor = $this->userWithRole('administrator');
        $target = $this->userWithRole('user');

        // Give the target two roles first: the write must replace them with
        // exactly one row (no updateOrInsert collapse into duplicates).
        UserRole::create(['user_id' => $target->id, 'role' => 'support_agent']);

        $this->actingAs($actor, 'sanctum')
            ->putJson("/api/admin/users/{$target->id}/role", ['role' => 'moderator'])
            ->assertOk();

        $rows = DB::table('user_roles')->where('user_id', $target->id)->get();
        $this->assertCount(1, $rows);
        $this->assertSame('moderator', $rows->first()->role);
    }

    public function test_administrator_cannot_grant_super_admin(): void
    {
        $actor = $this->userWithRole('administrator');
        $target = $this->userWithRole('user');

        $this->actingAs($actor, 'sanctum')
            ->putJson("/api/admin/users/{$target->id}/role", ['role' => 'super_admin'])
            ->assertForbidden();

        $this->assertSame('user', DB::table('user_roles')->where('user_id', $target->id)->value('role'));
    }

    public function test_administrator_cannot_change_own_role(): void
    {
        $actor = $this->userWithRole('administrator');

        $this->actingAs($actor, 'sanctum')
            ->putJson("/api/admin/users/{$actor->id}/role", ['role' => 'moderator'])
            ->assertForbidden();

        $this->assertSame('administrator', DB::table('user_roles')->where('user_id', $actor->id)->value('role'));
    }

    public function test_administrator_can_demote_a_super_admin_when_another_remains(): void
    {
        $actor = $this->userWithRole('administrator');
        $target = $this->userWithRole('super_admin');
        $otherSuper = $this->userWithRole('super_admin');

        $this->actingAs($actor, 'sanctum')
            ->putJson("/api/admin/users/{$target->id}/role", ['role' => 'user'])
            ->assertOk();

        $this->assertSame('user', DB::table('user_roles')->where('user_id', $target->id)->value('role'));
        $this->assertSame('super_admin', DB::table('user_roles')->where('user_id', $otherSuper->id)->value('role'));
    }

    public function test_last_super_admin_cannot_be_demoted(): void
    {
        $actor = $this->userWithRole('administrator');
        $target = $this->userWithRole('super_admin');

        // Deterministic state: the target is the only super admin.
        DB::table('user_roles')
            ->where('role', 'super_admin')
            ->where('user_id', '!=', $target->id)
            ->delete();

        $this->actingAs($actor, 'sanctum')
            ->putJson("/api/admin/users/{$target->id}/role", ['role' => 'administrator'])
            ->assertStatus(409);

        $this->assertSame('super_admin', DB::table('user_roles')->where('user_id', $target->id)->value('role'));
    }

    public function test_unknown_role_is_rejected(): void
    {
        $actor = $this->userWithRole('administrator');
        $target = $this->userWithRole('user');

        $this->actingAs($actor, 'sanctum')
            ->putJson("/api/admin/users/{$target->id}/role", ['role' => 'not_a_role'])
            ->assertStatus(422);
    }

    public function test_non_managers_cannot_assign_roles(): void
    {
        $actor = $this->userWithRole('support_agent');
        $target = $this->userWithRole('user');

        $this->actingAs($actor, 'sanctum')
            ->putJson("/api/admin/users/{$target->id}/role", ['role' => 'moderator'])
            ->assertForbidden();

        $this->assertSame('user', DB::table('user_roles')->where('user_id', $target->id)->value('role'));
    }

    public function test_rbac_assign_endpoint_applies_the_same_guards(): void
    {
        $actor = $this->userWithRole('administrator');
        $target = $this->userWithRole('user');

        // super_admin grant blocked.
        $this->actingAs($actor, 'sanctum')
            ->putJson('/api/admin/roles/assign', [
                'user_id' => $target->id,
                'role' => 'super_admin',
            ])
            ->assertForbidden();

        // Valid non-super grant allowed.
        $this->actingAs($actor, 'sanctum')
            ->putJson('/api/admin/roles/assign', [
                'user_id' => $target->id,
                'role' => 'finance_admin',
            ])
            ->assertOk();

        $this->assertSame('finance_admin', DB::table('user_roles')->where('user_id', $target->id)->value('role'));

        // Self-assign blocked on this endpoint too.
        $this->actingAs($actor, 'sanctum')
            ->putJson('/api/admin/roles/assign', [
                'user_id' => $actor->id,
                'role' => 'super_admin',
            ])
            ->assertForbidden();
    }

    public function test_super_admin_can_grant_super_admin(): void
    {
        $actor = $this->userWithRole('super_admin');
        $target = $this->userWithRole('user');

        DB::table('user_roles')
            ->where('role', 'super_admin')
            ->where('user_id', '!=', $actor->id)
            ->delete();

        $this->actingAs($actor, 'sanctum')
            ->putJson("/api/admin/users/{$target->id}/role", ['role' => 'super_admin'])
            ->assertOk();

        $this->assertSame('super_admin', DB::table('user_roles')->where('user_id', $target->id)->value('role'));
    }
}
