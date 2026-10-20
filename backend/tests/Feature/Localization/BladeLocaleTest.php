<?php

namespace Tests\Feature\Localization;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Multilingual Phase 0: the document shell renders the server-resolved
 * locale before any JS runs (lang + dir attributes and the pre-paint
 * locale sync script), so language selection never flashes the wrong
 * language or direction.
 */
class BladeLocaleTest extends TestCase
{
    use RefreshDatabase;

    public function test_document_renders_the_resolved_locale_and_prepaint_sync(): void
    {
        $response = $this->get('/login');

        $response->assertOk();
        $response->assertSee('<html lang="en" dir="ltr">', false);
        $response->assertSee('everythingneed-language', false);
        $response->assertSee('locale=', false);
    }

    public function test_cookie_locale_renders_the_matching_document(): void
    {
        // Plain (unencrypted) cookie: exactly what client JS writes.
        $this->withUnencryptedCookie('locale', 'fr')
            ->get('/login')
            ->assertOk()
            ->assertSee('<html lang="fr" dir="ltr">', false);
    }

    public function test_rtl_locale_renders_dir_rtl(): void
    {
        $this->withUnencryptedCookie('locale', 'ar')
            ->get('/login')
            ->assertOk()
            ->assertSee('<html lang="ar" dir="rtl">', false);
    }
}
