<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Models\UserRole;
use Core\Services\Contracts\RoleRegistryInterface;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class RbacRoleResetTest extends TestCase
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

    private function matrixRow(string $role): array
    {
        $row = collect(\Illuminate\Support\Facades\DB::table('role_permissions')
            ->where('role', $role)
            ->where('state', 'granted')
            ->pluck('permission'))
            ->sort()
            ->values()
            ->all();

        return $row;
    }

    public function test_reset_restores_seeded_defaults(): void
    {
        $this->seedMatrix();
        $super = $this->superAdmin();

        // Drift the matrix: revoke a seeded permission, add an extra one.
        $this->actingAs($super)->postJson('/api/admin/rbac/bulk', [
            'role' => 'moderator',
            'grant' => ['analytics.overview.export'],
            'revoke' => ['products.products.view'],
        ])->assertStatus(200);

        $response = $this->actingAs($super)
            ->postJson('/api/admin/rbac/roles/moderator/reset');
        $response->assertStatus(200);

        $expected = PermissionSeeder::defaultsFor('moderator');
        sort($expected);

        $this->assertSame($expected, $this->matrixRow('moderator'));

        // The seeded permission is effective again; the extra one is gone.
        $moderator = User::factory()->create();
        UserRole::create(['user_id' => $moderator->id, 'role' => 'moderator']);
        $this->assertTrue($moderator->hasPermission('products.products.view'));
        $this->assertFalse($moderator->hasPermission('analytics.overview.export'));
    }

    public function test_reset_super_admin_matches_full_catalog_and_survives_after(): void
    {
        $this->seedMatrix();
        $super = $this->superAdmin();

        // Wipe the wildcard role's explicit rows, then reset them back.
        \Illuminate\Support\Facades\DB::table('role_permissions')
            ->where('role', 'super_admin')
            ->delete();

        $this->actingAs($super)
            ->postJson('/api/admin/rbac/roles/super_admin/reset')
            ->assertStatus(200);

        $expected = PermissionSeeder::defaultsFor('super_admin');
        sort($expected);

        $this->assertSame($expected, $this->matrixRow('super_admin'));
        $this->assertCount(count(PermissionSeeder::CATALOG), $expected);
    }

    public function test_reset_rejects_custom_and_unknown_roles(): void
    {
        $this->seedMatrix();
        $super = $this->superAdmin();

        app(RoleRegistryInterface::class)->create('Temp Ops', 'temp_ops', null, [], null);

        $this->actingAs($super)
            ->postJson('/api/admin/rbac/roles/temp_ops/reset')
            ->assertStatus(422);

        $this->actingAs($super)
            ->postJson('/api/admin/rbac/roles/not_a_role/reset')
            ->assertStatus(422);
    }

    public function test_reset_requires_super_admin(): void
    {
        $this->seedMatrix();

        $plain = User::factory()->create();
        UserRole::create(['user_id' => $plain->id, 'role' => 'user']);

        $this->actingAs($plain)
            ->postJson('/api/admin/rbac/roles/moderator/reset')
            ->assertStatus(403);
    }
}
