import { createContext, useContext, useState, ReactNode } from "react";

interface CartDrawerContextType {
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

const CartDrawerContext = createContext<CartDrawerContextType | undefined>(undefined);

export const CartDrawerProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <CartDrawerContext.Provider
      value={{
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        toggleCart: () => setIsOpen((p) => !p),
      }}
    >
      {children}
    </CartDrawerContext.Provider>
  );
};

export const useCartDrawer = () => {
  const ctx = useContext(CartDrawerContext);
  if (!ctx) throw new Error("useCartDrawer must be used within CartDrawerProvider");
  return ctx;
};
