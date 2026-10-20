<?php

namespace Tests\Feature\Localization;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Settings\Entities\UserSetting;
use Tests\TestCase;

/**
 * Multilingual Phase 0: POST /locale — the explicit selection endpoint
 * the header menu and settings page call. Guests get the long-lived
 * cookie; signed-in users additionally persist the choice to their
 * account; unknown/disabled locales are rejected.
 */
class LocaleEndpointTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_selection_sets_the_plain_locale_cookie(): void
    {
        $this->postJson('/locale', ['locale' => 'fr'])
            ->assertOk()
            ->assertJsonPath('data.locale', 'fr')
            ->assertJsonPath('data.dir', 'ltr')
            ->assertPlainCookie('locale', 'fr');
    }

    public function test_authenticated_selection_persists_to_the_account(): void
    {
        $user = $this->actingAsUser();

        $this->postJson('/locale', ['locale' => 'de'])
            ->assertOk()
            ->assertJsonPath('data.locale', 'de')
            ->assertPlainCookie('locale', 'de');

        $stored = UserSetting::where('user_id', $user->id)
            ->where('key', 'general.language')
            ->first();

        $this->assertSame('de', $stored?->value);
    }

    public function test_case_and_bcp47_variants_are_normalized(): void
    {
        $this->postJson('/locale', ['locale' => 'FR'])
            ->assertOk()
            ->assertJsonPath('data.locale', 'fr');

        $this->postJson('/locale', ['locale' => 'pt-BR'])
            ->assertOk()
            ->assertJsonPath('data.locale', 'pt');
    }

    public function test_rtl_locale_reports_rtl_direction(): void
    {
        $this->postJson('/locale', ['locale' => 'ar'])
            ->assertOk()
            ->assertJsonPath('data.dir', 'rtl');
    }

    public function test_unknown_locale_is_rejected(): void
    {
        $this->postJson('/locale', ['locale' => 'xx'])
            ->assertStatus(422);
    }

    public function test_missing_locale_is_rejected(): void
    {
        $this->postJson('/locale', [])
            ->assertStatus(422);
    }

    public function test_disabled_locale_is_rejected(): void
    {
        config(['locales.supported.sw.enabled' => false]);

        $this->app->forgetInstance(\Core\Services\Contracts\LanguageRegistryInterface::class);

        $this->postJson('/locale', ['locale' => 'sw'])
            ->assertStatus(422);
    }
}
