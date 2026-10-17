import { useScrollToTopOnReload } from '@/hooks/useScrollToTopOnReload';

/**
 * Refresh lands on top of the page (every layout, document load only).
 * Rendered once at boot in app.tsx — Inertia client-side visits keep
 * their own scroll behaviour untouched.
 */
export default function BootScrollTop() {
    useScrollToTopOnReload();
    return null;
}
