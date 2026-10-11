import { useState, useEffect, useCallback } from "react";
const STORAGE_KEY = "recently_viewed_products";
const MAX_ITEMS = 10;
function useRecentlyViewed() {
  const [items, setItems] = useState(() => {
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
    } catch {
    }
  }, [items]);
  const addItem = useCallback((item) => {
    setItems((prev) => {
      const filtered = prev.filter((i) => i.id !== item.id);
      return [{ ...item, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
    });
  }, []);
  const clear = useCallback(() => setItems([]), []);
  return { recentlyViewed: items, addItem, clear };
}
export {
  useRecentlyViewed as u
};
