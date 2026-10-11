<?php

namespace Tests\Feature\Settings;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Settings\Entities\UserSetting;
use Tests\TestCase;

/**
 * Master-plan phases 10 + 13: display preferences are a single round-trip.
 *
 * The settings form writes general.currency / general.language keys; the
 * settings page reads the SAME store (previously it read user_metadata,
 * which is never written, so saved preferences never reloaded), and every
 * Inertia page carries a whitelisted `preferences` shared prop.
 */
class PreferencesTest extends TestCase
{
    use RefreshDatabase;

    public function test_saved_preferences_reload_on_settings_page(): void
    {
        $user = $this->createUser();
        $this->actingAs($user, 'sanctum');

        $this->putJson("/api/users/{$user->id}/settings", [
            'settings' => [
                ['key' => 'general.currency', 'value' => 'GHS'],
                ['key' => 'general.language', 'value' => 'fr'],
            ],
        ])->assertOk();

        $this->get('/account/settings')->assertOk()->assertInertia(fn ($page) => $page
            ->component('settings/Index')
            ->where('settings.currency', 'GHS')
            ->where('settings.language', 'fr')
            ->where('preferences.currency', 'GHS')
            ->where('preferences.language', 'fr'));
    }

    public function test_tampered_preferences_fall_back_safely(): void
    {
        $user = $this->createUser();
        $this->actingAs($user, 'sanctum');

        UserSetting::create(['user_id' => $user->id, 'key' => 'general.currency', 'value' => 'XXX']);
        UserSetting::create(['user_id' => $user->id, 'key' => 'general.language', 'value' => 'xx']);

        // Raw keys keep what was stored...
        $this->assertSame('XXX', UserSetting::where('user_id', $user->id)->where('key', 'general.currency')->value('value'));

        // ...but the shared prop seen by the UI is always safe.
        $this->get('/account/settings')->assertOk()->assertInertia(fn ($page) => $page
            ->where('preferences.currency', 'USD')
            ->where('preferences.language', 'en'));
    }

    public function test_guests_get_safe_default_preferences(): void
    {
        $this->get('/')->assertOk()->assertInertia(fn ($page) => $page
            ->where('preferences.currency', 'USD')
            ->where('preferences.language', 'en'));
    }
}
