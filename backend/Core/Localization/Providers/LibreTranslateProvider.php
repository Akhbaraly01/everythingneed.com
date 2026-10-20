<?php

namespace Core\Localization\Providers;

use Core\Localization\Contracts\TranslationProviderInterface;
use Core\Localization\TranslationProviderUnavailable;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * LibreTranslate (self-hosted or hosted) adapter.
 *
 * POST {endpoint}/translate with either `q` as an array (v1.3+) or a
 * single string (older builds). Instances that require an API key get
 * one from config; the public endpoint is not assumed to be free.
 */
class LibreTranslateProvider implements TranslationProviderInterface
{
    public function configured(): bool
    {
        return (string) config('auto_translate.libretranslate.endpoint', '') !== '';
    }

    public function translate(array $texts, string $target, ?string $source = null): array
    {
        if (! $this->configured()) {
            throw new TranslationProviderUnavailable('LIBRETRANSLATE_URL is not configured.');
        }

        if ($texts === []) {
            return [];
        }

        try {
            $batch = $this->request(array_values($texts), $target, $source);

            if ($batch !== null) {
                return $batch;
            }

            // Older builds reject array payloads; translate serially.
            $translations = [];

            foreach ($texts as $text) {
                $single = $this->request([$text], $target, $source);

                if ($single === null) {
                    throw new TranslationProviderUnavailable('LibreTranslate returned an unexpected payload.');
                }

                $translations[] = $single[0];
            }

            return $translations;
        } catch (TranslationProviderUnavailable $e) {
            throw $e;
        } catch (Throwable $e) {
            throw new TranslationProviderUnavailable('LibreTranslate request failed: '.$e->getMessage(), 0, $e);
        }
    }

    /**
     * @param list<string> $texts
     * @return list<string>|null Null when the batch shape is unsupported.
     */
    private function request(array $texts, string $target, ?string $source): ?array
    {
        $endpoint = (string) config('auto_translate.libretranslate.endpoint', '');

        $payload = [
            'q' => count($texts) === 1 ? $texts[0] : $texts,
            'source' => $source ?: 'auto',
            'target' => $target,
            'format' => 'text',
        ];

        $apiKey = (string) config('auto_translate.libretranslate.api_key', '');

        if ($apiKey !== '') {
            $payload['api_key'] = $apiKey;
        }

        $response = Http::acceptJson()
            ->timeout(15)
            ->post($endpoint.'/translate', $payload);

        if (! $response->successful()) {
            throw new TranslationProviderUnavailable(
                'LibreTranslate responded with HTTP '.$response->status().'.'
            );
        }

        $translated = $response->json('translatedText');

        if (is_string($translated)) {
            return [$translated];
        }

        if (is_array($translated) && count($translated) === count($texts)) {
            return array_map(static fn ($value): string => (string) $value, array_values($translated));
        }

        return null;
    }
}
