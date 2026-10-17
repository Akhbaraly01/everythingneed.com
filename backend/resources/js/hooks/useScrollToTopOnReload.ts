import { useEffect } from 'react';

/**
 * Refresh lands on top (every page, every layout).
 *
 * Browsers restore the previous scroll offset on reload by default
 * (`history.scrollRestoration === 'auto'`), so a refresh in the middle or
 * at the end of a long page (e.g. the interleaved Home feed) would strand
 * the visitor mid-page. Switching restoration to manual + an explicit
 * top scroll on boot guarantees every full document load starts at the top
 * of that particular page.
 *
 * Runs once per document load only — Inertia client-side visits keep their
 * own scroll behaviour (preserveScroll etc.) untouched.
 */
export function useScrollToTopOnReload() {
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            if ('scrollRestoration' in window.history) {
                window.history.scrollRestoration = 'manual';
            }
        } catch {
            // Older browsers: fall through to the explicit scroll below.
        }
        window.scrollTo(0, 0);
    }, []);
}
