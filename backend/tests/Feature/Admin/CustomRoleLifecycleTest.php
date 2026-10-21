<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Models\UserRole;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CustomRoleLifecycleTest extends TestCase
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

    public function test_create_custom_role_with_permissions(): void
    {
        $this->seedMatrix();
        $super = $this->superAdmin();

        $response = $this->actingAs($super)->postJson('/api/admin/rbac/roles', [
            'name' => 'Regional Manager',
            'slug' => 'regional_manager',
            'description' => 'Scoped marketplace manager.',
            'permissions' => ['products.products.view', 'orders.orders.view'],
        ]);
        $response->assertStatus(201)->assertJson(['slug' => 'regional_manager']);

        $matrix = collect($this->actingAs($super)->getJson('/api/admin/rbac/matrix')->json('data'))
            ->firstWhere('role', 'regional_manager');

        $this->assertNotNull($matrix);
        $this->assertSame('Regional Manager', $matrix['label']);
        $this->assertFalse($matrix['is_core']);
        $this->assertTrue($matrix['is_custom']);
        $this->assertSame(0, $matrix['user_count']);
        $this->assertContains('products.products.view', $matrix['permissions']);
        $this->assertContains('orders.orders.view', $matrix['permissions']);
    }

    public function test_create_generates_slug_from_name(): void
    {
        $this->seedMatrix();
        $super = $this->superAdmin();

        $response = $this->actingAs($super)->postJson('/api/admin/rbac/roles', [
            'name' => 'Regional Ops Lead',
            'permissions' => [],
        ]);
        $response->assertStatus(201)->assertJson(['slug' => 'regional_ops_lead']);
    }

    public function test_create_rejects_reserved_and_duplicate_slugs(): void
    {
        $this->seedMatrix();
        $super = $this->superAdmin();

        $this->actingAs($super)->postJson('/api/admin/rbac/roles', [
            'name' => 'Sneaky',
            'slug' => 'moderator',
        ])->assertStatus(422)->assertJsonValidationErrors('slug');

        $this->actingAs($super)->postJson('/api/admin/rbac/roles', [
            'name' => 'Regional Ops',
            'slug' => 'regional_ops',
        ])->assertStatus(201);

        $this->actingAs($super)->postJson('/api/admin/rbac/roles', [
            'name' => 'Regional Ops Two',
            'slug' => 'regional_ops',
        ])->assertStatus(422)->assertJsonValidationErrors('slug');

        $this->actingAs($super)->postJson('/api/admin/rbac/roles', [
            'name' => 'Bad Slug',
            'slug' => '9bad-slug',
        ])->assertStatus(422)->assertJsonValidationErrors('slug');
    }

    public function test_assign_user_to_custom_role_grants_its_permissions(): void
    {
        $this->seedMatrix();
        $super = $this->superAdmin();

        $this->actingAs($super)->postJson('/api/admin/rbac/roles', [
            'name' => 'Regional Ops',
            'slug' => 'regional_ops',
            'permissions' => ['products.products.view', 'orders.orders.view'],
        ])->assertStatus(201);

        $user = User::factory()->create();

        $this->actingAs($super)->putJson('/api/admin/roles/assign', [
            'user_id' => $user->id,
            'role' => 'regional_ops',
        ])->assertStatus(200);

        $this->assertTrue($user->hasPermission('products.products.view'));
        $this->assertTrue($user->hasPermission('orders.orders.view'));
        $this->assertFalse($user->hasPermission('users.users.view'));
    }

    public function test_delete_blocked_while_users_hold_the_role(): void
    {
        $this->seedMatrix();
        $super = $this->superAdmin();

        $this->actingAs($super)->postJson('/api/admin/rbac/roles', [
            'name' => 'Regional Ops',
            'slug' => 'regional_ops',
        ])->assertStatus(201);

        $holder = User::factory()->create();
        UserRole::create(['user_id' => $holder->id, 'role' => 'regional_ops']);

        $this->actingAs($super)
            ->deleteJson('/api/admin/rbac/roles/regional_ops')
            ->assertStatus(422);

        // Reassign the holder, then deletion succeeds and cleans up rows.
        $this->actingAs($super)->putJson('/api/admin/roles/assign', [
            'user_id' => $holder->id,
            'role' => 'user',
        ])->assertStatus(200);

        $this->actingAs($super)
            ->deleteJson('/api/admin/rbac/roles/regional_ops')
            ->assertStatus(200);

        $this->assertSame(0, DB::table('custom_roles')->where('slug', 'regional_ops')->count());
        $this->assertSame(0, DB::table('role_permissions')->where('role', 'regional_ops')->count());

        $matrix = collect($this->actingAs($super)->getJson('/api/admin/rbac/matrix')->json('data'))
            ->firstWhere('role', 'regional_ops');
        $this->assertNull($matrix);
    }

    public function test_delete_with_reassign_moves_holders_and_cleans_rows(): void
    {
        $this->seedMatrix();
        $super = $this->superAdmin();

        $this->actingAs($super)->postJson('/api/admin/rbac/roles', [
            'name' => 'Regional Ops',
            'slug' => 'regional_ops',
            'permissions' => ['products.products.view'],
        ])->assertStatus(201);

        $bareHolder = User::factory()->create();
        UserRole::create(['user_id' => $bareHolder->id, 'role' => 'regional_ops']);

        $existingUser = User::factory()->create();
        UserRole::create(['user_id' => $existingUser->id, 'role' => 'user']);
        UserRole::create(['user_id' => $existingUser->id, 'role' => 'regional_ops']);

        $this->actingAs($super)
            ->deleteJson('/api/admin/rbac/roles/regional_ops', ['reassign_to' => 'user'])
            ->assertStatus(200);

        $this->assertSame(0, DB::table('custom_roles')->where('slug', 'regional_ops')->count());
        $this->assertSame(0, DB::table('role_permissions')->where('role', 'regional_ops')->count());
        $this->assertSame(0, DB::table('user_roles')->where('role', 'regional_ops')->count());
        $this->assertSame(
            'user',
            DB::table('user_roles')->where('user_id', $bareHolder->id)->value('role'),
        );
        $this->assertSame(
            1,
            DB::table('user_roles')->where('user_id', $existingUser->id)->count(),
        );
        $this->assertSame(
            'user',
            DB::table('user_roles')->where('user_id', $existingUser->id)->value('role'),
        );
    }

    public function test_delete_reassign_target_must_exist_and_differ_from_deleted_role(): void
    {
        $this->seedMatrix();
        $super = $this->superAdmin();

        $this->actingAs($super)->postJson('/api/admin/rbac/roles', [
            'name' => 'Regional Ops',
            'slug' => 'regional_ops',
        ])->assertStatus(201);

        $this->actingAs($super)
            ->deleteJson('/api/admin/rbac/roles/regional_ops', ['reassign_to' => 'not_a_role'])
            ->assertStatus(422);

        $this->actingAs($super)
            ->deleteJson('/api/admin/rbac/roles/regional_ops', ['reassign_to' => 'regional_ops'])
            ->assertStatus(422);

        $this->assertSame(1, DB::table('custom_roles')->where('slug', 'regional_ops')->count());
    }

    public function test_delete_rejects_builtin_and_unknown_roles(): void
    {
        $this->seedMatrix();
        $super = $this->superAdmin();

        $this->actingAs($super)
            ->deleteJson('/api/admin/rbac/roles/moderator')
            ->assertStatus(422);

        $this->actingAs($super)
            ->deleteJson('/api/admin/rbac/roles/not_a_role')
            ->assertStatus(404);
    }

    public function test_roles_endpoint_merges_custom_roles_with_metadata(): void
    {
        $this->seedMatrix();
        $super = $this->superAdmin();

        $this->actingAs($super)->postJson('/api/admin/rbac/roles', [
            'name' => 'Regional Ops',
            'slug' => 'regional_ops',
        ])->assertStatus(201);

        $roles = collect($this->actingAs($super)->getJson('/api/admin/roles')->json('data'));

        $custom = $roles->firstWhere('role', 'regional_ops');
        $this->assertNotNull($custom);
        $this->assertSame('Regional Ops', $custom['label']);
        $this->assertTrue($custom['is_custom']);
        $this->assertFalse($custom['is_core']);

        $superRow = $roles->firstWhere('role', 'super_admin');
        $this->assertSame('Super Admin', $superRow['label']);
        $this->assertTrue($superRow['is_core']);
        $this->assertFalse($superRow['is_custom']);
    }

    public function test_create_requires_super_admin(): void
    {
        $this->seedMatrix();

        $plain = User::factory()->create();
        UserRole::create(['user_id' => $plain->id, 'role' => 'user']);

        $this->actingAs($plain)->postJson('/api/admin/rbac/roles', [
            'name' => 'Sneaky Role',
        ])->assertStatus(403);
    }
}
