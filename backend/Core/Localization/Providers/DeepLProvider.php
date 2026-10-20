<?php

namespace Core\Localization\Providers;

use Core\Localization\Contracts\TranslationProviderInterface;
use Core\Localization\TranslationProviderUnavailable;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * DeepL API adapter (Free or Pro endpoint, configurable).
 *
 * The form body is built manually because DeepL expects repeated
 * `text` fields, not PHP's indexed array encoding.
 */
class DeepLProvider implements TranslationProviderInterface
{
    public function configured(): bool
    {
        return (string) config('auto_translate.deepl.api_key', '') !== '';
    }

    public function translate(array $texts, string $target, ?string $source = null): array
    {
        if (! $this->configured()) {
            throw new TranslationProviderUnavailable('DEEPL_API_KEY is not configured.');
        }

        if ($texts === []) {
            return [];
        }

        $fields = [];

        foreach ($texts as $text) {
            $fields[] = 'text='.rawurlencode($text);
        }

        $fields[] = 'target_lang='.rawurlencode($this->targetLanguage($target));

        if ($source) {
            $fields[] = 'source_lang='.rawurlencode(strtoupper($source));
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'DeepL-Auth-Key '.config('auto_translate.deepl.api_key'),
            ])
                ->timeout(20)
                ->withBody(implode('&', $fields), 'application/x-www-form-urlencoded')
                ->post(rtrim((string) config('auto_translate.deepl.endpoint'), '/').'/v2/translate');

            if (! $response->successful()) {
                throw new TranslationProviderUnavailable(
                    'DeepL responded with HTTP '.$response->status().'.'
                );
            }

            $translations = $response->json('translations');

            if (! is_array($translations) || count($translations) !== count($texts)) {
                throw new TranslationProviderUnavailable('DeepL returned an unexpected payload.');
            }

            return array_map(
                static fn ($entry): string => (string) (is_array($entry) ? ($entry['text'] ?? '') : ''),
                array_values($translations),
            );
        } catch (TranslationProviderUnavailable $e) {
            throw $e;
        } catch (Throwable $e) {
            throw new TranslationProviderUnavailable('DeepL request failed: '.$e->getMessage(), 0, $e);
        }
    }

    private function targetLanguage(string $target): string
    {
        return match (strtolower($target)) {
            'pt' => 'PT-PT',
            'zh' => 'ZH',
            default => strtoupper($target),
        };
    }
}
