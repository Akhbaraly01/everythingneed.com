import {
    dirFor,
    getAvailableLocales,
    getFallbackLocale,
    isI18nReady,
    getI18n,
    normalizeToKnown,
} from '@/lib/i18n-config';

/**
 * Language helpers for the storefront chrome.
 *
 * Phase 0 of the multilingual system moved the dictionaries out of the
 * bundle: `lang/{locale}/*.php` is the source of truth, exported to
 * versioned JSON bundles (`php artisan i18n:export`) and consumed by
 * i18next (see lib/i18n-config.ts). This module keeps the historical
 * helper surface — guards, normalization, storage — but every answer
 * now comes from the runtime registry snapshot and the i18next
 * instance, so adding a language in the admin console needs no code
 * change here.
 *
 * Coverage rule: every locale carries every key in lang/; translate()
 * falls back to the fallback locale (en) and finally to the raw key.
 */

export const LANGUAGE_STORAGE_KEY = 'everythingneed-language';

/** Long-lived cookie every request reads (mirrors the explicit choice). */
export const LANGUAGE_COOKIE = 'locale';

export const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const DEFAULT_LANGUAGE = 'en';

/** True when the value is an enabled locale in the registry. */
export function isLanguage(value: unknown): value is string {
    return normalizeToKnown(value) !== null;
}

/** Normalize any value to a known locale, or the fallback. */
export function normalizeLanguage(value: unknown): string {
    return normalizeToKnown(value) ?? getFallbackLocale();
}

export function isRtl(language: string): boolean {
    return dirFor(language) === 'rtl';
}

/** Enabled locale codes, registry order (header/settings pickers). */
export function getLanguages(): string[] {
    return getAvailableLocales().map((meta) => meta.code);
}

/**
 * Translate a chrome key for a language. Missing entries fall back to
 * the fallback locale via i18next; unknown keys resolve to the provided
 * defaultValue (or the key) so late-added chunks can ship before their
 * dictionaries do.
 */
/** translate()/t() options: defaultValue plus optional i18next interpolation params. */
export type TranslateOptions = { defaultValue?: string } & Record<string, unknown>;

export function translate(
    language: string,
    key: string,
    options?: TranslateOptions,
): string {
    if (!isI18nReady()) {
        return options?.defaultValue ?? key;
    }

    try {
        const value = getI18n().getFixedT(language)(key, options);

        return typeof value === 'string' && value !== '' && value !== key
            ? value
            : (options?.defaultValue ?? key);
    } catch {
        return options?.defaultValue ?? key;
    }
}

/** Raw stored guest choice (unvalidated), or null. */
export function storedLanguage(): unknown {
    try {
        return localStorage.getItem(LANGUAGE_STORAGE_KEY);
    } catch {
        return null;
    }
}

export function persistLanguage(language: string): void {
    try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
        // Private-mode storage failure must not break rendering.
    }
}

/** Mirror the choice into the cookie SetLocale reads (guests included). */
export function syncLanguageCookie(language: string): void {
    try {
        document.cookie = `${LANGUAGE_COOKIE}=${encodeURIComponent(language)};path=/;max-age=${LANGUAGE_COOKIE_MAX_AGE};samesite=lax`;
    } catch {
        // Non-DOM renderers (tests) have no document.
    }
}

/** Validated locale from the explicit cookie, or null. */
export function languageFromCookie(): string | null {
    try {
        const match = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);

        return match ? normalizeToKnown(decodeURIComponent(match[1])) : null;
    } catch {
        return null;
    }
}

/**
 * Boot-time conflict resolution (mirrors the pre-paint script and the
 * server precedence):
 *
 *  - explicit server signals (cookie/user) always win;
 *  - the guest's stored choice wins over an implicit server answer
 *    (header/default), because it is an explicit selection the cookie
 *    just has not caught up with yet;
 *  - otherwise the server locale stands.
 */
export function resolveBootLocale(
    serverLocale: unknown,
    source: unknown,
    stored: unknown,
): string {
    const server = normalizeToKnown(serverLocale) ?? getFallbackLocale();
    const local = normalizeToKnown(stored);

    if (local === null) {
        return server;
    }

    if (source === 'cookie' || source === 'user') {
        return server;
    }

    return local;
}
