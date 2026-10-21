import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import {
    changeDictionaryLanguage,
    changeI18nLanguage,
    dirFor,
    getI18n,
    initI18n,
    isI18nReady,
    setCurrentLocale,
    type I18nBoot,
} from '@/lib/i18n-config';
import {
    normalizeLanguage,
    persistLanguage,
    resolveBootLocale,
    storedLanguage,
    syncLanguageCookie,
    translate,
    type TranslateOptions,
} from '@/lib/i18n-dict';
import { LanguageContext } from '@/lib/language-context';

/**
 * Storefront language provider (multilingual Phase 0).
 *
 * Boot: the server already resolved the locale (cookie > account >
 * Accept-Language > default), rendered the document with the right
 * lang/dir attributes and shipped the first-paint dictionaries; the
 * pre-paint script mirrored any guest localStorage choice into the
 * cookie. resolveBootLocale() reconciles the remaining edge (an
 * explicit stored choice the cookie had not caught up with) and the
 * provider then pushes that choice to the server so account + session
 * agree.
 *
 * Mid-session: setLanguage() updates i18next, localStorage, the
 * `locale` cookie and POSTs /locale (which persists the choice to the
 * account for signed-in users). Switching back is instant — bundles
 * are cached by content-hash URL.
 */

/** Best-effort account/session sync; the transport stores already agree. */
async function pushLocaleToServer(language: string): Promise<void> {
    try {
        const token =
            document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

        await fetch('/locale', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN': token,
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({ locale: language }),
        });
    } catch {
        // Offline/throttled sync is non-fatal: cookie + localStorage
        // already carry the explicit choice for the next request.
    }
}

export function LanguageProvider({
    boot,
    initialLanguage,
    children,
}: {
    /** Server boot payload; absent in unit tests. */
    boot?: I18nBoot;
    /** Legacy prop (preferences.language) used when boot is absent. */
    initialLanguage?: unknown;
    children: React.ReactNode;
}) {
    useMemo(() => {
        if (boot) {
            initI18n(boot);
        }
    }, [boot]);

    const [language, setLanguageState] = useState(() =>
        resolveBootLocale(
            boot?.locale ?? initialLanguage,
            boot?.localeSource,
            storedLanguage(),
        ),
    );

    /**
     * Google widget mode: the widget translates the whole document
     * (chrome + database content) in one pass, so the dictionary must
     * keep rendering the source language. Pre-translating the chrome
     * here would make the widget translate Spanish into Arabic.
     */
    const widgetMode = boot?.autoTranslate?.engine === 'google';
    const sourceLanguage = boot?.autoTranslate?.source || boot?.fallback || 'en';
    const dictionaryLanguage = widgetMode ? sourceLanguage : language;

    // Locale bundles arrive asynchronously (i18next backend); context
    // consumers translate during render, so the context value must
    // change identity once a language finishes loading — otherwise the
    // chrome keeps the previous (fallback) strings until some unrelated
    // state change.
    const [i18nRevision, bumpI18nRevision] = useReducer((tick: number) => tick + 1, 0);

    useEffect(() => {
        if (!isI18nReady()) {
            return;
        }

        const i18n = getI18n();
        const onChanged = () => bumpI18nRevision();

        i18n.on('languageChanged', onChanged);
        i18n.on('loaded', onChanged);

        return () => {
            i18n.off('languageChanged', onChanged);
            i18n.off('loaded', onChanged);
        };
    }, []);

    // Reconcile the boot decision once: an explicit stored choice that
    // differs from the server answer is persisted everywhere so the next
    // request (and the account, when signed in) agrees. An implicit
    // server answer (header/default) never writes the cookie itself —
    // otherwise first visits would pin a cookie that outranks a later
    // stored guest choice (and silences the pre-paint sync).
    useEffect(() => {
        if (!boot) {
            return;
        }

        if (language !== boot.locale) {
            syncLanguageCookie(language);
            void pushLocaleToServer(language);
        }
        // Boot reconciliation only; later changes flow through setLanguage.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const setLanguage = useCallback((next: unknown) => {
        const resolved = normalizeLanguage(next);

        setLanguageState(resolved);
        persistLanguage(resolved);
        syncLanguageCookie(resolved);
        // The dictionary/current locale follow in the effect below so the
        // widget mode can keep rendering the source language.
        void pushLocaleToServer(resolved);
    }, []);

    // Identity depends on the bundle revision too: memos keyed on t()
    // (Home feedSections, TripleBanner banners, ...) must recompute when
    // an async locale bundle lands, not only when the language code flips
    // (at which point the new strings have not loaded yet).
    // options (defaultValue) must flow through: late-added chunks pass
    // an English default so unknown keys resolve to visible UI text
    // instead of a raw dotted key path.
    const t = useCallback(
        (key: string, options?: TranslateOptions) => translate(dictionaryLanguage, key, options),
        [dictionaryLanguage, i18nRevision],
    );

    // Document attributes + i18next follow the selection (the pre-paint
    // script already did this for first paint).
    useEffect(() => {
        try {
            document.documentElement.lang = language;
            document.documentElement.dir = dirFor(language);
        } catch {
            // Non-DOM renderers (tests) have no document.
        }

        if (widgetMode) {
            // The document locale follows the choice; the dictionary keeps
            // the source language so the widget can translate the page.
            setCurrentLocale(language);
            void changeDictionaryLanguage(sourceLanguage);
        } else {
            void changeI18nLanguage(language);
        }
    }, [language, widgetMode, sourceLanguage]);

    const availableLocales = useMemo(
        () => boot?.availableLocales ?? [],
        [boot],
    );

    const value = useMemo(
        () => ({
            language,
            setLanguage,
            t,
            availableLocales,
            dir: dirFor(language),
            // Identity marker for context consumers when async bundles
            // land; not meant to be read by components.
            revision: i18nRevision,
        }),
        [language, setLanguage, t, availableLocales, i18nRevision],
    );

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}
