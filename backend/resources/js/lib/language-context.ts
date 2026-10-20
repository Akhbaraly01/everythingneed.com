import { createContext } from 'react';
import type { LocaleMeta } from '@/lib/i18n-config';
import { DEFAULT_LANGUAGE, translate, type TranslateOptions } from '@/lib/i18n-dict';

export interface LanguageContextValue {
    language: string;
    setLanguage: (language: string) => void;
    t: (key: string, options?: TranslateOptions) => string;
    /** Enabled locales from the admin-managed registry (picker source). */
    availableLocales: LocaleMeta[];
    /** Text direction of the active language. */
    dir: 'ltr' | 'rtl';
}

export const LanguageContext = createContext<LanguageContextValue>({
    language: DEFAULT_LANGUAGE,
    setLanguage: () => null,
    t: (key: string, options?: { defaultValue?: string }) =>
        translate(DEFAULT_LANGUAGE, key, options),
    availableLocales: [],
    dir: 'ltr',
});
