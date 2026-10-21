/**
 * Rotation helpers for the storefront arrangement.
 *
 * The storefront mixes several blocks (promo banners, category rails,
 * product batches, recommendation rails). A fixed order makes every visit
 * look identical; a random order would jitter on every re-render. These
 * helpers shuffle deterministically from a seed, so the arrangement is
 * lively between visits but stable while the shopper browses.
 *
 * `pageSeed()` is generated once per page load: every refresh produces a
 * new arrangement (the shopper never sees the same shelf twice in a row)
 * while the current page keeps its order.
 */

const SEED_KEY = 'everythingneed-rotation-seed';

let pageSeedValue: number | null = null;

/** Seed for the current page load (stable until the next refresh). */
export function pageSeed(): number {
    if (pageSeedValue === null) {
        pageSeedValue = Math.floor(Math.random() * 2 ** 31);
    }

    return pageSeedValue;
}

/** Stable per browser session (0 when storage is unavailable). */
export function sessionSeed(): number {
    if (typeof window === 'undefined') {
        return 0;
    }

    try {
        const stored = window.sessionStorage.getItem(SEED_KEY);

        if (stored !== null) {
            const parsed = Number(stored);

            if (Number.isFinite(parsed)) {
                return parsed;
            }
        }

        const seed = Math.floor(Math.random() * 2 ** 31);

        window.sessionStorage.setItem(SEED_KEY, String(seed));

        return seed;
    } catch {
        return 0;
    }
}

/** Small deterministic PRNG (mulberry32). */
function rng(seed: number): () => number {
    let state = seed >>> 0;

    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;

        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Fisher-Yates shuffle driven by the session seed. `salt` lets callers
 * rotate different lists independently.
 */
export function rotate<T>(items: T[], seed: number, salt = 0): T[] {
    if (items.length < 2) {
        return [...items];
    }

    const random = rng((seed + salt * 2654435761) >>> 0);
    const result = [...items];

    for (let index = result.length - 1; index > 0; index--) {
        const swap = Math.floor(random() * (index + 1));
        [result[index], result[swap]] = [result[swap], result[index]];
    }

    return result;
}
