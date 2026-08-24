import { createContext, useContext, useState, ReactNode, useCallback } from "react";

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

export const CompareProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CompareItem[]>([]);
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  const addToCompare = useCallback((item: CompareItem): boolean => {
    let added = false;
    setItems(prev => {
      if (prev.length >= MAX_COMPARE) return prev;
      if (prev.some(i => i.id === item.id)) return prev;
      added = true;
      return [...prev, item];
    });
    return added;
  }, []);

  const removeFromCompare = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const clearCompare = useCallback(() => {
    setItems([]);
    setDrawerOpen(false);
  }, []);

  const isInCompare = useCallback((id: string) => items.some(i => i.id === id), [items]);

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
