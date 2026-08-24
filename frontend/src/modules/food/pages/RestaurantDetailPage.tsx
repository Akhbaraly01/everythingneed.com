import { http } from "@/core/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

export default function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: restaurant, isLoading: loadingRestaurant } = useQuery({
    queryKey: ["restaurant", id],
    queryFn: () =>
      http.get<any>(`/api/restaurants/${id}`).then((res) => res.data),
  });

  const { data: menu, isLoading: loadingMenu } = useQuery({
    queryKey: ["restaurantMenu", id],
    queryFn: () =>
      http.get<any>(`/api/restaurants/${id}/menu`).then((res) => res.data),
  });

  const addToCart = (item: any) => {
    const cart = JSON.parse(localStorage.getItem("food_cart") || "[]");
    const existing = cart.find((c: any) => c.id === item.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...item, quantity: 1 });
    }
    localStorage.setItem("food_cart", JSON.stringify(cart));
    navigate("/food/cart");
  };

  const groupedMenu =
    menu?.reduce((acc: any, item: any) => {
      const cat = item.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {}) || {};

  if (loadingRestaurant || loadingMenu) {
    return <div className="p-8 text-center">Loading restaurant...</div>;
  }

  if (!restaurant) {
    return <div className="p-8 text-center">Restaurant not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate("/food")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Restaurants
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{restaurant.name}</CardTitle>
          {restaurant.cuisine && (
            <Badge variant="secondary">{restaurant.cuisine}</Badge>
          )}
          {restaurant.description && (
            <p className="text-muted-foreground">{restaurant.description}</p>
          )}
        </CardHeader>
      </Card>

      {Object.keys(groupedMenu).length > 0 ? (
        Object.entries(groupedMenu).map(([category, items]: [string, any]) => (
          <div key={category} className="space-y-4">
            <h2 className="text-xl font-semibold">{category}</h2>
            <div className="grid gap-4">
              {items.map((item: any) => (
                <Card key={item.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="space-y-1">
                      <h3 className="font-medium">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">
                        ${item.price?.toFixed(2) || "0.00"}
                      </span>
                      <Button size="sm" onClick={() => addToCart(item)}>
                        Add to Cart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No menu items available.
        </div>
      )}
    </div>
  );
}
