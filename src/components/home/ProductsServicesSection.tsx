import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Star, ShoppingCart, Loader2 } from "lucide-react";
import { allHomeProducts, HomeProduct } from "@/data/homeProductsData";

const categories = [
  "All", "Products", "Health", "Electronics", "Books", "Building", "Labour", 
  "Learn", "E-commerce", "Fashion", "Food", "Agriculture", "Transportation", 
  "Hotels", "Jobs", "Real Estate", "Tasks", "Booking", "Gaming", "Beauty", 
  "Auto", "Sports", "Home", "Furniture", "Appliances", "Mobile", 
  "Computers", "Cameras", "Audio", "Watches", "Jewelry", "Bags", "Shoes", 
  "Kids", "Baby", "Pets", "Garden", "Tools", "Office", "Stationery", "Art", 
  "Music", "Movies", "Software", "Services", "Consulting", "Legal", "Finance", 
  "Insurance", "Travel", "Events", "Catering", "Cleaning", "Repair", 
  "Maintenance", "Security", "Education", "Training"
];

const ITEMS_PER_PAGE = 24;

const ProductsServicesSection = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [displayedProducts, setDisplayedProducts] = useState<HomeProduct[]>([]);
  const [currentIndex, setCurrentIndex] = useState(ITEMS_PER_PAGE);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter products based on category
  const getFilteredProducts = useCallback(() => {
    if (activeCategory === "All") return allHomeProducts;
    return allHomeProducts.filter(p => 
      p.category.toLowerCase() === activeCategory.toLowerCase()
    );
  }, [activeCategory]);

  useEffect(() => {
    const filtered = getFilteredProducts();
    setDisplayedProducts(filtered.slice(0, ITEMS_PER_PAGE));
    setCurrentIndex(ITEMS_PER_PAGE);
  }, [activeCategory, getFilteredProducts]);

  const scrollCategories = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const loadMore = useCallback(() => {
    const filtered = getFilteredProducts();
    if (currentIndex >= filtered.length) return;
    
    setLoading(true);
    setTimeout(() => {
      const nextProducts = filtered.slice(currentIndex, currentIndex + ITEMS_PER_PAGE);
      setDisplayedProducts(prev => [...prev, ...nextProducts]);
      setCurrentIndex(prev => prev + ITEMS_PER_PAGE);
      setLoading(false);
    }, 500);
  }, [currentIndex, getFilteredProducts]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const filtered = getFilteredProducts();
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && !loading && currentIndex < filtered.length) {
      loadMore();
    }
  }, [loadMore, loading, currentIndex, getFilteredProducts]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
  };

  const filteredTotal = getFilteredProducts().length;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Products & Services</h2>
          <p className="text-sm text-muted-foreground">{filteredTotal.toLocaleString()} items available</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 hidden md:flex"
            onClick={() => scrollCategories("left")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 hidden md:flex"
            onClick={() => scrollCategories("right")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? "default" : "outline"}
              size="sm"
              className="flex-shrink-0 rounded-full"
              onClick={() => handleCategoryChange(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Products Grid with Infinite Scroll */}
      <div 
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 max-h-[800px] overflow-y-auto"
        onScroll={handleScroll}
      >
        {displayedProducts.length > 0 ? (
          displayedProducts.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden group hover:shadow-lg transition-all duration-300 hover:border-primary/50 cursor-pointer"
            >
              <div className="relative aspect-square bg-muted">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <Badge className="absolute top-2 left-2 bg-primary/90 text-xs">
                  {product.category}
                </Badge>
              </div>
              <div className="p-3 space-y-2">
                <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs text-muted-foreground">{product.rating}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary">${product.price}</span>
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No products found in this category
          </div>
        )}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {/* Load More Button */}
      {!loading && currentIndex < filteredTotal && (
        <div className="text-center">
          <Button variant="outline" onClick={loadMore}>
            Load More Products
          </Button>
        </div>
      )}

      {/* Item count */}
      <div className="text-center text-sm text-muted-foreground">
        Showing {displayedProducts.length} of {filteredTotal.toLocaleString()} items
      </div>
    </section>
  );
};

export default ProductsServicesSection;
