import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Input } from "@shared/ui/input";
import { db } from "@core/api/laravelGateway";
// eslint-disable-next-line no-restricted-imports -- NeedRequestForm belongs to needs module
import { NeedRequestForm } from "@modules/needs";
import { 
  Search, ArrowLeft, Star, ShoppingCart, ChevronRight, Loader2,
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

const ITEMS_PER_PAGE = 12;

const NeedCategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<NeedCategory | null>(null);
  const [items, setItems] = useState<NeedItem[]>([]);
  const [sampleData, setSampleData] = useState<NeedItem[]>([]);
  const [displayedItems, setDisplayedItems] = useState<NeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentIndex, setCurrentIndex] = useState(ITEMS_PER_PAGE);
  const [showRequestForm, setShowRequestForm] = useState(false);

  useEffect(() => {
    if (slug) fetchData();
  }, [slug]);

  const fetchData = async () => {
    try {
      const catData = await db
        .from("need_categories")
        .select("*")
        .where("slug", "=", slug)
        .single();

      if (catData) {
        setCategory(catData);

        const itemsData = (await db
          .from("need_items")
          .select("*")
          .where("category_id", "=", catData.id)
          .where("is_available", "=", true)) as NeedItem[];

        if (itemsData && itemsData.length > 0) {
          setItems(itemsData);
          setDisplayedItems(itemsData.slice(0, ITEMS_PER_PAGE));
        } else {
          // No sample data available
          setDisplayedItems([]);
        }
      } else {
        // Category not in DB, use sample data
        const defaultCategory: NeedCategory = {
          id: slug || 'default',
          name: slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : 'Category',
          slug: slug || 'default',
          description: `Browse ${slug} services and products`,
          icon: 'Briefcase',
          color: '#3B82F6'
        };
        setCategory(defaultCategory);
        // No fallback data available
        setDisplayedItems([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setDisplayedItems([]);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || Briefcase;
    return Icon;
  };

  const allItems = items.length > 0 ? items : sampleData;
  
  const filteredItems = allItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const loadMore = useCallback(() => {
    setLoadingMore(true);
    setTimeout(() => {
      const nextItems = filteredItems.slice(currentIndex, currentIndex + ITEMS_PER_PAGE);
      setDisplayedItems(prev => [...prev, ...nextItems]);
      setCurrentIndex(prev => prev + ITEMS_PER_PAGE);
      setLoadingMore(false);
    }, 500);
  }, [currentIndex, filteredItems]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && !loadingMore && currentIndex < filteredItems.length) {
      loadMore();
    }
  }, [loadMore, loadingMore, currentIndex, filteredItems.length]);

  useEffect(() => {
    if (searchTerm) {
      setDisplayedItems(filteredItems.slice(0, ITEMS_PER_PAGE));
      setCurrentIndex(ITEMS_PER_PAGE);
    }
  }, [searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={`Search ${category.name.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 py-6 text-lg bg-background"
              />
            </div>
            <Button 
              onClick={() => setShowRequestForm(!showRequestForm)}
              variant={showRequestForm ? "secondary" : "default"}
            >
              {showRequestForm ? "Hide Request Form" : "Submit a Request"}
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Request Form */}
        {showRequestForm && (
          <div className="mb-8">
            <NeedRequestForm categoryName={category.name} />
          </div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"} available
          </p>
          <Button variant="outline">
            Filter <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Items Grid with Infinite Scroll */}
        <div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-h-[1000px] overflow-y-auto"
          onScroll={handleScroll}
        >
          {displayedItems.map((item, index) => (
            <Card key={item.id || index} className="group hover:shadow-lg transition-all duration-300">
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
                {'provider' in item && (
                  <p className="text-xs text-muted-foreground mb-2">
                    Provider: {(item as { provider?: string }).provider}
                  </p>
                )}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    <span className="text-sm">{'rating' in item ? String((item as { rating?: unknown }).rating) : (4 + Math.random()).toFixed(1)}</span>
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

        {loadingMore && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {currentIndex < filteredItems.length && !loadingMore && (
          <div className="text-center mt-6">
            <Button variant="outline" onClick={loadMore}>
              Load More Items
            </Button>
          </div>
        )}

        {displayedItems.length === 0 && (
          <div className="text-center py-12">
            <IconComponent className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No items found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "Try a different search term" : "Check back later for new listings"}
            </p>
            <Button onClick={() => setShowRequestForm(true)}>
              Submit a Custom Request
            </Button>
          </div>
        )}
      </div>

      {/* AI Chatbot placeholder */}
      <div className="fixed bottom-4 right-4 z-50">
        <button className="bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow">
          Chat
        </button>
      </div>
    </div>
  );
};

export default NeedCategoryPage;
