import { useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Star, ShoppingCart, Heart } from "lucide-react";
import { allHomeProducts, HomeProduct } from "@/data/homeProductsData";
import { useCurrency } from "@/contexts/CurrencyContext";
import Pagination from "@/components/Pagination";

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

const ITEMS_PER_PAGE = 500;

const ProductsServicesSection = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { formatPrice } = useCurrency();

  // Filter products based on category only (search is in top bar)
  const filteredProducts = useMemo(() => {
    return allHomeProducts.filter(product => {
      const matchesCategory = activeCategory === "All" || 
        product.category.toLowerCase() === activeCategory.toLowerCase();
      return matchesCategory;
    });
  }, [activeCategory]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const displayedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const scrollCategories = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg md:text-xl font-bold">Products & Services</h2>
          <p className="text-xs text-muted-foreground">{filteredProducts.length.toLocaleString()} items available</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 hidden md:flex"
            onClick={() => scrollCategories("left")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 hidden md:flex"
            onClick={() => scrollCategories("right")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Category Tabs Only - No Search/Filter */}
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
              className="flex-shrink-0 rounded-full h-7 text-xs px-3"
              onClick={() => handleCategoryChange(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {displayedProducts.length > 0 ? (
          displayedProducts.map((product) => (
            <Link key={product.id} to={`/product/${product.id}`}>
              <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 hover:border-primary/50 cursor-pointer">
                <div className="relative aspect-square bg-muted">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <Badge className="absolute top-2 left-2 bg-primary/90 text-[10px] px-1.5 py-0.5">
                    {product.category}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 h-7 w-7 bg-white/80 hover:bg-white"
                    onClick={(e) => { e.preventDefault(); }}
                  >
                    <Heart className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="p-2.5 space-y-1.5">
                  <h3 className="font-medium text-xs line-clamp-2">{product.name}</h3>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-[10px] text-muted-foreground">{product.rating}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-primary text-sm">{formatPrice(product.price)}</span>
                      {product.originalPrice && (
                        <span className="text-[10px] text-muted-foreground line-through ml-1">
                          {formatPrice(product.originalPrice)}
                        </span>
                      )}
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7">
                      <ShoppingCart className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No products found matching your criteria
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredProducts.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          itemsPerPage={ITEMS_PER_PAGE}
          totalItems={filteredProducts.length}
        />
      )}
    </section>
  );
};

export default ProductsServicesSection;
