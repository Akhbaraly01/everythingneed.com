import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, ArrowLeft, Star, ShoppingCart, ChevronRight,
  Plane, Hotel, Building, Briefcase, Tractor, UtensilsCrossed, 
  Heart, GraduationCap, Laptop, Shirt, Sparkles, Home, Music, 
  Dumbbell, Car, Wallet, Scale, Sparkle, Shield, Dog, Compass, 
  Calendar, Camera, Printer, Truck, HardHat, Wrench, Baby, 
  HeartHandshake, Phone
} from "lucide-react";

interface NeedCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  color: string;
}

interface NeedItem {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  is_available: boolean;
}

const iconMap: { [key: string]: any } = {
  Plane, Hotel, Building, Briefcase, Tractor, UtensilsCrossed, Heart,
  GraduationCap, Laptop, Shirt, Sparkles, Home, Music, Dumbbell, Car,
  Wallet, Scale, Sparkle, Shield, Dog, Compass, Calendar, Camera,
  Printer, Truck, HardHat, Wrench, Baby, HeartHandshake, Phone,
};

const NeedCategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<NeedCategory | null>(null);
  const [items, setItems] = useState<NeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (slug) fetchData();
  }, [slug]);

  const fetchData = async () => {
    try {
      const { data: catData } = await supabase
        .from("need_categories")
        .select("*")
        .eq("slug", slug)
        .single();
      
      if (catData) {
        setCategory(catData);

        const { data: itemsData } = await supabase
          .from("need_items")
          .select("*")
          .eq("category_id", catData.id)
          .eq("is_available", true);
        
        if (itemsData) setItems(itemsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || Briefcase;
    return Icon;
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Category Not Found</h2>
          <Link to="/deals">
            <Button>Back to Categories</Button>
          </Link>
        </div>
      </div>
    );
  }

  const IconComponent = getIcon(category.icon);

  // Generate sample items if none exist
  const displayItems = items.length > 0 ? filteredItems : Array(20).fill(null).map((_, i) => ({
    id: `sample-${i}`,
    name: `${category.name} Service ${i + 1}`,
    description: `Quality ${category.name.toLowerCase()} service provider with excellent ratings`,
    price: Math.floor(Math.random() * 200) + 20,
    image_url: null,
    is_available: true,
  }));

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
      <section 
        className="py-12 md:py-16"
        style={{ background: `linear-gradient(135deg, ${category.color}20, ${category.color}10)` }}
      >
        <div className="container mx-auto px-4">
          <Link to="/deals" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Categories
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <div 
              className="h-16 w-16 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: category.color + "30" }}
            >
              <IconComponent className="h-8 w-8" style={{ color: category.color }} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">{category.name}</h1>
              <p className="text-muted-foreground">{category.description}</p>
            </div>
          </div>

          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={`Search ${category.name.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 py-6 text-lg bg-background"
            />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            {displayItems.length} {displayItems.length === 1 ? "item" : "items"} available
          </p>
          <Button variant="outline">
            Filter <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayItems.map((item, index) => (
            <Card key={item.id} className="group hover:shadow-lg transition-all duration-300">
              <div 
                className="h-40 flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${category.color}15, ${category.color}05)` }}
              >
                <IconComponent 
                  className="h-12 w-12 group-hover:scale-110 transition-transform" 
                  style={{ color: category.color }} 
                />
              </div>
              <CardContent className="pt-4">
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                  {item.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {item.description}
                </p>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    <span className="text-sm">{(4 + Math.random()).toFixed(1)}</span>
                  </div>
                  <Badge variant="outline">Available</Badge>
                </div>
                <div className="flex items-center justify-between">
                  {item.price && (
                    <span className="text-lg font-bold" style={{ color: category.color }}>
                      ${item.price}
                    </span>
                  )}
                  <Button size="sm">
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Book
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {displayItems.length === 0 && (
          <div className="text-center py-12">
            <IconComponent className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No items found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "Try a different search term" : "Check back later for new listings"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NeedCategoryPage;
