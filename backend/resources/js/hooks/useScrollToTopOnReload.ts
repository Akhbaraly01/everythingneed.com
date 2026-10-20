import { useEffect } from 'react';

const SCROLL_KEY = 'en:last-scroll-y';

/**
 * Refresh lands on top (every page, every layout).
 *
 * Browsers restore the previous scroll offset on reload by default
 * (`history.scrollRestoration === 'auto'`), so a refresh in the middle or
 * at the end of a long page (e.g. the interleaved Home feed) would strand
 * the visitor mid-page. The hook switches restoration to manual and pins the
 * top position — but only for a reload that actually had a prior scroll:
 *
 *  - the last known scroll offset is saved (throttle-free, passive) while
 *    the visitor scrolls, so a reload knows whether pinning is needed;
 *  - fresh loads never re-assert, so scrolling right after hydration is
 *    never fought by a late "back to top";
 *  - a scrolled reload re-asserts across a short window (load event + a few
 *    timeouts) to beat the browser's own restore, which can land after the
 *    first hydration pass on long pages.
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

        const save = () => {
            try {
                window.sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
            } catch {
                // Private mode / storage full: pinning still works via load event.
            }
        };
        window.addEventListener('scroll', save, { passive: true });

        const reloadedAfterScroll = (() => {
            try {
                const nav = performance.getEntriesByType('navigation')[0] as
                    | PerformanceNavigationTiming
                    | undefined;
                if (nav?.type !== 'reload') return false;
                const saved = Number(window.sessionStorage.getItem(SCROLL_KEY) ?? '0');
                return Number.isFinite(saved) && saved > 0;
            } catch {
                return false;
            }
        })();

        const toTop = () => window.scrollTo(0, 0);
        toTop();

        let timers: number[] = [];
        if (reloadedAfterScroll) {
            window.addEventListener('load', toTop, { once: true });
            timers = [80, 300, 700].map((ms) => window.setTimeout(toTop, ms));
        }

        return () => {
            window.removeEventListener('scroll', save);
            window.removeEventListener('load', toTop);
            timers.forEach((id) => window.clearTimeout(id));
        };
    }, []);
}
