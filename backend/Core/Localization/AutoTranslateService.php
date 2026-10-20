<?php

namespace Core\Localization;

use Core\Localization\Contracts\TranslationProviderInterface;
use Core\Services\Contracts\LanguageRegistryInterface;
use Illuminate\Support\Facades\Cache;

/**
 * Whole-page translation proxy application service (Path B).
 *
 * Text is cached per (target, source, text) so repeated page views and
 * Inertia revisits never call the provider twice. The browser sends one
 * chunk at a time; this service deduplicates within the chunk too.
 */
class AutoTranslateService
{
    private const CACHE_PREFIX = 'auto-translate:';

    public function __construct(
        private readonly TranslationProviderInterface $provider,
        private readonly LanguageRegistryInterface $registry,
    ) {
    }

    public function engine(): string
    {
        $engine = (string) config('auto_translate.engine', 'off');

        return in_array($engine, ['auto', 'proxy', 'google', 'off'], true) ? $engine : 'off';
    }

    public function enabled(): bool
    {
        return in_array($this->engine(), ['auto', 'proxy'], true) && $this->provider->configured();
    }

    public function supports(string $target): bool
    {
        return $this->registry->enabledCode($target);
    }

    /**
     * @param list<string> $texts
     * @return list<string>
     */
    public function translate(array $texts, string $target): array
    {
        $texts = array_values($texts);

        if ($texts === []) {
            return [];
        }

        $target = strtolower($target);
        $source = $this->source();
        $ttl = max(60, (int) config('auto_translate.cache_ttl', 2592000));

        $resolved = [];

        foreach (array_unique($texts) as $text) {
            $cached = Cache::get($this->cacheKey($target, $source, $text));

            if (is_string($cached)) {
                $resolved[$text] = $cached;
            }
        }

        $missing = array_values(array_filter(
            array_unique($texts),
            static fn (string $text): bool => ! array_key_exists($text, $resolved),
        ));

        if ($missing !== []) {
            $translations = $this->provider->translate($missing, $target, $source);

            if (count($translations) !== count($missing)) {
                throw new TranslationProviderUnavailable('Provider returned a mismatched translation count.');
            }

            foreach ($missing as $index => $text) {
                $value = (string) ($translations[$index] ?? $text);

                Cache::put($this->cacheKey($target, $source, $text), $value, $ttl);
                $resolved[$text] = $value;
            }
        }

        return array_map(static fn (string $text): string => $resolved[$text] ?? $text, $texts);
    }

    private function source(): ?string
    {
        $source = config('auto_translate.source');
        $source = is_string($source) ? strtolower(trim($source)) : '';

        return $source !== '' && $this->registry->enabledCode($source) ? $source : null;
    }

    private function cacheKey(string $target, ?string $source, string $text): string
    {
        return self::CACHE_PREFIX.sha1($target.'|'.($source ?? 'auto').'|'.$text);
    }
}
