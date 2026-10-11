import { useContext } from 'react';
import { LanguageContext } from '@/lib/language-context';

export const useLanguage = () => useContext(LanguageContext);
