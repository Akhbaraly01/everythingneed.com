<?php

namespace Tests\Feature\Settings;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Settings\Entities\FeatureFlag;
use Modules\Settings\Entities\UserSetting;
use Tests\TestCase;

class SettingsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_feature_flags_only_enabled(): void
    {
        FeatureFlag::create(['key' => 'on', 'name' => 'On', 'is_enabled' => true, 'default_value' => true]);
        FeatureFlag::create(['key' => 'off', 'name' => 'Off', 'is_enabled' => false, 'default_value' => false]);

        $res = $this->getJson('/api/settings/public');
        $res->assertOk();
        $this->assertArrayHasKey('on', $res->json('data'));
        $this->assertArrayNotHasKey('off', $res->json('data'));
    }

    public function test_self_settings_crud_scoped_to_user(): void
    {
        $me = $this->actingAsUser();
        $other = $this->createUser();
        UserSetting::create(['user_id' => $other->id, 'key' => 'secret', 'value' => 'hide-me']);

        $this->getJson("/api/users/{$me->id}/settings")
            ->assertOk()
            ->assertJsonMissing(['secret' => 'hide-me']);

        $this->putJson("/api/users/{$me->id}/settings", [
            'settings' => [['key' => 'theme', 'value' => 'dark']],
        ])->assertOk();

        $row = \Modules\Settings\Entities\UserSetting::where('user_id', $me->id)->where('key', 'theme')->first();
        $this->assertNotNull($row);
        $this->assertSame('dark', $row->value);

        $this->getJson("/api/users/{$me->id}/settings/theme")
            ->assertOk()
            ->assertJsonPath('data.value', 'dark');

        $this->deleteJson("/api/users/{$me->id}/settings/theme")->assertOk();
        $this->assertSoftDeleted('user_settings', ['user_id' => $me->id, 'key' => 'theme']);
    }

    public function test_cannot_read_or_write_other_users_settings(): void
    {
        $me = $this->createUser();
        $this->assignRole($me, 'user');
        $victim = $this->createUser();
        $this->actingAs($me, 'sanctum');

        $this->getJson("/api/users/{$victim->id}/settings")->assertForbidden();
        $this->putJson("/api/users/{$victim->id}/settings", [
            'settings' => [['key' => 'x', 'value' => 'y']],
        ])->assertForbidden();
        $this->deleteJson("/api/users/{$victim->id}/settings/x")->assertForbidden();
    }

    public function test_system_settings_routes_require_permission(): void
    {
        $this->seed(\Database\Seeders\PermissionSeeder::class);
        \Illuminate\Support\Facades\Cache::forget('rbac.matrix');

        $user = $this->createUser();
        $this->assignRole($user, 'user');
        $this->actingAs($user, 'sanctum');
        $this->getJson('/api/settings')->assertForbidden();
        $this->putJson('/api/settings', ['settings' => [['key' => 'a', 'value' => 'b']]])->assertForbidden();

        $admin = $this->createAdmin();
        $this->actingAs($admin, 'sanctum');
        $this->putJson('/api/settings', ['settings' => [['key' => 'site_name', 'value' => 'EN']]])->assertOk();
        $row = \Modules\Settings\Entities\UserSetting::where('user_id', $admin->id)->where('key', 'site_name')->first();
        $this->assertNotNull($row);
        $this->assertSame('EN', $row->value);
    }

    public function test_guest_cannot_access_private_settings(): void
    {
        $id = \Illuminate\Support\Str::uuid();
        $this->getJson('/api/settings')->assertUnauthorized();
        $this->getJson("/api/users/{$id}/settings")->assertUnauthorized();
    }
}
