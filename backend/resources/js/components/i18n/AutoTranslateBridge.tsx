import { useEffect } from 'react';
import { router } from '@inertiajs/react';
import {
    autoTranslator,
    broadcastTranslateState,
    loadGoogleWidget,
    setGoogleLanguage,
    type AutoTranslateConfig,
} from '@/lib/auto-translate';
import { useLanguage } from '@/lib/use-language';

/**
 * Mounted once inside LanguageProvider (app.tsx) so every layout, page,
 * modal, and Inertia transition is covered. The server-resolved config
 * is passed in from the initial Inertia page: usePage() is unavailable
 * here because the bridge is a sibling of Inertia's <App />.
 *
 * proxy : the DOM engine translates text + attributes and re-applies
 *         after React re-renders and Inertia visits.
 * google: the website widget is loaded and driven by the same language
 *         selection (dictionary + content).
 * off   : no whole-page translation.
 */
export default function AutoTranslateBridge({ config }: { config: AutoTranslateConfig }) {
    const { language } = useLanguage();

    const engine = config.engine;
    const source = config.source ?? 'en';

    useEffect(() => {
        if (engine !== 'proxy') {
            autoTranslator.stop();

            return;
        }

        autoTranslator.start({ engine, source: config.source }, language);

        return () => autoTranslator.stop();
        // The engine only restarts when the server strategy changes; the
        // live locale flows through the effect below.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [engine, source]);

    useEffect(() => {
        if (engine === 'proxy') {
            autoTranslator.setTarget(language);
        } else if (engine === 'google') {
            broadcastTranslateState(true);
            setGoogleLanguage(language, source);
        }
    }, [engine, language, source]);

    useEffect(() => {
        if (engine === 'google') {
            loadGoogleWidget(source);
        }
    }, [engine, source]);

    useEffect(() => {
        if (engine === 'off') {
            return;
        }

        return router.on('finish', () => {
            if (engine === 'proxy') {
                autoTranslator.rescan();
            } else {
                // The widget only translated the DOM it saw; force a new
                // pass so the freshly rendered Inertia content is
                // converted too.
                broadcastTranslateState(true);
                setGoogleLanguage(language, source, true);
            }
        });
    }, [engine, language, source]);

    // The widget marks the document as translated; that is our cue that
    // the pass finished (the switcher shows a spinner meanwhile).
    useEffect(() => {
        if (engine !== 'google' || typeof MutationObserver === 'undefined') {
            return;
        }

        const observer = new MutationObserver(() => {
            const root = document.documentElement;

            if (root.classList.contains('translated-ltr') || root.classList.contains('translated-rtl')) {
                broadcastTranslateState(false);
            }
        });

        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        // Safety net: never leave the spinner running.
        const timer = window.setTimeout(() => broadcastTranslateState(false), 15000);

        return () => {
            observer.disconnect();
            window.clearTimeout(timer);
        };
    }, [engine]);

    return null;
}
