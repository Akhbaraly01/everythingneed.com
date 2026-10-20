import { useEffect } from 'react';
import { router } from '@inertiajs/react';
import {
    autoTranslator,
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
                setGoogleLanguage(language, source);
            }
        });
    }, [engine, language, source]);

    return null;
}
