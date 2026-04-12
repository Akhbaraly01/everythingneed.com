import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "recently_viewed_products";
const MAX_ITEMS = 10;

export interface RecentlyViewedItem {
  id: string;
  name: string;
  image: string;
  price: number;
  category: string;
  viewedAt: number;
}

export const useRecentlyViewed = () => {
  const [items, setItems] = useState<RecentlyViewedItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const addItem = useCallback((item: Omit<RecentlyViewedItem, "viewedAt">) => {
    setItems(prev => {
      const filtered = prev.filter(i => i.id !== item.id);
      return [{ ...item, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
    });
  }, []);

  return { recentlyViewed: items, addItem };
};
