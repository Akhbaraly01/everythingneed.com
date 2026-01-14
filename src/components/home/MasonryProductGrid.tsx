import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Heart, Play, FileText, Stethoscope, GraduationCap, Briefcase, Users, ChevronRight, ShoppingCart } from "lucide-react";
import { allHomeProducts } from "@/data/homeProductsData";
import { useCurrency } from "@/contexts/CurrencyContext";
import { educationalVideos, extendedCourses } from "@/data/learnData";
import { healthVideos, healthDocuments } from "@/data/healthcareData";
import { needsCategoryData } from "@/data/needsData";
import Pagination from "@/components/Pagination";

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
  size: "small" | "medium" | "large" | "wide" | "tall";
}

const contentTabs: { id: ContentType; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All", icon: null },
  { id: "products", label: "Products", icon: <ShoppingCart className="h-3 w-3" /> },
  { id: "needs", label: "Needs", icon: <Users className="h-3 w-3" /> },
  { id: "healthcare", label: "Healthcare", icon: <Stethoscope className="h-3 w-3" /> },
  { id: "learning", label: "Learning", icon: <GraduationCap className="h-3 w-3" /> },
  { id: "services", label: "Services", icon: <Briefcase className="h-3 w-3" /> },
];

const ITEMS_PER_PAGE = 30;

// Assign dynamic sizes to items
const getSizeForIndex = (index: number): ContentItem["size"] => {
  const pattern = [
    "large", "small", "small", "medium", "small", "tall",
    "small", "wide", "small", "small", "medium", "small",
    "small", "small", "large", "small", "medium", "small",
    "tall", "small", "small", "wide", "small", "small",
  ];
  return pattern[index % pattern.length] as ContentItem["size"];
};

