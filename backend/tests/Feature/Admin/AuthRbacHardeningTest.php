<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Models\UserRole;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthRbacHardeningTest extends TestCase
{
    use RefreshDatabase;

    private function seedMatrix(): void
    {
        $this->seed(PermissionSeeder::class);
        \Illuminate\Support\Facades\Cache::forget('rbac.matrix');
    }

    public function test_api_registration_assigns_default_user_role(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'email' => 'newuser@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'full_name' => 'New User',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.user.role', 'user');

        $user = User::where('email', 'newuser@example.com')->firstOrFail();
        $this->assertTrue($user->hasRole('user'));
    }

    public function test_web_registration_assigns_default_user_role(): void
    {
        $this->from('/register')->post('/register', [
            'name' => 'Web User',
            'email' => 'webuser@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])->assertRedirect(route('dashboard'));

        $user = User::where('email', 'webuser@example.com')->firstOrFail();
        $this->assertTrue($user->hasRole('user'));
    }

    public function test_suspend_revokes_active_api_tokens(): void
    {
        $this->seedMatrix();

        $victim = User::factory()->create(['password' => bcrypt('Password123!')]);
        $token = $victim->createToken('auth-token')->plainTextToken;

        $admin = User::factory()->create();
        UserRole::create(['user_id' => $admin->id, 'role' => 'super_admin']);

        // Token works before suspension.
        $this->withToken($token)->getJson('/api/auth/user')->assertOk();

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/users/{$victim->id}/suspend")
            ->assertOk();

        // Drop the admin acting-as binding so the victim token is evaluated cleanly.
        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/auth/user')->assertStatus(401);

        // And login is blocked.
        $this->postJson('/api/auth/login', [
            'email' => $victim->email,
            'password' => 'Password123!',
        ])->assertStatus(403);
    }

    public function test_role_middleware_returns_json_forbidden_on_api(): void
    {
        $this->seedMatrix();

        $pleb = User::factory()->create();
        UserRole::create(['user_id' => $pleb->id, 'role' => 'user']);

        $this->actingAs($pleb, 'sanctum')
            ->getJson('/api/admin/rbac/matrix')
            ->assertStatus(403)
            ->assertJsonPath('message', 'Forbidden');
    }

    public function test_role_middleware_returns_401_for_api_guests(): void
    {
        $this->seedMatrix();

        $this->getJson('/api/admin/rbac/matrix')
            ->assertStatus(401);
    }

    public function test_permission_middleware_blocks_without_grant(): void
    {
        $this->seedMatrix();

        $cs = User::factory()->create();
        UserRole::create(['user_id' => $cs->id, 'role' => 'customer_service']);

        // customer_service lacks products.products.approve
        $this->actingAs($cs, 'sanctum')
            ->getJson('/api/admin/products/pending')
            ->assertStatus(403);
    }

    public function test_permission_middleware_allows_with_grant(): void
    {
        $this->seedMatrix();

        $mod = User::factory()->create();
        UserRole::create(['user_id' => $mod->id, 'role' => 'moderator']);

        $this->actingAs($mod, 'sanctum')
            ->getJson('/api/admin/products/pending')
            ->assertOk();
    }

    public function test_permissions_catalog_matches_permission_seeder(): void
    {
        $this->seedMatrix();

        $super = User::factory()->create();
        UserRole::create(['user_id' => $super->id, 'role' => 'super_admin']);

        $res = $this->actingAs($super, 'sanctum')->getJson('/api/admin/permissions');
        $res->assertOk();

        $flat = [];
        foreach ($res->json('data') as $module => $actions) {
            foreach ($actions as $action) {
                $flat[] = $module.'.'.$action;
            }
        }

        $this->assertEqualsCanonicalizing(PermissionSeeder::CATALOG, $flat);
    }

    public function test_rbac_roles_list_includes_seeder_matrix_roles(): void
    {
        $this->seedMatrix();

        $super = User::factory()->create();
        UserRole::create(['user_id' => $super->id, 'role' => 'super_admin']);

        $roles = collect(
            $this->actingAs($super, 'sanctum')->getJson('/api/admin/roles')->json('data')
        )->pluck('role');

        foreach (['super_admin', 'finance_admin', 'hotel_admin', 'kyc_reviewer', 'user'] as $role) {
            $this->assertTrue($roles->contains($role), "Missing role {$role}");
        }
    }

    public function test_api_login_is_rate_limited(): void
    {
        // throttle:10,1 on /api/auth/login — 11th attempt in the window is 429.
        $payload = [
            'email' => 'nobody@example.com',
            'password' => 'WrongPassword',
        ];

        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/auth/login', $payload);
        }

        $this->postJson('/api/auth/login', $payload)->assertStatus(429);
    }
}
