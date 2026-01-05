import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Star, ShoppingCart } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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

// Extended sample data for products
const allProducts = [
  { id: 1, name: "iPhone 15 Pro Max 256GB", category: "Electronics", price: 1199, rating: 4.8, image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=300" },
  { id: 2, name: "Samsung Galaxy S24 Ultra", category: "Electronics", price: 1299, rating: 4.7, image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=300" },
  { id: 3, name: "MacBook Pro 14-inch M3", category: "Computers", price: 1999, rating: 4.9, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300" },
  { id: 4, name: "Sony WH-1000XM5 Headphones", category: "Audio", price: 349, rating: 4.8, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300" },
  { id: 5, name: "Nike Air Jordan 1 Retro", category: "Shoes", price: 180, rating: 4.6, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300" },
  { id: 6, name: "Organic Avocados (6 pack)", category: "Food", price: 8.99, rating: 4.5, image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=300" },
  { id: 7, name: "Premium Basmati Rice 5kg", category: "Food", price: 15.99, rating: 4.7, image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300" },
  { id: 8, name: "Leather Office Chair", category: "Furniture", price: 299, rating: 4.4, image: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=300" },
  { id: 9, name: "Standing Desk Electric", category: "Furniture", price: 449, rating: 4.6, image: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=300" },
  { id: 10, name: "Python Programming Book", category: "Books", price: 45, rating: 4.8, image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300" },
  { id: 11, name: "React Complete Guide", category: "Books", price: 55, rating: 4.9, image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300" },
  { id: 12, name: "Yoga Mat Premium", category: "Sports", price: 35, rating: 4.5, image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=300" },
  { id: 13, name: "Dumbbell Set 20kg", category: "Sports", price: 89, rating: 4.6, image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300" },
  { id: 14, name: "Ceramic Plant Pot Set", category: "Garden", price: 45, rating: 4.4, image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=300" },
  { id: 15, name: "Garden Tool Set Pro", category: "Garden", price: 79, rating: 4.7, image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300" },
  { id: 16, name: "Diamond Ring 1 Carat", category: "Jewelry", price: 2999, rating: 4.9, image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=300" },
  { id: 17, name: "Gold Necklace Chain", category: "Jewelry", price: 599, rating: 4.7, image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300" },
  { id: 18, name: "Baby Stroller Premium", category: "Baby", price: 349, rating: 4.8, image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=300" },
  { id: 19, name: "Kids Educational Tablet", category: "Kids", price: 199, rating: 4.5, image: "https://images.unsplash.com/photo-1544652478-6653e09f18a2?w=300" },
  { id: 20, name: "Pet Food Premium Dog", category: "Pets", price: 45, rating: 4.6, image: "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=300" },
  { id: 21, name: "Cat Tree Tower Deluxe", category: "Pets", price: 129, rating: 4.7, image: "https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=300" },
  { id: 22, name: "Professional DSLR Camera", category: "Cameras", price: 1299, rating: 4.8, image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300" },
  { id: 23, name: "GoPro Hero 12 Black", category: "Cameras", price: 449, rating: 4.7, image: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=300" },
  { id: 24, name: "Apple Watch Series 9", category: "Watches", price: 399, rating: 4.8, image: "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=300" },
  { id: 25, name: "Rolex Submariner Replica", category: "Watches", price: 299, rating: 4.3, image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=300" },
  { id: 26, name: "Designer Handbag Luxury", category: "Bags", price: 899, rating: 4.6, image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300" },
  { id: 27, name: "Travel Backpack 40L", category: "Bags", price: 79, rating: 4.5, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300" },
  { id: 28, name: "Smart Home Hub", category: "Appliances", price: 149, rating: 4.4, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300" },
  { id: 29, name: "Robot Vacuum Cleaner", category: "Appliances", price: 399, rating: 4.7, image: "https://images.unsplash.com/photo-1558618047-f4b511aae5ad?w=300" },
  { id: 30, name: "Air Fryer XL 5.8QT", category: "Appliances", price: 99, rating: 4.6, image: "https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=300" },
  { id: 31, name: "Skincare Set Luxury", category: "Beauty", price: 89, rating: 4.7, image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300" },
  { id: 32, name: "Makeup Palette Pro", category: "Beauty", price: 65, rating: 4.5, image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=300" },
  { id: 33, name: "Men's Suit Slim Fit", category: "Fashion", price: 299, rating: 4.6, image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300" },
  { id: 34, name: "Women's Summer Dress", category: "Fashion", price: 79, rating: 4.5, image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=300" },
  { id: 35, name: "Gaming Console PS5", category: "Gaming", price: 499, rating: 4.9, image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=300" },
  { id: 36, name: "Gaming Mouse RGB", category: "Gaming", price: 79, rating: 4.6, image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300" },
  { id: 37, name: "Electric Drill Set", category: "Tools", price: 129, rating: 4.7, image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300" },
  { id: 38, name: "Toolbox Complete Kit", category: "Tools", price: 89, rating: 4.5, image: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=300" },
  { id: 39, name: "Office Desk Organizer", category: "Office", price: 35, rating: 4.4, image: "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=300" },
  { id: 40, name: "Premium Notebook Set", category: "Stationery", price: 25, rating: 4.6, image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=300" },
  { id: 41, name: "Oil Painting Canvas Art", category: "Art", price: 199, rating: 4.8, image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=300" },
  { id: 42, name: "Electric Guitar Starter", category: "Music", price: 249, rating: 4.5, image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=300" },
  { id: 43, name: "Car Accessories Kit", category: "Auto", price: 59, rating: 4.4, image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=300" },
  { id: 44, name: "Dash Cam HD Pro", category: "Auto", price: 89, rating: 4.6, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300" },
  { id: 45, name: "Home Decor Vase Set", category: "Home Decor", price: 45, rating: 4.5, image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=300" },
  { id: 46, name: "LED String Lights", category: "Home Decor", price: 19, rating: 4.7, image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=300" },
  { id: 47, name: "Organic Fertilizer 10kg", category: "Agriculture", price: 29, rating: 4.6, image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300" },
  { id: 48, name: "Seed Starter Kit", category: "Agriculture", price: 35, rating: 4.5, image: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=300" },
];

const ITEMS_PER_PAGE = 12;

const ProductsServicesSection = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
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

  // Filter products based on category
  const filteredProducts = activeCategory === "All" 
    ? allProducts 
    : allProducts.filter(p => p.category.toLowerCase() === activeCategory.toLowerCase());

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Generate page numbers for display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) pages.push(i);
      
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    
    return pages;
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

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
              onClick={() => handleCategoryChange(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {paginatedProducts.length > 0 ? (
          paginatedProducts.map((product) => (
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

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {getPageNumbers().map((page, index) => (
              <PaginationItem key={index}>
                {page === "..." ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    onClick={() => setCurrentPage(page as number)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Page info */}
      <div className="text-center text-sm text-muted-foreground">
        Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} items
      </div>
    </section>
  );
};

export default ProductsServicesSection;
