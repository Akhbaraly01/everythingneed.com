import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'recently_viewed_products';
const MAX_ITEMS = 10;

export interface RecentlyViewedItem {
    id: string;
    slug?: string;
    name: string;
    image: string;
    price: number;
    category?: string;
    viewedAt: number;
}

export function useRecentlyViewed() {
    const [items, setItems] = useState<RecentlyViewedItem[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? (JSON.parse(stored) as RecentlyViewedItem[]) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {
            // storage unavailable — keep in-memory only
        }
    }, [items]);

    const addItem = useCallback((item: Omit<RecentlyViewedItem, 'viewedAt'>) => {
        setItems((prev) => {
            const filtered = prev.filter((i) => i.id !== item.id);
            return [{ ...item, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
        });
    }, []);

    const clear = useCallback(() => setItems([]), []);

    return { recentlyViewed: items, addItem, clear };
}
