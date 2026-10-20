<?php

/**
 * Language registry — the single source of truth for supported locales.
 *
 * `supported` holds every locale the platform knows how to render. It is
 * the single source of truth: per-entry `enabled` / `guest_enabled`
 * flags and `default` control availability without a database.
 * Core\Localization\LanguageRegistry reads this config directly; the
 * whole-page translator (AutoTranslateBridge) handles DB content.
 *
 * `intl` is the BCP 47 tag used for Intl formatting (dates/numbers/
 * currency) while `code` is the short application locale used in lang
 * file paths and i18next. Keep them separate: `sw` formats as `sw-KE`,
 * `pt` as `pt-PT`, etc.
 *
 * `dir` drives document direction (html `dir` attribute + Tailwind
 * logical properties). Only add 'rtl' for scripts that genuinely
 * mirror.
 *
 * NOTE: the AI gateway language whitelist (Api\AiController) is a
 * separate concern — it lists what the assistant can answer in, not
 * what the UI ships.
 */
return [

    'default' => 'en',

    'fallback' => 'en',

    // Cookie that carries an explicit user selection for guests and for
    // the pre-paint locale script in resources/views/app.blade.php.
    // Not HttpOnly on purpose: the value is non-sensitive and the client
    // reads it to avoid a flash of the wrong language.
    'cookie' => 'locale',

    'cookie_minutes' => 60 * 24 * 365,

    // Filesystem root of the versioned i18next bundles written by
    // `php artisan i18n:export` and read by the Inertia boot payload and
    // the admin export summary. Kept configurable so tests can export to
    // a throwaway directory instead of polluting public/i18n.
    'bundles_path' => env('I18N_BUNDLES_PATH', public_path('i18n')),

    'supported' => [
        'en' => [
            'name' => 'English',
            'native' => 'English',
            'dir' => 'ltr',
            'intl' => 'en-US',
            'flag' => '🇬🇧',
            'fallback' => 'en',
        ],
        'es' => [
            'name' => 'Spanish',
            'native' => 'Español',
            'dir' => 'ltr',
            'intl' => 'es-ES',
            'flag' => '🇪🇸',
            'fallback' => 'en',
        ],
        'fr' => [
            'name' => 'French',
            'native' => 'Français',
            'dir' => 'ltr',
            'intl' => 'fr-FR',
            'flag' => '🇫🇷',
            'fallback' => 'en',
        ],
        'pt' => [
            'name' => 'Portuguese',
            'native' => 'Português',
            'dir' => 'ltr',
            'intl' => 'pt-PT',
            'flag' => '🇵🇹',
            'fallback' => 'en',
        ],
        'de' => [
            'name' => 'German',
            'native' => 'Deutsch',
            'dir' => 'ltr',
            'intl' => 'de-DE',
            'flag' => '🇩🇪',
            'fallback' => 'en',
        ],
        'ar' => [
            'name' => 'Arabic',
            'native' => 'العربية',
            'dir' => 'rtl',
            'intl' => 'ar-EG',
            'flag' => '🇸🇦',
            'fallback' => 'en',
        ],
        'zh' => [
            'name' => 'Chinese',
            'native' => '中文',
            'dir' => 'ltr',
            'intl' => 'zh-CN',
            'flag' => '🇨🇳',
            'fallback' => 'en',
        ],
        'sw' => [
            'name' => 'Kiswahili',
            'native' => 'Kiswahili',
            'dir' => 'ltr',
            'intl' => 'sw-KE',
            'flag' => '🇰🇪',
            'fallback' => 'en',
        ],
    ],
];
