import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { http } from "@core/api";

export interface CompareItem {
  id: string;
  name: string;
  price?: number;
  originalPrice?: number;
  rating: number;
  image: string;
  category: string;
  description?: string;
}

interface CompareContextType {
  items: CompareItem[];
  addToCompare: (item: CompareItem) => boolean;
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;
  isInCompare: (id: string) => boolean;
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const MAX_COMPARE = 3;

/**
 * Comparison set persisted per-account via /api/compare (Engagement module).
 * UI stays optimistic; server sync is best-effort and hydrates on mount for
 * signed-in users. Anonymous users keep the previous in-memory behaviour.
 */
export const CompareProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CompareItem[]>([]);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  // Hydrate from the server when a session exists.
  useEffect(() => {
    let cancelled = false;

    const token = localStorage.getItem("auth_token");
    if (!token) return;

    http
      .get<{ data: Array<{ product: CompareItem | null }> }>("/api/compare")
      .then((res) => {
        if (cancelled) return;
        setSignedIn(true);
        const hydrated = (res.data ?? [])
          .map((row) => row.product)
          .filter((p): p is CompareItem => Boolean(p))
          .map((p) => ({
            ...p,
            image: p.image || "",
            rating: Number(p.rating ?? 0),
          }));
        if (hydrated.length) setItems(hydrated);
      })
      .catch(() => {
        /* anonymous or transient failure — in-memory mode continues */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const addToCompare = useCallback(
    (item: CompareItem): boolean => {
      let added = false;
      setItems((prev) => {
        if (prev.length >= MAX_COMPARE) return prev;
        if (prev.some((i) => i.id === item.id)) return prev;
        added = true;
        return [...prev, item];
      });

      if (added && signedIn) {
        http.post("/api/compare", { product_id: item.id }).catch(() => {});
      }
      return added;
    },
    [signedIn],
  );

  const removeFromCompare = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((i) => i.id !== id));
      if (signedIn) {
        http.delete(`/api/compare/${id}`).catch(() => {});
      }
    },
    [signedIn],
  );

  const clearCompare = useCallback(() => {
    const ids = items.map((i) => i.id);
    setItems([]);
    setDrawerOpen(false);
    if (signedIn) {
      ids.forEach((id) => http.delete(`/api/compare/${id}`).catch(() => {}));
    }
  }, [items, signedIn]);

  const isInCompare = useCallback((id: string) => items.some((i) => i.id === id), [items]);

  return (
    <CompareContext.Provider value={{ items, addToCompare, removeFromCompare, clearCompare, isInCompare, isDrawerOpen, setDrawerOpen }}>
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
};
