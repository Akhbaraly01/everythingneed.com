import { useCallback, useEffect, useState } from 'react';
import {
    isLanguage,
    isRtl,
    normalizeLanguage,
    persistLanguage,
    storedLanguage,
    translate,
} from '@/lib/i18n-dict';
import { LanguageContext } from '@/lib/language-context';

export function LanguageProvider({
    initialLanguage,
    children,
}: {
    initialLanguage?: unknown;
    children: React.ReactNode;
}) {
    const [language, setLanguageState] = useState(() =>
        normalizeLanguage(initialLanguage ?? storedLanguage()),
    );

    // Server preference wins when it arrives (login / settings save);
    // otherwise the guest's stored choice applies.
    useEffect(() => {
        if (isLanguage(initialLanguage)) {
            setLanguageState(initialLanguage);
            persistLanguage(initialLanguage);
        }
    }, [initialLanguage]);

    const setLanguage = useCallback(
        (next: Parameters<typeof setLanguageState>[0]) => {
            const resolved = typeof next === 'function' ? next(language) : next;
            setLanguageState(resolved);
            persistLanguage(resolved);
        },
        [language],
    );

    const t = useCallback((key: string) => translate(language, key), [language]);

    useEffect(() => {
        try {
            document.documentElement.lang = language;
            // RTL scripts (Arabic) mirror the entire layout globally.
            document.documentElement.dir = isRtl(language) ? 'rtl' : 'ltr';
        } catch {
            // Non-DOM renderers (tests) have no document.
        }
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}
