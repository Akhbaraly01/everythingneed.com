import { beforeEach, describe, expect, it } from 'vitest';
import { setGoogleLanguage } from '@/lib/auto-translate/google';

/**
 * The website widget listens on the document, so the change event the
 * switcher dispatches must bubble - a non-bubbling event left the page
 * untranslated.
 */
function mountCombo(): HTMLSelectElement {
    const select = document.createElement('select');
    select.className = 'goog-te-combo';

    for (const code of ['', 'en', 'es', 'fr', 'ar']) {
        const option = document.createElement('option');
        option.value = code;
        select.appendChild(option);
    }

    document.body.appendChild(select);

    return select;
}

describe('setGoogleLanguage', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    });

    it('drives the widget combo with a bubbling change event', () => {
        const combo = mountCombo();
        const seen: string[] = [];

        document.addEventListener('change', (event) => {
            seen.push((event.target as HTMLSelectElement).value);
        });

        setGoogleLanguage('es', 'en');

        expect(combo.value).toBe('es');
        expect(seen).toEqual(['es']);
    });

    it('re-translates an unchanged selection when forced', () => {
        const combo = mountCombo();
        const seen: string[] = [];

        document.addEventListener('change', (event) => {
            seen.push((event.target as HTMLSelectElement).value);
        });

        setGoogleLanguage('es', 'en');
        seen.length = 0;

        setGoogleLanguage('es', 'en', true);

        // Reset to the idle state first, then pick the language again so
        // the widget re-runs over freshly rendered content.
        expect(seen).toEqual(['', 'es']);
        expect(combo.value).toBe('es');
    });

    it('stores the selection in the googtrans cookie', () => {
        mountCombo();

        setGoogleLanguage('fr', 'en');

        expect(document.cookie).toContain('googtrans=/en/fr');
    });

    it('clears the cookie when the source locale is picked', () => {
        mountCombo();

        setGoogleLanguage('fr', 'en');
        setGoogleLanguage('en', 'en');

        expect(document.cookie).not.toContain('googtrans=/en/fr');
    });
});
