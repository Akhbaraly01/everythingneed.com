import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';

interface WishlistRow {
    id: string;
    product_id: string;
    entity_type?: string | null;
}

/**
 * Shared wishlist state for product cards / detail pages.
 *
 * The backend wishlist lives in the `wishlists` table (GET/POST/DELETE
 * /api/wishlist) and is what the /wishlist page reads - so every heart in
 * the app must read and write THAT store. Module-level cache keeps a single
 * GET per page load no matter how many cards render, and all subscribers
 * re-render together on change.
 *
 * `entityType` defaults to 'product' (ProductCard behaviour unchanged);
 * pass 'job' on job detail pages. Keys are namespaced per type.
 */
let cache: Map<string, string> | null = null; // product_id -> wishlist row id
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((l) => l());

async function load(): Promise<void> {
    try {
        const res = await api.get<{ data: WishlistRow[] }>('/api/wishlist');
        cache = new Map((res.data ?? []).map((row) => [`${row.entity_type ?? 'product'}:${row.product_id}`, row.id]));
    } catch (e) {
        // Guest / network failure: treat as "nothing saved" - cards guard
        // auth before calling toggle, so an empty cache is safe.
        if (e instanceof ApiError && e.status === 401) cache = new Map();
        else cache = cache ?? new Map();
    }
    notify();
}

function ensureLoaded(): void {
    if (!cache && !inflight) {
        inflight = load().finally(() => {
            inflight = null;
        });
    }
}

/** Drop the shared cache (call after wishlist mutations outside this hook). */
export function invalidateWishlist(): void {
    cache = null;
    ensureLoaded();
}

export function useWishlist(entityType = 'product'): {
    has: (productId: string | number) => boolean;
    toggle: (productId: string | number) => Promise<boolean>;
    ready: boolean;
} {
    const [, force] = useState(0);

    useEffect(() => {
        const listener = () => force((v) => v + 1);
        listeners.add(listener);
        ensureLoaded();
        return () => {
            listeners.delete(listener);
        };
    }, []);

    const keyFor = useCallback((productId: string | number) => `${entityType}:${productId}`, [entityType]);

    const toggle = useCallback(async (productId: string | number): Promise<boolean> => {
        const key = String(productId);
        ensureLoaded();
        if (!cache) await (inflight ?? load());

        const existing = cache?.get(keyFor(productId));
        if (existing) {
            await api.del(`/api/wishlist/${existing}`);
            cache?.delete(keyFor(productId));
            notify();
            return false;
        }
        try {
            await api.post('/api/wishlist', { product_id: key, entity_type: entityType });
        } catch (e) {
            // 409 = already saved (concurrent tab) -> fall through to refresh
            if (!(e instanceof ApiError && e.status === 409)) throw e;
        }
        // addToWishlist does not return the row id - refresh the map once.
        await load();
        return true;
    }, [entityType, keyFor]);

    return {
        has: (productId) => cache?.has(keyFor(productId)) ?? false,
        toggle,
        ready: cache !== null,
    };
}
