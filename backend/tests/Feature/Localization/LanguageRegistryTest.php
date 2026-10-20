<?php

namespace Tests\Feature\Localization;

use Core\Services\Contracts\LanguageRegistryInterface;
use Tests\TestCase;

/**
 * The registry is config-backed: config/locales.php is the single
 * source of truth, with enabled/default overrides for deploy-time
 * control. No database table is involved.
 */
class LanguageRegistryTest extends TestCase
{
    private function registry(): LanguageRegistryInterface
    {
        return app(LanguageRegistryInterface::class);
    }

    public function test_config_locales_are_enabled_in_configured_order(): void
    {
        $this->assertSame(
            ['en', 'es', 'fr', 'pt', 'de', 'ar', 'zh', 'sw'],
            array_keys($this->registry()->enabled()),
        );
    }

    public function test_default_and_fallback_come_from_config(): void
    {
        $this->assertSame('en', $this->registry()->default());
        $this->assertSame('en', $this->registry()->fallback());
        $this->assertTrue((bool) $this->registry()->meta('en')['is_default']);
    }

    public function test_normalize_accepts_case_and_bcp47_variants(): void
    {
        $registry = $this->registry();

        $this->assertSame('en', $registry->normalize('EN'));
        $this->assertSame('en', $registry->normalize('en-US'));
        $this->assertSame('pt', $registry->normalize('pt_BR'));
        $this->assertSame('ar', $registry->normalize('ar'));
        $this->assertNull($registry->normalize('xx'));
        $this->assertNull($registry->normalize(''));
    }

    public function test_metadata_direction_and_intl_are_available(): void
    {
        $registry = $this->registry();

        $this->assertSame('rtl', $registry->dir('ar'));
        $this->assertSame('ltr', $registry->dir('fr'));
        $this->assertSame('pt-PT', $registry->intl('pt'));
        $this->assertSame('sw-KE', $registry->intl('sw'));
        $this->assertSame('Kiswahili', $registry->meta('sw')['native']);
    }

    public function test_config_can_disable_a_locale(): void
    {
        config(['locales.supported.fr.enabled' => false]);
        $this->app->forgetInstance(LanguageRegistryInterface::class);

        $registry = $this->registry();

        $this->assertFalse($registry->enabledCode('fr'));
        $this->assertTrue($registry->has('fr'));
        $this->assertNotContains('fr', array_keys($registry->enabled()));
    }

    public function test_config_can_change_the_default_locale(): void
    {
        config(['locales.default' => 'ar']);
        $this->app->forgetInstance(LanguageRegistryInterface::class);

        $registry = $this->registry();

        $this->assertSame('ar', $registry->default());
        $this->assertTrue((bool) $registry->meta('ar')['is_default']);
        $this->assertFalse((bool) $registry->meta('en')['is_default']);
    }

    public function test_empty_config_falls_back_to_english(): void
    {
        config(['locales.supported' => []]);
        $this->app->forgetInstance(LanguageRegistryInterface::class);

        $registry = $this->registry();

        $this->assertSame([], $registry->all());
        $this->assertSame('en', $registry->default());
        $this->assertFalse($registry->has('en'));
    }
}
