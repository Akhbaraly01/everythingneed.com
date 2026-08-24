import { http } from "@/core/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";

interface CartItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
}

export default function FoodCartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("food_cart") || "[]");
    setCartItems(stored);
  }, []);

  const updateCart = (updated: CartItem[]) => {
    setCartItems(updated);
    localStorage.setItem("food_cart", JSON.stringify(updated));
  };

  const updateQuantity = (id: string | number, delta: number) => {
    const updated = cartItems
      .map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      )
      .filter((item) => item.quantity > 0);
    updateCart(updated);
  };

  const removeItem = (id: string | number) => {
    updateCart(cartItems.filter((item) => item.id !== id));
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const total = subtotal;

  const checkoutMutation = useMutation({
    mutationFn: () =>
      http.post("/api/restaurants/0/order", {
        items: cartItems.map((item) => ({
          menu_item_id: item.id,
          quantity: item.quantity,
        })),
      }),
    onSuccess: (res: any) => {
      localStorage.removeItem("food_cart");
      navigate(`/food/orders/${res.data.id}`);
    },
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate("/food")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Restaurants
      </Button>

      <h1 className="text-2xl font-bold">Your Cart</h1>

      {cartItems.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Your cart is empty.{" "}
          <Button variant="link" onClick={() => navigate("/food")}>
            Browse restaurants
          </Button>
        </div>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border-b last:border-b-0"
                >
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      ${item.price.toFixed(2)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      +
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full"
            size="lg"
            onClick={() => checkoutMutation.mutate()}
            disabled={checkoutMutation.isPending}
          >
            {checkoutMutation.isPending ? "Placing Order..." : "Checkout"}
          </Button>
        </>
      )}
    </div>
  );
}
