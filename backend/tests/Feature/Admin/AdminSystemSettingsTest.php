<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * W5 settings console contract: /api/admin/settings is a real CRUD surface
 * over system_settings (upsert + **actual delete**, cache invalidated on
 * every write), feature-flag toggles only flip seeded flags (unknown keys
 * answer 404 and never auto-create rows), and the Settings/System gates now
 * match the role matrix: super_admin + administrator (nav declares
 * settings.system.update, so visibility == authorization).
 */
class AdminSystemSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\PermissionSeeder::class);
        Cache::forget('rbac.matrix');
    }

    public function test_update_persists_to_system_settings_and_invalidates_cache(): void
    {
        $this->actingAsAdmin();

        $this->putJson('/api/admin/settings', [
            'settings' => [['key' => 'platform_name', 'value' => 'EverythingNeed']],
        ])->assertOk();

        $this->assertDatabaseHas('system_settings', ['key' => 'platform_name', 'value' => 'EverythingNeed']);

        // Warm the 5-minute cache…
        $this->getJson('/api/admin/settings')
            ->assertOk()
            ->assertJsonPath('data.platform_name', 'EverythingNeed');

        // …then a write must be visible immediately (cache forgotten).
        $this->putJson('/api/admin/settings', [
            'settings' => [['key' => 'platform_name', 'value' => 'EverythingNeed 2.0']],
        ])->assertOk();

        $this->getJson('/api/admin/settings')
            ->assertOk()
            ->assertJsonPath('data.platform_name', 'EverythingNeed 2.0');
    }

    public function test_delete_really_removes_the_setting_and_unknown_keys_404(): void
    {
        $this->actingAsAdmin();

        $this->putJson('/api/admin/settings', [
            'settings' => [['key' => 'temp_key', 'value' => 'x']],
        ])->assertOk();
        $this->assertDatabaseHas('system_settings', ['key' => 'temp_key']);

        $this->deleteJson('/api/admin/settings/temp_key')
            ->assertOk()
            ->assertJsonFragment(['message' => 'Setting deleted']);

        $this->assertDatabaseMissing('system_settings', ['key' => 'temp_key']);

        // Deleted rows stay deleted after a reload (the FE used to fake this).
        $rows = $this->getJson('/api/admin/settings')->assertOk()->json('data');
        $this->assertArrayNotHasKey('temp_key', $rows);

        $this->deleteJson('/api/admin/settings/' . Str::random(12))
            ->assertStatus(404)
            ->assertJsonFragment(['message' => 'Setting not found']);
    }

    public function test_feature_flag_toggle_flips_seeded_flags_and_rejects_unknown_keys(): void
    {
        $this->actingAsAdmin();

        DB::table('feature_flags')->insert([
            'id' => (string) Str::uuid(),
            'key' => 'test_flag',
            'name' => 'Test Flag',
            'description' => 'fixture',
            'is_enabled' => true,
            'default_value' => false,
            'conditions' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Warm the flag cache, then toggle — the write must show immediately.
        $this->getJson('/api/admin/feature-flags')
            ->assertOk()
            ->assertJsonPath('data.0.enabled', true);

        $this->putJson('/api/admin/feature-flags/test_flag', ['enabled' => false])
            ->assertOk()
            ->assertJsonFragment(['message' => "Feature flag 'test_flag' disabled"]);

        $flags = collect($this->getJson('/api/admin/feature-flags')->json('data'));
        $flag = $flags->firstWhere('key', 'test_flag');
        $this->assertNotNull($flag);
        // json() decodes to associative arrays — access as array, not object.
        $this->assertFalse((bool) $flag['enabled']);

        // Unknown keys answer 404 and never auto-create rows.
        $before = DB::table('feature_flags')->count();
        $this->putJson('/api/admin/feature-flags/' . Str::random(12), ['enabled' => true])
            ->assertStatus(404)
            ->assertJsonFragment(['message' => 'Feature flag not found']);
        $this->assertSame($before, DB::table('feature_flags')->count());
    }

    public function test_administrator_manages_settings_while_other_admin_roles_are_denied(): void
    {
        // administrator holds settings.* in the role matrix → full CRUD.
        $admin = $this->createUser();
        $this->assignRole($admin, 'administrator');
        $this->actingAs($admin, 'sanctum');

        $this->getJson('/api/admin/settings')->assertOk();
        $this->putJson('/api/admin/settings', [
            'settings' => [['key' => 'admin_can_write', 'value' => 'yes']],
        ])->assertOk();
        $this->assertDatabaseHas('system_settings', ['key' => 'admin_can_write', 'value' => 'yes']);
        $this->deleteJson('/api/admin/settings/admin_can_write')->assertOk();

        // content_manager has no settings permission.
        $content = $this->createUser();
        $this->assignRole($content, 'content_manager');
        $this->app['auth']->forgetGuards();
        $this->actingAs($content, 'sanctum');
        $this->getJson('/api/admin/settings')->assertStatus(403);

        // Guests are rejected before policy evaluation.
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/admin/settings')->assertStatus(401);
    }

    public function test_settings_and_system_pages_open_for_administrator_only(): void
    {
        $admin = $this->createUser();
        $this->assignRole($admin, 'administrator');

        $this->actingAs($admin, 'web')->get('/admin/settings')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('admin/AdminSettings'));
        $this->actingAs($admin, 'web')->get('/admin/system')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('admin/System'));

        // security_admin keeps settings.overview.view (read) but is not on
        // the route and does not hold settings.system.update → no dead nav
        // link, and the page denies with the web convention.
        $security = $this->createUser();
        $this->assignRole($security, 'security_admin');
        $this->actingAs($security, 'web')->get('/admin/settings')
            ->assertStatus(302);

        $platform = $this->createUser();
        $this->assignRole($platform, 'platform_ops');
        $this->actingAs($platform, 'web')->get('/admin/settings')
            ->assertStatus(302)
            ->assertSessionHas('error');

        // super_admin keeps full access.
        $this->actingAs($this->createAdmin(), 'web')->get('/admin/settings')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('admin/AdminSettings'));
    }

    public function test_nav_settings_entry_permission_matches_the_route_roles(): void
    {
        // The Settings nav entry declares settings.system.update: exactly the
        // roles on the /admin/settings route must hold it (no dead links in
        // either direction). Mirrors ConsoleNavPermissionTest at page level.
        $routeRoles = ['super_admin', 'administrator'];

        foreach ($routeRoles as $role) {
            $user = User::factory()->create();
            \App\Models\UserRole::create(['user_id' => $user->id, 'role' => $role]);
            $this->assertTrue(
                $user->hasPermission('settings.system.update'),
                "{$role} must hold the nav-declared permission settings.system.update",
            );
        }

        $denied = ['security_admin', 'content_manager', 'platform_ops'];
        foreach ($denied as $role) {
            $user = User::factory()->create();
            \App\Models\UserRole::create(['user_id' => $user->id, 'role' => $role]);
            $this->assertFalse(
                $user->hasPermission('settings.system.update'),
                "{$role} must not see the Settings nav entry",
            );
        }
    }
}
