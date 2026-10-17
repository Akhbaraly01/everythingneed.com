import { useEffect, useRef } from 'react';

const SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) ?? '';

declare global {
    interface Window {
        turnstile?: {
            render: (container: HTMLElement, options: Record<string, unknown>) => string;
            reset: (widgetId?: string) => void;
            remove: (widgetId?: string) => void;
        };
    }
}

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
    if (typeof window === 'undefined') {
        return Promise.resolve();
    }
    if (window.turnstile) {
        return Promise.resolve();
    }
    if (!scriptPromise) {
        scriptPromise = new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => {
                scriptPromise = null;
                reject(new Error('turnstile script failed'));
            };
            document.head.appendChild(script);
        });
    }
    return scriptPromise;
}

interface TurnstileWidgetProps {
    onToken: (token: string | null) => void;
}

/**
 * Cloudflare Turnstile bot widget for auth forms. Renders nothing when no
 * site key is configured (local/test/dev) — the server middleware skips
 * verification in that case too. Theme follows the document class.
 */
export default function TurnstileWidget({ onToken }: TurnstileWidgetProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const onTokenRef = useRef(onToken);
    onTokenRef.current = onToken;

    useEffect(() => {
        if (!SITE_KEY || !containerRef.current) {
            return;
        }
        let widgetId: string | undefined;
        let cancelled = false;

        loadScript()
            .then(() => {
                if (cancelled || !containerRef.current || !window.turnstile) {
                    return;
                }
                widgetId = window.turnstile.render(containerRef.current, {
                    sitekey: SITE_KEY,
                    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
                    callback: (token: string) => onTokenRef.current(token),
                    'expired-callback': () => onTokenRef.current(null),
                    'error-callback': () => onTokenRef.current(null),
                });
            })
            .catch(() => {
                // Widget unavailable (offline/adblock): leave the form
                // submittable; the server decides when keys are configured.
            });

        return () => {
            cancelled = true;
            try {
                if (widgetId !== undefined) {
                    window.turnstile?.remove(widgetId);
                }
            } catch {
                // Teardown must never break navigation.
            }
        };
    }, []);

    if (!SITE_KEY) {
        return null;
    }

    return <div ref={containerRef} className="flex justify-center" data-testid="turnstile-widget" />;
}
