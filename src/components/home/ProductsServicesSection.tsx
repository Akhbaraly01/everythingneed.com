import { useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Star, ShoppingCart, Heart, Play, FileText, Stethoscope, GraduationCap, Briefcase, Home as HomeIcon, Users } from "lucide-react";
import { allHomeProducts, HomeProduct } from "@/data/homeProductsData";
import { useCurrency } from "@/contexts/CurrencyContext";
import Pagination from "@/components/Pagination";
import { educationalVideos, extendedCourses } from "@/data/learnData";
import { healthVideos, healthDocuments } from "@/data/healthcareData";
import { needsCategoryData } from "@/data/needsData";

// Combined content types
type ContentType = "all" | "products" | "needs" | "healthcare" | "learning" | "services";

interface ContentItem {
  id: string;
  type: "product" | "need" | "healthcare" | "learning" | "service";
  name: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  rating: number;
  image: string;
  category: string;
  badge?: string;
  icon?: React.ReactNode;
  link: string;
}

const contentTabs: { id: ContentType; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All", icon: null },
  { id: "products", label: "Products", icon: <ShoppingCart className="h-3 w-3" /> },
  { id: "needs", label: "Needs", icon: <Users className="h-3 w-3" /> },
  { id: "healthcare", label: "Healthcare", icon: <Stethoscope className="h-3 w-3" /> },
  { id: "learning", label: "Learning", icon: <GraduationCap className="h-3 w-3" /> },
  { id: "services", label: "Services", icon: <Briefcase className="h-3 w-3" /> },
];

const ITEMS_PER_PAGE = 24;

