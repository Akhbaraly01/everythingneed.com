<?php

namespace Core\Localization\Providers;

use Core\Localization\Contracts\TranslationProviderInterface;
use Core\Localization\TranslationProviderUnavailable;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Google Cloud Translation (v2, API key) adapter.
 */
class GoogleCloudTranslationProvider implements TranslationProviderInterface
{
    public function configured(): bool
    {
        return (string) config('auto_translate.google.api_key', '') !== '';
    }

    public function translate(array $texts, string $target, ?string $source = null): array
    {
        if (! $this->configured()) {
            throw new TranslationProviderUnavailable('GOOGLE_TRANSLATE_API_KEY is not configured.');
        }

        if ($texts === []) {
            return [];
        }

        $payload = [
            'q' => array_values($texts),
            'target' => $target,
            'format' => 'text',
        ];

        if ($source) {
            $payload['source'] = $source;
        }

        try {
            $response = Http::acceptJson()
                ->timeout(20)
                ->post(
                    rtrim((string) config('auto_translate.google.endpoint'), '/')
                        .'/language/translate/v2?key='.urlencode((string) config('auto_translate.google.api_key')),
                    $payload,
                );

            if (! $response->successful()) {
                throw new TranslationProviderUnavailable(
                    'Google Translate responded with HTTP '.$response->status().'.'
                );
            }

            $translations = $response->json('data.translations');

            if (! is_array($translations) || count($translations) !== count($texts)) {
                throw new TranslationProviderUnavailable('Google Translate returned an unexpected payload.');
            }

            return array_map(
                static fn ($entry): string => html_entity_decode(
                    (string) (is_array($entry) ? ($entry['translatedText'] ?? '') : ''),
                    ENT_QUOTES | ENT_HTML5,
                    'UTF-8',
                ),
                array_values($translations),
            );
        } catch (TranslationProviderUnavailable $e) {
            throw $e;
        } catch (Throwable $e) {
            throw new TranslationProviderUnavailable('Google Translate request failed: '.$e->getMessage(), 0, $e);
        }
    }
}
