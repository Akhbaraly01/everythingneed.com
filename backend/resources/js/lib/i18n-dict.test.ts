import { beforeAll, describe, expect, it } from 'vitest';
import { initI18n, type LocaleMeta } from '@/lib/i18n-config';
import {
    LANGUAGE_STORAGE_KEY,
    isLanguage,
    isRtl,
    languageFromCookie,
    normalizeLanguage,
    persistLanguage,
    resolveBootLocale,
    storedLanguage,
    syncLanguageCookie,
    translate,
} from '@/lib/i18n-dict';

/**
 * Phase 0 rewrite: dictionaries now live in lang/{locale}/common.php and
 * reach the client through the i18next boot payload / exported bundles.
 * These tests pin the helper surface against a fixture boot payload.
 */

const REGISTRY: LocaleMeta[] = [
    { code: 'en', name: 'English', native: 'English', dir: 'ltr', intl: 'en-US', flag: null },
    { code: 'fr', name: 'French', native: 'Français', dir: 'ltr', intl: 'fr-FR', flag: null },
    { code: 'ar', name: 'Arabic', native: 'العربية', dir: 'rtl', intl: 'ar', flag: null },
];

beforeAll(() => {
    initI18n({
        locale: 'en',
        localeSource: 'default',
        fallback: 'en',
        version: 'test',
        availableLocales: REGISTRY,
        bootTranslations: {
            en: {
                common: {
                    nav: { home: 'Home', language: 'Language' },
                    common: { save: 'Save' },
                },
            },
            fr: {
                common: {
                    nav: { home: 'Accueil' },
                    common: { save: 'Enregistrer' },
                },
            },
        },
    });
});

describe('language guards', () => {
    it('accepts only registry locales (BCP 47 and case tolerant)', () => {
        expect(isLanguage('fr')).toBe(true);
        expect(isLanguage('EN')).toBe(true);
        expect(isLanguage('en-US')).toBe(true);
        expect(isLanguage('xx')).toBe(false);
        expect(isLanguage(7)).toBe(false);
    });

    it('marks only RTL scripts from the registry', () => {
        expect(isRtl('ar')).toBe(true);
        expect(isRtl('en')).toBe(false);
        expect(isRtl('xx')).toBe(false);
    });

    it('normalizes unknown values back to the fallback locale', () => {
        expect(normalizeLanguage('fr')).toBe('fr');
        expect(normalizeLanguage('fr-CA')).toBe('fr');
        expect(normalizeLanguage('xx')).toBe('en');
        expect(normalizeLanguage(null)).toBe('en');
    });
});

describe('translate', () => {
    it('returns the localized string per language', () => {
        expect(translate('en', 'nav.home')).toBe('Home');
        expect(translate('fr', 'common.save')).toBe('Enregistrer');
    });

    it('falls back to the fallback locale, then to the raw key', () => {
        // fr carries no nav.language entry -> English value.
        expect(translate('fr', 'nav.language')).toBe('Language');
        expect(translate('en', 'totally.unknown.key')).toBe('totally.unknown.key');
    });
});

describe('stored language', () => {
    it('round-trips through localStorage', () => {
        localStorage.removeItem(LANGUAGE_STORAGE_KEY);
        expect(storedLanguage()).toBeNull();

        persistLanguage('fr');
        expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('fr');
        expect(storedLanguage()).toBe('fr');

        localStorage.removeItem(LANGUAGE_STORAGE_KEY);
    });

    it('round-trips through the locale cookie with validation', () => {
        syncLanguageCookie('fr');
        expect(languageFromCookie()).toBe('fr');

        document.cookie = 'locale=xx;path=/';
        expect(languageFromCookie()).toBeNull();

        document.cookie = 'locale=;path=/;max-age=0';
    });
});

describe('boot locale resolution', () => {
    it('lets an explicit server signal win over the stored choice', () => {
        expect(resolveBootLocale('fr', 'cookie', 'ar')).toBe('fr');
        expect(resolveBootLocale('fr', 'user', 'ar')).toBe('fr');
    });

    it('lets the guest stored choice win over implicit server answers', () => {
        expect(resolveBootLocale('en', 'header', 'fr')).toBe('fr');
        expect(resolveBootLocale('en', 'default', 'fr')).toBe('fr');
    });

    it('uses the server locale when nothing is stored or stored is unknown', () => {
        expect(resolveBootLocale('fr', 'header', null)).toBe('fr');
        expect(resolveBootLocale('fr', 'header', 'xx')).toBe('fr');
        expect(resolveBootLocale('xx', 'default', null)).toBe('en');
    });
});
