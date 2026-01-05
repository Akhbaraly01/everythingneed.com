import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Star, ShoppingCart } from "lucide-react";
import { products } from "@/data/mockData";

const categories = [
  "All", "Products", "Health", "Electronics", "Books", "Building", "Labour", 
  "Learn", "E-commerce", "Fashion", "Food", "Agriculture", "Transportation", 
  "Hotels", "Jobs", "Real Estate", "Tasks", "Booking", "Gaming", "Beauty", 
  "Auto", "Sports", "Home Decor", "Furniture", "Appliances", "Mobile", 
  "Computers", "Cameras", "Audio", "Watches", "Jewelry", "Bags", "Shoes", 
  "Kids", "Baby", "Pets", "Garden", "Tools", "Office", "Stationery", "Art", 
  "Music", "Movies", "Software", "Services", "Consulting", "Legal", "Finance", 
  "Insurance", "Travel", "Events", "Catering", "Cleaning", "Repair", 
  "Maintenance", "Security", "Education", "Training"
];

const ProductsServicesSection = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollCategories = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Filter products based on category (mock filtering)
  const filteredProducts = activeCategory === "All" 
    ? products 
    : products.filter(p => p.category.toLowerCase().includes(activeCategory.toLowerCase()));

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold">Products & Services</h2>
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
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden group hover:shadow-lg transition-all duration-300 hover:border-primary/50"
            >
              <div className="relative aspect-square bg-muted">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <Badge className="absolute top-2 left-2 bg-primary/90">
                  {activeCategory === "All" ? product.category : activeCategory}
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
    </section>
  );
};

export default ProductsServicesSection;
