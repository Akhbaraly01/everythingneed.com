<?php

namespace Tests\Feature\Localization;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Settings\Entities\UserSetting;
use Tests\TestCase;

/**
 * Multilingual Phase 0: request locale resolution across the full
 * precedence chain (cookie > account > Accept-Language > default) as
 * observed through the Inertia shared props, plus document direction.
 */
class LocaleResolutionTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_resolve_from_accept_language_by_default(): void
    {
        // Symfony's test client sends `Accept-Language: en-us,en;q=0.5`,
        // mimicking a browser: the guest lands on en via negotiation.
        $this->get('/login')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('locale', 'en')
            ->where('localeSource', 'header')
            ->where('dir', 'ltr')
            ->has('availableLocales', 8));
    }

    public function test_guests_fall_back_to_the_configured_locale_without_transport_hints(): void
    {
        $this->withServerVariables(['HTTP_ACCEPT_LANGUAGE' => ''])
            ->get('/login')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('locale', 'en')
                ->where('localeSource', 'default'));
    }

    public function test_accept_language_is_negotiated_when_supported(): void
    {
        $this->withHeader('Accept-Language', 'de-DE,de;q=0.9,en;q=0.5')
            ->get('/login')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('locale', 'de')
                ->where('localeSource', 'header'));
    }

    public function test_unsupported_accept_language_falls_back_to_default(): void
    {
        $this->withHeader('Accept-Language', 'xx-XX,xx;q=0.9')
            ->get('/login')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('locale', 'en')
                ->where('localeSource', 'default'));
    }

    public function test_cookie_beats_accept_language(): void
    {
        $this->withUnencryptedCookie('locale', 'fr')
            ->withHeader('Accept-Language', 'de')
            ->get('/login')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('locale', 'fr')
                ->where('localeSource', 'cookie'));
    }

    public function test_unknown_cookie_is_ignored(): void
    {
        $this->withUnencryptedCookie('locale', 'xx')
            ->withHeader('Accept-Language', 'de')
            ->get('/login')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('locale', 'de')
                ->where('localeSource', 'header'));
    }

    public function test_rtl_locale_reports_rtl_direction(): void
    {
        $this->withUnencryptedCookie('locale', 'ar')
            ->get('/login')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('locale', 'ar')
                ->where('dir', 'rtl'));
    }

    public function test_account_preference_applies_without_a_cookie(): void
    {
        $user = $this->createUser();
        UserSetting::create([
            'user_id' => $user->id,
            'key' => 'general.language',
            'value' => 'fr',
        ]);

        $this->actingAs($user, 'sanctum')
            ->get('/account/settings')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('locale', 'fr')
                ->where('localeSource', 'user'));
    }

    public function test_explicit_cookie_wins_and_syncs_the_account(): void
    {
        $user = $this->createUser();
        UserSetting::create([
            'user_id' => $user->id,
            'key' => 'general.language',
            'value' => 'de',
        ]);

        $this->actingAs($user, 'sanctum')
            ->withUnencryptedCookie('locale', 'fr')
            ->get('/account/settings')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('locale', 'fr')
                ->where('localeSource', 'cookie'));

        // The explicit choice became the account preference.
        $stored = UserSetting::where('user_id', $user->id)
            ->where('key', 'general.language')
            ->first();

        $this->assertSame('fr', $stored?->value);
    }

    public function test_disabled_locale_cookie_is_ignored(): void
    {
        config(['locales.supported.fr.enabled' => false]);

        $this->app->forgetInstance(\Core\Services\Contracts\LanguageRegistryInterface::class);

        $this->withUnencryptedCookie('locale', 'fr')
            ->withHeader('Accept-Language', 'de')
            ->get('/login')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('locale', 'de')
                ->where('localeSource', 'header'));
    }
}
