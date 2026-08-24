import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { http } from "@core/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.VITE_API_URL || "/api";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product?: any;
}

interface CartData {
  cart: any;
  items: CartItem[];
  subtotal: string;
  discount: string;
  total: string;
  item_count: number;
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
  refetch: () => Promise<void>;
  requiresPrescription: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const fetchCart = async () => {
    if (!user) {
      setItems([]);
      setTotalPrice(0);
      setLoading(false);
      return;
    }

    try {
      const res = await http.get<CartData>(`${API}/cart`);
      const data = res;
      setItems(data?.items || []);
      setTotalPrice(parseFloat(data?.total || "0"));
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string, quantity = 1) => {
    if (!isAuthenticated) {
      toast({ title: "Please sign in", description: "You need to be signed in to add items to cart", variant: "destructive" });
      return;
    }

    try {
      await http.post(`${API}/cart/items`, { product_id: productId, quantity });
      toast({ title: "Added to cart", description: "Item has been added to your cart" });
      fetchCart();
    } catch (error) {
      toast({ title: "Error", description: "Failed to add item to cart", variant: "destructive" });
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) {
      await removeFromCart(itemId);
      return;
    }

    try {
      await http.put(`${API}/cart/items/${itemId}`, { quantity });
      setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, quantity } : item)));
    } catch (error) {
      toast({ title: "Error", description: "Failed to update quantity", variant: "destructive" });
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      await http.delete(`${API}/cart/items/${itemId}`);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      toast({ title: "Removed", description: "Item removed from cart" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove item", variant: "destructive" });
    }
  };

  const clearCart = async () => {
    try {
      await http.delete(`${API}/cart`);
      setItems([]);
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  useEffect(() => { fetchCart(); }, [user]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const requiresPrescription = items.some(
    (item) => item.product?.requires_prescription === true || item.product?.requiresPrescription === true
  );

  return (
    <CartContext.Provider value={{ items, loading, addToCart, updateQuantity, removeFromCart, clearCart, totalItems, totalPrice, refetch: fetchCart, requiresPrescription }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
