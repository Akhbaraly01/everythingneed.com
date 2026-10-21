<?php

/**
 * Whole-page machine translation.
 *
 * The curated lang/{locale} dictionaries still provide the first paint.
 * On top of that the selected language converts the ENTIRE page (DB
 * content: menus, CMS banners, category and product titles) through
 * one of two engines.
 *
 * engine:
 *   auto   - proxy when a provider is configured, otherwise google
 *   proxy  - POST /api/i18n/auto-translate -> configured provider
 *   google - Google Translate Website Widget (Path A, no backend)
 *   off    - disable the auto-translate layer
 *
 * `auto` is the default so the page is always fully translated: with a
 * provider configured the server proxy does the work (cached, no
 * third-party script); without one the Google widget takes over.
 *
 * `source` is null by default: the UI dictionary may already have
 * rendered the page in the target locale, so providers auto-detect.
 */
return [

    'engine' => env('AUTO_TRANSLATE_ENGINE', 'auto'),

    'provider' => env('AUTO_TRANSLATE_PROVIDER', 'libretranslate'),

    'source' => env('AUTO_TRANSLATE_SOURCE') ?: null,

    'cache_ttl' => (int) env('AUTO_TRANSLATE_CACHE_TTL', 60 * 60 * 24 * 30),

    // Hard request caps; the client chunks below these.
    'max_texts' => 60,
    'max_chars' => 6000,
    'max_text_length' => 1000,

    'throttle' => env('AUTO_TRANSLATE_THROTTLE', '120,1'),

    'libretranslate' => [
        'endpoint' => rtrim((string) env('LIBRETRANSLATE_URL', ''), '/'),
        'api_key' => (string) env('LIBRETRANSLATE_API_KEY', ''),
    ],

    'deepl' => [
        'endpoint' => rtrim((string) env('DEEPL_ENDPOINT', 'https://api-free.deepl.com'), '/'),
        'api_key' => (string) env('DEEPL_API_KEY', ''),
    ],

    'google' => [
        'endpoint' => rtrim((string) env('GOOGLE_TRANSLATE_ENDPOINT', 'https://translation.googleapis.com'), '/'),
        'api_key' => (string) env('GOOGLE_TRANSLATE_API_KEY', ''),
    ],
];
