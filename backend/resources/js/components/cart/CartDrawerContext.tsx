import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

interface CartDrawerContextType {
    isOpen: boolean;
    openCart: () => void;
    closeCart: () => void;
}

const CartDrawerContext = createContext<CartDrawerContextType>({
    isOpen: false,
    openCart: () => {},
    closeCart: () => {},
});

export function CartDrawerProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const openCart = useCallback(() => setIsOpen(true), []);
    const closeCart = useCallback(() => setIsOpen(false), []);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeCart();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, closeCart]);

    return (
        <CartDrawerContext.Provider value={{ isOpen, openCart, closeCart }}>
            {children}
        </CartDrawerContext.Provider>
    );
}

export function useCartDrawer() {
    return useContext(CartDrawerContext);
}
