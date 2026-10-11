import { describe, expect, it } from 'vitest';
import {
    DEFAULT_LANGUAGE,
    LANGUAGE_STORAGE_KEY,
    isLanguage,
    normalizeLanguage,
    persistLanguage,
    storedLanguage,
    translate,
} from '@/lib/i18n-dict';

describe('language guards', () => {
    it('accepts only the offered languages', () => {
        expect(isLanguage('en')).toBe(true);
        expect(isLanguage('es')).toBe(true);
        expect(isLanguage('de')).toBe(false);
        expect(isLanguage(7)).toBe(false);
    });

    it('normalizes unknown values back to English', () => {
        expect(normalizeLanguage('fr')).toBe('fr');
        expect(normalizeLanguage('xx')).toBe(DEFAULT_LANGUAGE);
    });
});

describe('translate', () => {
    it('returns the localized string per language', () => {
        expect(translate('en', 'nav.home')).toBe('Home');
        expect(translate('es', 'nav.home')).toBe('Inicio');
        expect(translate('fr', 'common.save')).toBe('Enregistrer');
    });

    it('falls back to English then to the raw key', () => {
        // Unknown keys resolve to the raw key in every language.
        expect(translate('es', 'only.english.key')).toBe(
            translate('en', 'only.english.key')
        );
        expect(translate('en', 'totally.unknown.key')).toBe(
            'totally.unknown.key'
        );
    });
});

describe('stored language', () => {
    it('round-trips through localStorage with an English default', () => {
        expect(storedLanguage()).toBe(DEFAULT_LANGUAGE);
        persistLanguage('fr');
        expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('fr');
        expect(storedLanguage()).toBe('fr');
        localStorage.removeItem(LANGUAGE_STORAGE_KEY);
        expect(storedLanguage()).toBe(DEFAULT_LANGUAGE);
    });
});
