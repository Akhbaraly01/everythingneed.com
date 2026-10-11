/**
 * Adaptive quality tiers (Full / Balanced / Lite).
 *
 * The tier is stamped onto <html data-tier="..."> *before first paint* by the
 * inline script in resources/views/app.blade.php. This module keeps that value
 * in sync at runtime, listens for capability changes, and lets the user
 * override it (persisted under `everythingneed-tier`).
 *
 * CSS consumes the attribute in resources/css/app.css:
 *  - [data-tier="balanced"] lowers the top blur level and dims the aurora
 *  - [data-tier="lite"]     disables backdrop-filter, blur and the aurora
 */

export type QualityTier = 'full' | 'balanced' | 'lite';

const TIER_KEY = 'everythingneed-tier';
const TIER_EVENT = 'everythingneed:tierchange';

function isQualityTier(value: unknown): value is QualityTier {
    return value === 'full' || value === 'balanced' || value === 'lite';
}

export function readStoredTier(): QualityTier | null {
    if (typeof window === 'undefined') return null;
    try {
        const value = window.localStorage.getItem(TIER_KEY);
        return isQualityTier(value) ? value : null;
    } catch {
        return null;
    }
}

function mediaMatches(query: string): boolean {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    try {
        return window.matchMedia(query).matches;
    } catch {
        return false;
    }
}

/**
 * Capability heuristic used when the user has not chosen a tier.
 * Mirrors the inline blade script so the pre-paint and runtime answers match.
 */
export function detectTier(): QualityTier {
    if (typeof window === 'undefined') return 'full';

    const reduced =
        mediaMatches('(prefers-reduced-motion: reduce)') ||
        mediaMatches('(prefers-reduced-transparency: reduce)');
    if (reduced) return 'lite';

    const nav = navigator as Navigator & {
        deviceMemory?: number;
        connection?: { saveData?: boolean };
    };
    const weakDevice =
        (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4) ||
        (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 4) ||
        nav.connection?.saveData === true;

    return weakDevice ? 'balanced' : 'full';
}

export function getTier(): QualityTier {
    return readStoredTier() ?? detectTier();
}

export function applyTier(tier: QualityTier): void {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-tier', tier);
}

/** Persist a user override and notify listeners (including other tabs). */
export function setTier(tier: QualityTier): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(TIER_KEY, tier);
    } catch {
        // Private-mode storage failures only cost persistence.
    }
    applyTier(tier);
    window.dispatchEvent(new CustomEvent<QualityTier>(TIER_EVENT, { detail: tier }));
}

/** Drop the override and fall back to detected capability. */
export function resetTier(): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.removeItem(TIER_KEY);
    } catch {
        // ignore
    }
    const tier = detectTier();
    applyTier(tier);
    window.dispatchEvent(new CustomEvent<QualityTier>(TIER_EVENT, { detail: tier }));
}

/**
 * Subscribe to tier changes. Returns the current tier immediately and an
 * unsubscribe callback. Honours storage events from other tabs.
 */
export function subscribeToTier(listener: (tier: QualityTier) => void): () => void {
    if (typeof window === 'undefined') return () => undefined;

    const emit = (tier: QualityTier) => listener(tier);
    const onCustom = (event: Event) => {
        const detail = (event as CustomEvent<QualityTier>).detail;
        if (isQualityTier(detail)) emit(detail);
    };
    const onStorage = (event: StorageEvent) => {
        if (event.key === TIER_KEY) emit(getTier());
    };
    const onScheme = () => {
        if (!readStoredTier()) emit(getTier());
    };

    window.addEventListener(TIER_EVENT, onCustom);
    window.addEventListener('storage', onStorage);
    if (typeof window.matchMedia === 'function') {
        const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const transparency = window.matchMedia('(prefers-reduced-transparency: reduce)');
        motion.addEventListener?.('change', onScheme);
        transparency.addEventListener?.('change', onScheme);
        return () => {
            window.removeEventListener(TIER_EVENT, onCustom);
            window.removeEventListener('storage', onStorage);
            motion.removeEventListener?.('change', onScheme);
            transparency.removeEventListener?.('change', onScheme);
        };
    }

    window.addEventListener(TIER_EVENT, onCustom);
    return () => {
        window.removeEventListener(TIER_EVENT, onCustom);
        window.removeEventListener('storage', onStorage);
    };
}
