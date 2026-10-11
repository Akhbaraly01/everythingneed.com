/**
 * UI localization dictionaries (spec phases 5 + 13).
 *
 * Covers navigation chrome (header, bottom nav fallbacks, search, common
 * actions) in English/Spanish/French - the exact options offered in
 * Settings -> General. Admin-authored content (CMS, DB-driven menus, product
 * data) is never machine-translated and always renders as authored.
 */

export const LANGUAGES = ['en', 'es', 'fr'] as const;
export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'en';

export const LANGUAGE_STORAGE_KEY = 'everythingneed-language';

type Dict = Record<string, string>;

const en: Dict = {
    'nav.home': 'Home',
    'nav.needs': 'Needs',
    'nav.learn': 'Learn',
    'nav.healthcare': 'Healthcare',
    'nav.account': 'Account',
    'nav.searchPlaceholder': 'Search everything...',
    'nav.searchLabel': 'Search everything',
    'nav.signIn': 'Sign in',
    'nav.support': 'Support',
    'nav.cart': 'Open cart',
    'nav.notifications': 'Notifications',
    'nav.notificationsSignIn': 'Sign in for notifications',
    'nav.scan': 'Scan product code',
    'nav.language': 'Language',
    'nav.theme': 'Toggle theme',
    'nav.more': 'More',
    'common.close': 'Close',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.loading': 'Loading...',
};

const es: Dict = {
    'nav.home': 'Inicio',
    'nav.needs': 'Necesidades',
    'nav.learn': 'Aprender',
    'nav.healthcare': 'Salud',
    'nav.account': 'Cuenta',
    'nav.searchPlaceholder': 'Buscar todo...',
    'nav.searchLabel': 'Buscar todo',
    'nav.signIn': 'Iniciar sesión',
    'nav.support': 'Soporte',
    'nav.cart': 'Abrir carrito',
    'nav.notifications': 'Notificaciones',
    'nav.notificationsSignIn': 'Inicia sesión para notificaciones',
    'nav.scan': 'Escanear código',
    'nav.language': 'Idioma',
    'nav.theme': 'Cambiar tema',
    'nav.more': 'Más',
    'common.close': 'Cerrar',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.loading': 'Cargando...',
};

const fr: Dict = {
    'nav.home': 'Accueil',
    'nav.needs': 'Besoins',
    'nav.learn': 'Apprendre',
    'nav.healthcare': 'Santé',
    'nav.account': 'Compte',
    'nav.searchPlaceholder': 'Tout rechercher...',
    'nav.searchLabel': 'Tout rechercher',
    'nav.signIn': 'Se connecter',
    'nav.support': 'Assistance',
    'nav.cart': 'Ouvrir le panier',
    'nav.notifications': 'Notifications',
    'nav.notificationsSignIn': 'Connectez-vous pour les notifications',
    'nav.scan': 'Scanner un code',
    'nav.language': 'Langue',
    'nav.theme': 'Changer de thème',
    'nav.more': 'Plus',
    'common.close': 'Fermer',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.loading': 'Chargement...',
};

const DICTS: Record<Language, Dict> = { en, es, fr };

export function isLanguage(value: unknown): value is Language {
    return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);
}

export function normalizeLanguage(value: unknown): Language {
    return isLanguage(value) ? value : DEFAULT_LANGUAGE;
}

/** Translate a chrome key; unknown keys and missing entries fall back to English. */
export function translate(language: Language, key: string): string {
    return DICTS[language]?.[key] ?? en[key] ?? key;
}

export function storedLanguage(): Language {
    try {
        return normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY));
    } catch {
        return DEFAULT_LANGUAGE;
    }
}

export function persistLanguage(language: Language): void {
    try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
        // Private-mode storage failure must not break rendering.
    }
}
