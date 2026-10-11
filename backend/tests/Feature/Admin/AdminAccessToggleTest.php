<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * W8 dashboard Admin Access switches: suspend/restore cut access off at
 * once (tokens + DB sessions purged, per-request middleware blocks any
 * surviving session), never on yourself, and never the last active
 * super admin (lockout guard -> 409).
 */
class AdminAccessToggleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        Cache::forget('rbac.matrix');
    }

    #[Test]
    public function test_suspend_purges_tokens_and_sessions_and_blocks_further_requests(): void
    {
        $victim = User::factory()->create([
            'password' => \Illuminate\Support\Facades\Hash::make('Password123!'),
        ]);
        $this->assignRole($victim, 'content_manager');
        $token = $victim->createToken('auth-token')->plainTextToken;

        DB::table('sessions')->insert([
            'id' => 'session-'.substr($victim->id, 0, 8),
            'user_id' => $victim->id,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'test',
            'payload' => base64_encode(serialize([])),
            'last_activity' => time(),
        ]);

        // Works before suspension.
        $this->withToken($token)->getJson('/api/auth/user')->assertOk();

        $admin = $this->actingAsAdmin();
        $this->postJson("/api/admin/users/{$victim->id}/suspend")->assertOk()
            ->assertJsonFragment(['message' => 'User suspended']);

        // Token + stateful session both die immediately.
        $this->assertDatabaseMissing('sessions', ['user_id' => $victim->id]);
        $this->assertNotNull($victim->fresh()->suspended_at);
        // Reload: guards read attributes off the bound instance, and real
        // requests always re-fetch from token/session.
        $victim = $victim->fresh();

        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/auth/user')->assertStatus(401);

        // Any surviving session is blocked per-request by the middleware.
        $this->actingAs($victim, 'sanctum')
            ->getJson('/api/admin/stats')
            ->assertStatus(403)
            ->assertJsonPath('message', 'This account has been suspended. Contact support for assistance.');

        $this->app['auth']->forgetGuards();
        $this->actingAs($victim)
            ->get('/dashboard')
            ->assertRedirect(route('login'));
    }

    #[Test]
    public function test_self_suspension_is_forbidden(): void
    {
        $admin = $this->actingAsAdmin();

        $this->postJson("/api/admin/users/{$admin->id}/suspend")
            ->assertStatus(403);

        $this->assertNull($admin->fresh()->suspended_at);
    }

    #[Test]
    public function test_administrator_cannot_suspend_the_last_active_super_admin(): void
    {
        $super = User::factory()->create();
        $this->assignRole($super, 'super_admin');

        $actor = User::factory()->create();
        $this->assignRole($actor, 'administrator');
        $this->actingAs($actor, 'sanctum');

        $this->postJson("/api/admin/users/{$super->id}/suspend")
            ->assertStatus(409)
            ->assertJsonFragment(['message' => 'The last active super admin cannot be suspended.']);

        $this->assertNull($super->fresh()->suspended_at);
    }

    #[Test]
    public function test_suspend_restore_roundtrip(): void
    {
        $victim = User::factory()->create([
            'password' => \Illuminate\Support\Facades\Hash::make('Password123!'),
        ]);
        $this->assignRole($victim, 'content_manager');
        $this->actingAsAdmin();

        $this->postJson("/api/admin/users/{$victim->id}/suspend")->assertOk();
        $this->assertNotNull($victim->fresh()->suspended_at);

        // Login is blocked while suspended.
        $this->postJson('/api/auth/login', [
            'email' => $victim->email,
            'password' => 'Password123!',
        ])->assertStatus(403);

        $this->postJson("/api/admin/users/{$victim->id}/restore")->assertOk()
            ->assertJsonFragment(['message' => 'User restored']);

        $this->assertNull($victim->fresh()->suspended_at);
        $this->postJson('/api/auth/login', [
            'email' => $victim->email,
            'password' => 'Password123!',
        ])->assertOk();
    }

    #[Test]
    public function test_non_actors_cannot_toggle_access(): void
    {
        $victim = User::factory()->create();
        $this->assignRole($victim, 'content_manager');

        // Guest -> 401.
        $this->postJson("/api/admin/users/{$victim->id}/suspend")->assertStatus(401);

        // A customer lacks manageUsers -> 403.
        $customer = User::factory()->create();
        $this->assignRole($customer, 'user');
        $this->actingAs($customer, 'sanctum');
        $this->postJson("/api/admin/users/{$victim->id}/suspend")->assertStatus(403);

        $this->assertNull($victim->fresh()->suspended_at);
    }

    #[Test]
    public function test_super_admin_dashboard_receives_the_admin_access_accounts(): void
    {
        $victim = User::factory()->create();
        $this->assignRole($victim, 'content_manager');

        $customer = User::factory()->create();
        $this->assignRole($customer, 'user');

        $actor = $this->createAdmin();

        $this->actingAs($actor, 'web')->get('/admin')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/Dashboard')
                ->has('adminAccess')
                ->where('adminAccess', function ($accounts) use ($actor, $victim, $customer) {
                    $byId = collect($accounts)->keyBy('id');

                    // Console accounts are listed with roles + state...
                    if (! $byId->has($victim->id)
                        || $byId[$victim->id]['suspended'] !== false
                        || ! in_array('content_manager', $byId[$victim->id]['roles'], true)) {
                        return false;
                    }
                    if (! $byId->has($actor->id) || $byId[$actor->id]['is_self'] !== true) {
                        return false;
                    }

                    // ...customers are not part of admin access management.
                    return ! $byId->has($customer->id);
                }));
    }

    #[Test]
    public function test_non_super_admins_do_not_receive_the_access_list(): void
    {
        $actor = User::factory()->create();
        $this->assignRole($actor, 'administrator');

        $this->actingAs($actor, 'web')->get('/admin')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/Dashboard')
                ->where('adminAccess', null));
    }
}
