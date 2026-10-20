import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ConfirmProvider } from '@/components/shared/ConfirmProvider';
import AutoTranslateBridge from '@/components/i18n/AutoTranslateBridge';
import { LanguageProvider } from '@/lib/i18n';
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

    return {
        locale,
        localeSource: typeof page['localeSource'] === 'string' ? page['localeSource'] : 'default',
        fallback: typeof page['fallbackLocale'] === 'string' ? page['fallbackLocale'] : 'en',
        version: typeof page['i18nVersion'] === 'string' ? page['i18nVersion'] : 'dev',
        availableLocales: Array.isArray(page['availableLocales'])
            ? (page['availableLocales'] as I18nBoot['availableLocales'])
            : [],
        bootTranslations: (page['bootTranslations'] ?? {}) as I18nBoot['bootTranslations'],
    };
}

createInertiaApp({
    title: (title) => title ? `${title} - ${appName}` : appName,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);
        const boot = bootPreferences(props);
        const i18nBoot = buildI18nBoot(props);

        // Authenticated server preferences win at boot (login / reload);
        // guests keep their localStorage choice. Mid-session changes go
        // through the providers + API and persist immediately.
        try {
            const authed = Boolean(
                (props as { initialPage?: { props?: Record<string, unknown> } })?.initialPage?.props?.['auth'],
            );
            if (authed && isDisplayCurrency(boot.currency)) {
                persistCurrency(boot.currency.toUpperCase() as import('@/lib/currency').DisplayCurrency);
            }
        } catch {
            // Boot preference sync must never break rendering.
        }

        root.render(
            <ThemeProvider defaultTheme="system" storageKey="everythingneed-theme">
                <LanguageProvider boot={i18nBoot} initialLanguage={boot.language}>
                    <AutoTranslateBridge />
                    <ConfirmProvider>
                        <BootScrollTop />
                        <App {...props} />
                    </ConfirmProvider>
                    <Toaster />
                </LanguageProvider>
            </ThemeProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
