import { TrendingUp, Star, Users, ShoppingCart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TrendingItem {
  id: string;
  title: string;
  category: string;
  price: number;
  image: string;
  rating: number;
  sales: number;
  badge?: string;
}

const trendingItems: TrendingItem[] = [
  {
    id: "1",
    title: "Premium Wireless Earbuds",
    category: "Electronics",
    price: 149.99,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300",
    rating: 4.9,
    sales: 2340,
    badge: "Hot",
  },
  {
    id: "2",
    title: "Smart Fitness Watch",
    category: "Wearables",
    price: 299.99,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300",
    rating: 4.8,
    sales: 1890,
    badge: "Trending",
  },
  {
    id: "3",
    title: "Organic Coffee Beans",
    category: "Food",
    price: 24.99,
    image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300",
    rating: 4.7,
    sales: 5670,
  },
  {
    id: "4",
    title: "Yoga Mat Pro",
    category: "Sports",
    price: 79.99,
    image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=300",
    rating: 4.6,
    sales: 3210,
    badge: "Best Seller",
  },
];

const TrendingSection = () => {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
          <TrendingUp className="h-5 w-5 text-primary-foreground" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold">Trending Now</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {trendingItems.map((item) => (
          <Card
            key={item.id}
            className="group overflow-hidden hover:shadow-lg transition-all duration-300"
          >
            <div className="relative aspect-square overflow-hidden">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              {item.badge && (
                <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground">
                  {item.badge}
                </Badge>
              )}
            </div>
            <div className="p-3">
              <p className="text-xs text-muted-foreground mb-1">
                {item.category}
              </p>
              <h3 className="font-medium text-sm line-clamp-2 mb-2">
                {item.title}
              </h3>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-warning text-warning" />
                  <span className="text-xs font-medium">{item.rating}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span className="text-xs">{item.sales.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-primary">
                  ${item.price.toFixed(2)}
                </span>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default TrendingSection;