const MasonryProductGrid = () => {
  const [activeTab, setActiveTab] = useState<ContentType>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const { formatPrice } = useCurrency();

  // Generate combined content with dynamic sizes
  const allContent = useMemo((): ContentItem[] => {
    const content: ContentItem[] = [];
    let itemIndex = 0;

    // Add products
    allHomeProducts.slice(0, 60).forEach(product => {
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
        size: getSizeForIndex(itemIndex++),
      });
    });

    // Add needs
    Object.entries(needsCategoryData).slice(0, 6).forEach(([category, items]) => {
      items.slice(0, 4).forEach(item => {
        content.push({
          id: `need-${item.id}`,
          type: "need",
          name: item.name,
          description: item.description,
          price: item.price,
          rating: item.rating,
          image: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000000)}?w=600`,
          category: category.charAt(0).toUpperCase() + category.slice(1),
          badge: "Need",
          link: `/needs/${category}`,
          size: getSizeForIndex(itemIndex++),
        });
      });
    });

    // Add healthcare content
    healthVideos.slice(0, 15).forEach(video => {
      content.push({
        id: `health-${video.id}`,
        type: "healthcare",
        name: video.title,
        description: video.description,
        rating: 4.5 + Math.random() * 0.5,
        image: `https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=600`,
        category: video.category,
        badge: video.duration,
        icon: <Play className="h-3 w-3" />,
        link: "/healthcare",
        size: getSizeForIndex(itemIndex++),
      });
    });

    healthDocuments.slice(0, 8).forEach(doc => {
      content.push({
        id: `health-doc-${doc.id}`,
        type: "healthcare",
        name: doc.title,
        description: doc.description,
        rating: 4.5 + Math.random() * 0.5,
        image: `https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=600`,
        category: doc.category,
        badge: doc.type,
        icon: <FileText className="h-3 w-3" />,
        link: "/healthcare",
        size: getSizeForIndex(itemIndex++),
      });
    });

    // Add learning content
    educationalVideos.slice(0, 12).forEach(video => {
      content.push({
        id: `learn-video-${video.id}`,
        type: "learning",
        name: video.title,
        description: video.description,
        rating: 4.5 + Math.random() * 0.5,
        image: `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600`,
        category: video.category,
        badge: video.duration,
        icon: <Play className="h-3 w-3" />,
        link: "/learn",
        size: getSizeForIndex(itemIndex++),
      });
    });

    extendedCourses.slice(0, 12).forEach(course => {
      content.push({
        id: `course-${course.id}`,
        type: "learning",
        name: course.title,
        description: course.description,
        price: course.price,
        rating: course.rating,
        image: `https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=600`,
        category: course.category,
        badge: course.level,
        icon: <GraduationCap className="h-3 w-3" />,
        link: "/learn",
        size: getSizeForIndex(itemIndex++),
      });
    });

    // Add services
    const services = [
      { name: "Home Cleaning", category: "Cleaning", price: 50, img: "1581578731548-c64695cc6952" },
      { name: "Plumbing Repair", category: "Building", price: 80, img: "1585704032915-c3400ca199e7" },
      { name: "Electrical Work", category: "Building", price: 90, img: "1621905251189-08b45d6a269e" },
      { name: "Carpentry Services", category: "Building", price: 75, img: "1504148455328-c376907d081c" },
      { name: "Painting Services", category: "Building", price: 60, img: "1562259929-b4e1fd3aef09" },
      { name: "Lawn Care", category: "Garden", price: 40, img: "1558904541-efa843a96f01" },
      { name: "Car Wash", category: "Auto", price: 25, img: "1520340356584-f9917d1eea6f" },
      { name: "Pet Grooming", category: "Pets", price: 45, img: "1587300003388-59208cc962cb" },
      { name: "Personal Training", category: "Fitness", price: 70, img: "1571019614242-c5c5dee9f50b" },
      { name: "Tutoring", category: "Education", price: 35, img: "1522202176988-66273c2fd55f" },
    ];

    services.forEach((service) => {
      content.push({
        id: `service-${service.name}`,
        type: "service",
        name: service.name,
        price: service.price,
        rating: 4.5 + Math.random() * 0.5,
        image: `https://images.unsplash.com/photo-${service.img}?w=600`,
        category: service.category,
        badge: "Service",
        icon: <Briefcase className="h-3 w-3" />,
        link: "/building-services",
        size: getSizeForIndex(itemIndex++),
      });
    });

    return content.sort(() => Math.random() - 0.5);
  }, []);

  const filteredContent = useMemo(() => {
    if (activeTab === "all") return allContent;
    return allContent.filter(item => 
      (activeTab === "products" && item.type === "product") ||
      (activeTab === "needs" && item.type === "need") ||
      (activeTab === "healthcare" && item.type === "healthcare") ||
      (activeTab === "learning" && item.type === "learning") ||
      (activeTab === "services" && item.type === "service")
    );
  }, [activeTab, allContent]);

  const totalPages = Math.ceil(filteredContent.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const displayedContent = filteredContent.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleTabChange = (tab: ContentType) => {
    setActiveTab(tab);
    setCurrentPage(1);
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

  const getSizeClasses = (size: ContentItem["size"]) => {
    switch (size) {
      case "large": return "col-span-2 row-span-2";
      case "wide": return "col-span-2 row-span-1";
      case "tall": return "col-span-1 row-span-2";
      case "medium": return "col-span-1 row-span-1 md:col-span-1 md:row-span-1";
      default: return "col-span-1 row-span-1";
    }
  };

  const getImageHeight = (size: ContentItem["size"]) => {
    switch (size) {
      case "large": return "h-64 md:h-80";
      case "wide": return "h-40 md:h-48";
      case "tall": return "h-72 md:h-96";
      case "medium": return "h-40 md:h-48";
      default: return "h-32 md:h-40";
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg md:text-xl font-bold">Discover Products & Services</h2>
          <p className="text-xs text-muted-foreground">{filteredContent.length.toLocaleString()} items available</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
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

      {/* Masonry Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 auto-rows-min">
        {displayedContent.map((item) => (
          <Link
            key={item.id}
            to={item.link}
            className={`${getSizeClasses(item.size)} block`}
          >
            <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 hover:border-primary/50 cursor-pointer h-full flex flex-col">
              <div className={`relative ${getImageHeight(item.size)} bg-muted flex-shrink-0`}>
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Badge className={`absolute top-2 left-2 ${getTypeColor(item.type)} text-[10px] px-1.5 py-0.5 gap-1`}>
                  {item.icon}
                  {item.badge || item.category}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 h-7 w-7 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.preventDefault()}
                >
                  <Heart className="h-3.5 w-3.5" />
                </Button>
                {(item.size === "large" || item.size === "tall") && (
                  <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <h3 className="font-bold text-white text-sm md:text-base line-clamp-2">{item.name}</h3>
                    {item.description && (
                      <p className="text-white/80 text-xs line-clamp-2 mt-1">{item.description}</p>
                    )}
                  </div>
                )}
              </div>
              <div className="p-2.5 space-y-1.5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-medium text-xs line-clamp-2">{item.name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-[10px] text-muted-foreground">{item.rating.toFixed(1)}</span>
                    <Badge variant="outline" className="text-[8px] px-1 py-0 ml-auto capitalize">
                      {item.type}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-auto pt-1">
                  {item.price ? (
                    <div>
                      <span className="font-bold text-primary text-sm">{formatPrice(item.price)}</span>
                      {item.originalPrice && (
                        <span className="text-[10px] text-muted-foreground line-through ml-1">
                          {formatPrice(item.originalPrice)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">View Details</span>
                  )}
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {filteredContent.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          itemsPerPage={ITEMS_PER_PAGE}
          totalItems={filteredContent.length}
        />
      )}
    </section>
  );
};

export default MasonryProductGrid;
