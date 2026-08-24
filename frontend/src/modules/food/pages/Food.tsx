import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import BookingRequestForm from "../../bookings/components/BookingRequestForm";
import { ArrowLeft, Search, ShoppingCart, Clock, Star, Package, UtensilsCrossed, Coffee, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@shared/ui/badge";
import { http } from "@core/api";

const API = import.meta.env.VITE_API_URL || "/api";

interface FoodItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  image?: string;
  rating?: number;
  preparation_time?: string;
  deliveryTime?: string | number;
  vendor?: { name?: string } | null;
}

const Food = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFoodItems = async () => {
      setLoading(true);
      try {
        const res = await http.get<any>(`${API}/restaurants?per_page=100`);
        const raw = res?.data || res || [];
        setFoodItems((Array.isArray(raw) ? raw : []).map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          category: item.category || "Stock",
          description: item.description,
          image: item.image,
          rating: item.rating,
          preparation_time: item.preparation_time,
        })));
      } catch (e) {
        console.error("Failed to load food items:", e);
      }
      setLoading(false);
    };
    fetchFoodItems();
  }, []);

  const categories = ["all", "Stock", "Ready-made", "Drinks", "Snacks"];

  const filteredItems = foodItems.filter(item => 
    (selectedCategory === "all" || item.category === selectedCategory) &&
    (searchQuery === "" || item.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddToCart = (item: FoodItem) => {
    toast({
      title: "Added to Cart!",
      description: `${item.name} - $${item.price} added to your cart.`,
    });
  };

  const categoryIcons = {
    Stock: Package,
    "Ready-made": UtensilsCrossed,
    Drinks: Coffee,
    Snacks: Package,
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-primary py-8 md:py-12">
        <div className="container mx-auto px-4">
          <Link to="/deals" className="inline-flex items-center text-white/80 hover:text-white mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Deals
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Food & Delivery</h1>
          <p className="text-white/90">Order fresh food stocks, ready-made meals, and beverages</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {categories.filter(c => c !== "all").map((cat) => {
            const Icon = categoryIcons[cat as keyof typeof categoryIcons] || Package;
            return (
              <Card 
                key={cat} 
                className={`cursor-pointer hover:shadow-lg transition-all hover:scale-105 ${selectedCategory === cat ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                <CardContent className="p-4 text-center">
                  <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-semibold">{cat}</p>
                  <p className="text-sm text-muted-foreground">
                    {foodItems.filter(f => f.category === cat).length} items
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for food items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={() => setSelectedCategory("all")}>
                Show All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <Badge 
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              className="cursor-pointer capitalize"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === "all" ? "All Items" : cat}
            </Badge>
          ))}
        </div>

        {/* Food Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-all group">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <Badge className="absolute top-2 right-2">{item.category}</Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{item.deliveryTime}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <span className="font-medium">4.7</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">by {item.vendor?.name || "Local Kitchen"}</p>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-primary">${item.price}</p>
                </div>
                <Button onClick={() => handleAddToCart(item)} className="gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No items found matching your search.</p>
          </Card>
        )}

        {/* Request Special Order */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-xl font-bold mb-2">Can't Find What You Need?</h3>
            <p className="text-muted-foreground mb-6">
              Request any food items and we'll source them for you. Bulk orders welcome!
            </p>
            <BookingRequestForm 
              serviceTypes={[
                "Bulk Food Stocks",
                "Catering Order",
                "Special Dietary Items",
                "Imported Foods",
                "Custom Food Order"
              ]}
              title="Request Special Order"
              description="Describe what you need and we'll source it for you with delivery."
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Food;
