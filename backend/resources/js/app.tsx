import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ConfirmProvider } from '@/components/shared/ConfirmProvider';
import AutoTranslateBridge from '@/components/i18n/AutoTranslateBridge';
import type { AutoTranslateConfig } from '@/lib/auto-translate';
import { LanguageProvider } from '@/lib/i18n';
import { CurrencyProvider } from '@/lib/currency-provider';
import { persistCurrency, isDisplayCurrency } from '@/lib/currency';
import type { I18nBoot } from '@/lib/i18n-config';
import BootScrollTop from '@/components/BootScrollTop';
import { Toaster } from '@/components/ui/sonner';

const appName = import.meta.env.VITE_APP_NAME || 'EverythingNeed';

// Refresh lands on top: opt out of browser scroll restoration as early as
// possible (module boot, before hydration) so Chrome never races the
// hydration-time scrollTo in useScrollToTopOnReload on long reload pages.
try {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
    }
} catch {
    // Older browsers: the hook's explicit scroll still applies.
}

interface BootPreferences {
    currency?: unknown;
    language?: unknown;
}

function pageProps(props: unknown): Record<string, unknown> {
    return (
        (props as { initialPage?: { props?: Record<string, unknown> } })?.initialPage?.props ?? {}
    );
}

function bootPreferences(props: unknown): BootPreferences {
    return (pageProps(props)['preferences'] ?? {}) as BootPreferences;
}

/** Signed-in user id (account currency persistence); null for guests. */
function authUserId(props: unknown): number | string | null {
    const auth = pageProps(props)['auth'] as { id?: number | string } | undefined;

    if (!auth || (auth.id === undefined || auth.id === null)) {
        return null;
    }

    return auth.id;
}

/**
 * Multilingual Phase 0: the Inertia props the server shares for every
 * page (resolved locale, registry, versions, first-paint dictionaries).
 */
function buildI18nBoot(props: unknown): I18nBoot | undefined {
    const page = pageProps(props);
    const locale = page['locale'];

    if (typeof locale !== 'string' || locale === '') {
        return undefined;
    }

    const fallback = typeof page['fallbackLocale'] === 'string' ? page['fallbackLocale'] : 'en';
    const autoTranslate = (page['autoTranslate'] ?? { engine: 'off', source: null }) as AutoTranslateConfig;

    return {
        locale,
        localeSource: typeof page['localeSource'] === 'string' ? page['localeSource'] : 'default',
        fallback,
        version: typeof page['i18nVersion'] === 'string' ? page['i18nVersion'] : 'dev',
        availableLocales: Array.isArray(page['availableLocales'])
            ? (page['availableLocales'] as I18nBoot['availableLocales'])
            : [],
        bootTranslations: (page['bootTranslations'] ?? {}) as I18nBoot['bootTranslations'],
        autoTranslate: {
            engine: autoTranslate.engine,
            source: autoTranslate.source ?? null,
        },
        // Google widget mode: the dictionary stays in the source language
        // so the widget translates the whole page exactly once.
        dictionaryLocale:
            autoTranslate.engine === 'google'
                ? autoTranslate.source || fallback
                : locale,
    };
}

createInertiaApp({
    title: (title) => title ? `${title} - ${appName}` : appName,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);
        const boot = bootPreferences(props);
        const i18nBoot = buildI18nBoot(props);
        const autoTranslate = (i18nBoot?.autoTranslate ?? {
            engine: 'off',
            source: null,
        }) as AutoTranslateConfig;

        // Authenticated server preferences win at boot (login / reload);
        // guests keep their localStorage choice. Mid-session changes go
        // through the providers + API and persist immediately.
        const userId = authUserId(props);

        try {
            if (userId !== null && isDisplayCurrency(boot.currency)) {
                persistCurrency(boot.currency.toUpperCase() as import('@/lib/currency').DisplayCurrency);
            }
        } catch {
            // Boot preference sync must never break rendering.
        }

        root.render(
            <ThemeProvider defaultTheme="system" storageKey="everythingneed-theme">
                <CurrencyProvider
                    // Only the account preference may override the stored
                    // choice; the server default must not reset a guest's
                    // currency on every page load.
                    initialCurrency={userId !== null ? boot.currency : undefined}
                    userId={userId}
                >
                    <LanguageProvider boot={i18nBoot} initialLanguage={boot.language}>
                        <AutoTranslateBridge config={autoTranslate} />
                        <ConfirmProvider>
                            <BootScrollTop />
                            <App {...props} />
                        </ConfirmProvider>
                        <Toaster />
                    </LanguageProvider>
                </CurrencyProvider>
            </ThemeProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
