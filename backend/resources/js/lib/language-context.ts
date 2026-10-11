import { createContext } from 'react';
import { DEFAULT_LANGUAGE, translate, type Language } from '@/lib/i18n-dict';

export interface LanguageContextValue {
    language: Language;
    setLanguage: (language: Language) => void;
    t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextValue>({
    language: DEFAULT_LANGUAGE,
    setLanguage: () => null,
    t: (key: string) => translate(DEFAULT_LANGUAGE, key),
});
