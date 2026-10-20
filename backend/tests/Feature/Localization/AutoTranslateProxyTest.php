<?php

namespace Tests\Feature\Localization;

use Core\Localization\Contracts\TranslationProviderInterface;
use Core\Localization\TranslationProviderUnavailable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Path B: server translation proxy. A fake provider keeps the tests
 * offline and proves caching, validation caps, and graceful failure.
 */
class AutoTranslateProxyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();
        config(['auto_translate.engine' => 'proxy']);
    }

    /** Fake provider bound in the container; `calls` records batches. */
    private function fakeProvider(bool $fails = false): object
    {
        $provider = new class ($fails) implements TranslationProviderInterface {
            /** @var list<array{0: list<string>, 1: string, 2: ?string}> */
            public array $calls = [];

            public function __construct(private bool $fails)
            {
            }

            public function configured(): bool
            {
                return true;
            }

            public function translate(array $texts, string $target, ?string $source = null): array
            {
                if ($this->fails) {
                    throw new TranslationProviderUnavailable('offline');
                }

                $this->calls[] = [$texts, $target, $source];

                return array_map(static fn (string $text): string => '['.$target.'] '.$text, $texts);
            }
        };

        $this->app->instance(TranslationProviderInterface::class, $provider);

        return $provider;
    }

    public function test_it_translates_deduplicates_and_caches(): void
    {
        $provider = $this->fakeProvider();

        $payload = ['target' => 'fr', 'texts' => ['Hello', 'World', 'Hello']];

        $this->postJson('/api/i18n/auto-translate', $payload)
            ->assertOk()
            ->assertExactJson(['translations' => ['[fr] Hello', '[fr] World', '[fr] Hello']]);

        $this->assertCount(1, $provider->calls);
        $this->assertSame(['Hello', 'World'], $provider->calls[0][0]);
        $this->assertSame('fr', $provider->calls[0][1]);

        // Second identical request is served from cache.
        $this->postJson('/api/i18n/auto-translate', $payload)->assertOk();
        $this->assertCount(1, $provider->calls);
    }

    public function test_auto_engine_uses_proxy_when_a_provider_is_configured(): void
    {
        $provider = $this->fakeProvider();
        config(['auto_translate.engine' => 'auto']);

        $this->postJson('/api/i18n/auto-translate', ['target' => 'fr', 'texts' => ['Hello']])
            ->assertOk()
            ->assertJsonPath('translations.0', '[fr] Hello');

        $this->assertCount(1, $provider->calls);
    }

    public function test_auto_engine_reports_google_when_no_provider_is_configured(): void
    {
        config([
            'auto_translate.engine' => 'auto',
            'auto_translate.libretranslate.endpoint' => '',
            'auto_translate.deepl.api_key' => '',
            'auto_translate.google.api_key' => '',
        ]);

        $this->get('/login')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('autoTranslate.engine', 'google'));
    }

    public function test_it_rejects_unknown_targets(): void
    {
        $provider = $this->fakeProvider();

        $this->postJson('/api/i18n/auto-translate', ['target' => 'xx', 'texts' => ['Hello']])
            ->assertStatus(422);

        $this->assertSame([], $provider->calls);
    }

    public function test_it_enforces_request_caps(): void
    {
        $provider = $this->fakeProvider();

        config(['auto_translate.max_texts' => 2]);

        $this->postJson('/api/i18n/auto-translate', ['target' => 'fr', 'texts' => ['a', 'b', 'c']])
            ->assertStatus(422)
            ->assertJsonValidationErrors('texts');

        config(['auto_translate.max_chars' => 5]);

        $this->postJson('/api/i18n/auto-translate', ['target' => 'fr', 'texts' => ['hello', 'world']])
            ->assertStatus(422);

        $this->assertSame([], $provider->calls);
    }

    public function test_it_returns_503_when_disabled_or_provider_fails(): void
    {
        $provider = $this->fakeProvider(true);
        config(['auto_translate.engine' => 'off']);

        $this->postJson('/api/i18n/auto-translate', ['target' => 'fr', 'texts' => ['Hello']])
            ->assertStatus(503);

        config(['auto_translate.engine' => 'proxy']);

        $this->postJson('/api/i18n/auto-translate', ['target' => 'fr', 'texts' => ['Hello']])
            ->assertStatus(503)
            ->assertJsonPath('message', 'Translation service is unavailable.');

        $this->assertSame([], $provider->calls);
    }
}