const ProductsServicesSection = () => {
  const [activeTab, setActiveTab] = useState<ContentType>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { formatPrice } = useCurrency();

  // Generate combined content
  const allContent = useMemo((): ContentItem[] => {
    const content: ContentItem[] = [];

    // Add products
    allHomeProducts.slice(0, 100).forEach(product => {
      content.push({
        id: `product-${product.id}`,
        type: "product",
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        rating: product.rating,
        image: product.image,
        category: product.category,
        link: `/product/${product.id}`,
      });
    });

    // Add needs from various categories
    Object.entries(needsCategoryData).slice(0, 8).forEach(([category, items]) => {
      items.slice(0, 5).forEach(item => {
        content.push({
          id: `need-${item.id}`,
          type: "need",
          name: item.name,
          description: item.description,
          price: item.price,
          rating: item.rating,
          image: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000000)}?w=400&h=400&fit=crop`,
          category: category.charAt(0).toUpperCase() + category.slice(1),
          badge: "Need",
          link: `/needs/${category}`,
        });
      });
    });

    // Add healthcare content
    healthVideos.slice(0, 20).forEach(video => {
      content.push({
        id: `health-${video.id}`,
        type: "healthcare",
        name: video.title,
        description: video.description,
        rating: 4.5 + Math.random() * 0.5,
        image: `https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=400&fit=crop`,
        category: video.category,
        badge: video.duration,
        icon: <Play className="h-3 w-3" />,
        link: "/healthcare",
      });
    });

    healthDocuments.slice(0, 10).forEach(doc => {
      content.push({
        id: `health-doc-${doc.id}`,
        type: "healthcare",
        name: doc.title,
        description: doc.description,
        rating: 4.5 + Math.random() * 0.5,
        image: `https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400&h=400&fit=crop`,
        category: doc.category,
        badge: doc.type,
        icon: <FileText className="h-3 w-3" />,
        link: "/healthcare",
      });
    });

    // Add learning content
    educationalVideos.slice(0, 15).forEach(video => {
      content.push({
        id: `learn-video-${video.id}`,
        type: "learning",
        name: video.title,
        description: video.description,
        rating: 4.5 + Math.random() * 0.5,
        image: `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=400&fit=crop`,
        category: video.category,
        badge: video.duration,
        icon: <Play className="h-3 w-3" />,
        link: "/learn",
      });
    });

    extendedCourses.slice(0, 15).forEach(course => {
      content.push({
        id: `course-${course.id}`,
        type: "learning",
        name: course.title,
        description: course.description,
        price: course.price,
        rating: course.rating,
        image: `https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=400&h=400&fit=crop`,
        category: course.category,
        badge: course.level,
        icon: <GraduationCap className="h-3 w-3" />,
        link: "/learn",
      });
    });

    // Add services
    const services = [
      { name: "Home Cleaning", category: "Cleaning", price: 50 },
      { name: "Plumbing Repair", category: "Building", price: 80 },
      { name: "Electrical Work", category: "Building", price: 90 },
      { name: "Carpentry Services", category: "Building", price: 75 },
      { name: "Painting Services", category: "Building", price: 60 },
      { name: "Lawn Care", category: "Garden", price: 40 },
      { name: "Car Wash", category: "Auto", price: 25 },
      { name: "Pet Grooming", category: "Pets", price: 45 },
      { name: "Personal Training", category: "Fitness", price: 70 },
      { name: "Tutoring", category: "Education", price: 35 },
    ];

    services.forEach((service, i) => {
      content.push({
        id: `service-${i}`,
        type: "service",
        name: service.name,
        price: service.price,
        rating: 4.5 + Math.random() * 0.5,
        image: `https://images.unsplash.com/photo-${1560000000000 + i * 1000000}?w=400&h=400&fit=crop`,
        category: service.category,
        badge: "Service",
        icon: <Briefcase className="h-3 w-3" />,
        link: "/building-services",
      });
    });

    // Shuffle content for variety
    return content.sort(() => Math.random() - 0.5);
  }, []);

  // Filter content based on active tab
  const filteredContent = useMemo(() => {
    if (activeTab === "all") return allContent;
    return allContent.filter(item => item.type === activeTab.slice(0, -1) || 
      (activeTab === "products" && item.type === "product") ||
      (activeTab === "needs" && item.type === "need") ||
      (activeTab === "healthcare" && item.type === "healthcare") ||
      (activeTab === "learning" && item.type === "learning") ||
      (activeTab === "services" && item.type === "service")
    );
  }, [activeTab, allContent]);

  // Pagination
  const totalPages = Math.ceil(filteredContent.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const displayedContent = filteredContent.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleTabChange = (tab: ContentType) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getTypeColor = (type: ContentItem["type"]) => {
    switch (type) {
      case "product": return "bg-blue-500";
      case "need": return "bg-purple-500";
      case "healthcare": return "bg-rose-500";
      case "learning": return "bg-amber-500";
      case "service": return "bg-emerald-500";
      default: return "bg-primary";
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg md:text-xl font-bold">Products, Services & More</h2>
          <p className="text-xs text-muted-foreground">{filteredContent.length.toLocaleString()} items available</p>
        </div>
      </div>

      {/* Content Type Tabs */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {contentTabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              size="sm"
              className="flex-shrink-0 rounded-full h-8 text-xs px-4 gap-1.5"
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {displayedContent.length > 0 ? (
          displayedContent.map((item) => (
            <Link key={item.id} to={item.link}>
              <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 hover:border-primary/50 cursor-pointer h-full">
                <div className="relative aspect-square bg-muted">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop";
                    }}
                  />
                  <Badge className={`absolute top-2 left-2 ${getTypeColor(item.type)} text-[10px] px-1.5 py-0.5 gap-1`}>
                    {item.icon}
                    {item.badge || item.category}
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
                  <h3 className="font-medium text-xs line-clamp-2">{item.name}</h3>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-[10px] text-muted-foreground">{item.rating.toFixed(1)}</span>
                    <Badge variant="outline" className="text-[8px] px-1 py-0 ml-auto capitalize">
                      {item.type}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      {item.price ? (
                        <>
                          <span className="font-bold text-primary text-sm">{formatPrice(item.price)}</span>
                          {item.originalPrice && (
                            <span className="text-[10px] text-muted-foreground line-through ml-1">
                              {formatPrice(item.originalPrice)}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">View Details</span>
                      )}
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No items found
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredContent.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          itemsPerPage={ITEMS_PER_PAGE}
          totalItems={filteredContent.length}
        />
      )}
    </section>
  );
};

export default ProductsServicesSection;
