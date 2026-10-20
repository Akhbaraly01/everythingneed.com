import i18next, { type i18n as I18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

/**
 * i18next bootstrap for EverythingNeed (multilingual Phase 0).
 *
 * The server resolves the locale (cookie > account > Accept-Language >
 * default), exports lang/ translations as versioned JSON bundles
 * (`php artisan i18n:export`), and shares a small first-paint payload
 * (fallback + active `common` namespace). Bundles are cached forever by
 * URL (the path carries the content-hash version), so switching back to
 * a language costs no network round-trip.
 *
 * This module owns the single i18next instance plus the runtime locale
 * registry snapshot; the React layer lives in lib/i18n.tsx.
 */

export interface LocaleMeta {
    code: string;
    name: string;
    native: string;
    dir: 'ltr' | 'rtl';
    intl: string;
    flag: string | null;
}

export interface I18nBoot {
    /** Server-resolved locale for this request. */
    locale: string;
    /** How the server chose it: cookie|user|header|default. */
    localeSource: string;
    /** Registry fallback locale (usually 'en'). */
    fallback: string;
    /** Export version (cache key); 'dev' before the first i18n:export. */
    version: string;
    /** Enabled locales from the admin-managed registry. */
    availableLocales: LocaleMeta[];
    /** First-paint dictionaries: locale -> namespace -> tree. */
    bootTranslations: Record<string, Record<string, Record<string, unknown>>>;
}

const FALLBACK_DEFAULT = 'en';

let ready = false;
let bundleVersion = 'dev';
let currentLocale = FALLBACK_DEFAULT;
let fallbackLocale = FALLBACK_DEFAULT;
let registry: LocaleMeta[] = [];

/**
 * i18next backend that streams the versioned JSON bundles exported by
 * `php artisan i18n:export`. A missing bundle (e.g. `dev` before the
 * first export) resolves as "not found" so i18next falls back to the
 * boot translations / fallback locale without spamming the console.
 */
const BundleBackend = {
    type: 'backend' as const,
    init() {
        // No configuration needed; the version lives in module state.
    },
    read(
        language: string,
        namespace: string,
        callback: (error: Error | null, data: unknown) => void,
    ): void {
        if (typeof fetch !== 'function' || bundleVersion === 'dev') {
            callback(null, false);
            return;
        }

        fetch(
            `/i18n/${encodeURIComponent(bundleVersion)}/${encodeURIComponent(language)}/${encodeURIComponent(namespace)}.json`,
            { headers: { Accept: 'application/json' }, credentials: 'same-origin' },
        )
            .then((response) => (response.ok ? response.json() : null))
            .then((data) => callback(null, data ?? false))
            .catch(() => callback(null, false));
    },
};

/** Initialize the singleton instance (call once, before first render). */
export function initI18n(boot: I18nBoot): I18nInstance {
    registry = Array.isArray(boot.availableLocales) ? boot.availableLocales : [];
    fallbackLocale = boot.fallback || FALLBACK_DEFAULT;
    bundleVersion = boot.version || 'dev';
    currentLocale = boot.locale || fallbackLocale;

    if (!ready) {
        ready = true;
        i18next
            .use(initReactI18next)
            .use(BundleBackend)
            .init({
                lng: currentLocale,
                fallbackLng: fallbackLocale,
                defaultNS: 'common',
                ns: ['common'],
                resources: boot.bootTranslations ?? {},
                // Boot translations are only a first-paint head start:
                // without this flag i18next treats the provided
                // resources as the complete bundle and never asks the
                // backend for other locales (switching to fr would
                // silently keep rendering en fallbacks).
                partialBundledLanguages: true,
                initImmediate: false,
                returnNull: false,
                interpolation: { escapeValue: false },
                react: { useSuspense: false },
            });
    }

    return i18next;
}

/** True once initI18n ran (translate() is a no-op before that). */
export function isI18nReady(): boolean {
    return ready;
}

export function getI18n(): I18nInstance {
    return i18next;
}

/** Enabled locales in registry order (empty before init). */
export function getAvailableLocales(): LocaleMeta[] {
    return registry;
}

export function getFallbackLocale(): string {
    return fallbackLocale;
}

export function getCurrentLocale(): string {
    return currentLocale;
}

/** Text direction for a code; LTR for anything unknown. */
export function dirFor(code: string): 'ltr' | 'rtl' {
    return registry.find((meta) => meta.code === code)?.dir === 'rtl' ? 'rtl' : 'ltr';
}

/** BCP 47 tag for Intl formatting (dates, numbers, currency). */
export function intlFor(code: string): string {
    return registry.find((meta) => meta.code === code)?.intl || code || FALLBACK_DEFAULT;
}

/**
 * Normalize a user-supplied value to a known registry code:
 * case-insensitive, accepts BCP 47 variants ('en-US' -> 'en').
 * Returns null when it maps to nothing.
 */
export function normalizeToKnown(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null;
    }

    const candidate = value.trim().toLowerCase();

    if (candidate === '') {
        return null;
    }

    const codes = registry.map((meta) => meta.code);

    if (codes.includes(candidate)) {
        return candidate;
    }

    const primary = candidate.split(/[-_]/)[0];

    return codes.includes(primary) ? primary : null;
}

/**
 * Switch the shared i18next instance (loads bundles on demand, keeps
 * the resolved choice for intlFor/dirFor consumers).
 */
export async function changeI18nLanguage(code: string): Promise<void> {
    currentLocale = code;

    if (!ready || i18next.language === code) {
        return;
    }

    try {
        await i18next.changeLanguage(code);
    } catch {
        // Bundle fetch failures fall back to the boot translations.
    }
}
