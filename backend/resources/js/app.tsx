import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ConfirmProvider } from '@/components/shared/ConfirmProvider';
import { LanguageProvider } from '@/lib/i18n';
import { persistCurrency, isDisplayCurrency } from '@/lib/currency';
import BootScrollTop from '@/components/BootScrollTop';
import { Toaster } from '@/components/ui/sonner';

const appName = import.meta.env.VITE_APP_NAME || 'EverythingNeed';

interface BootPreferences {
    currency?: unknown;
    language?: unknown;
}

function bootPreferences(props: unknown): BootPreferences {
    const page = (props as { initialPage?: { props?: Record<string, unknown> } })?.initialPage?.props;
    return (page?.['preferences'] ?? {}) as BootPreferences;
}

createInertiaApp({
    title: (title) => title ? `${title} - ${appName}` : appName,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);
        const boot = bootPreferences(props);

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
                <LanguageProvider initialLanguage={boot.language}>
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
