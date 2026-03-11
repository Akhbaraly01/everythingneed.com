import { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Star, Heart, Play, Pause, FileText, Stethoscope, GraduationCap, 
  Briefcase, Users, ChevronRight, ChevronLeft, ShoppingCart, Volume2, VolumeX
} from "lucide-react";
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
  images: string[];
  category: string;
  badge?: string;
  icon?: React.ReactNode;
  link: string;
  size: "small" | "medium" | "large";
  hasVideo?: boolean;
  videoUrl?: string;
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

// More varied sizes for visual interest
const getSizeForIndex = (index: number): ContentItem["size"] => {
  const pattern = [
    "small", "small", "medium", "small", "small", "large",
    "small", "medium", "small", "small", "small", "medium",
    "small", "small", "small", "large", "small", "small",
    "medium", "small", "small", "small", "medium", "small",
  ];
  return pattern[index % pattern.length] as ContentItem["size"];
};

// Generate multiple images for each product
const getProductImages = (baseImage: string, count: number = 4): string[] => {
  const images = [baseImage];
  for (let i = 1; i < count; i++) {
    images.push(`${baseImage.split('?')[0]}?w=600&h=600&fit=crop&${i}`);
  }
  return images;
};

// Product Card with Image Slider
const ProductCardSlider = ({ item, formatPrice }: { item: ContentItem; formatPrice: (p: number) => string }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(prev => prev === 0 ? item.images.length - 1 : prev - 1);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(prev => prev === item.images.length - 1 ? 0 : prev + 1);
  };

  const toggleVideo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
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

  const getSizeClasses = () => {
    switch (item.size) {
      case "large": return "col-span-2 row-span-2";
      case "medium": return "col-span-1 row-span-1";
      default: return "col-span-1 row-span-1";
    }
  };

  const getImageHeight = () => {
    switch (item.size) {
      case "large": return "h-48 md:h-64";
      case "medium": return "h-32 md:h-40";
      default: return "h-28 md:h-32";
    }
  };

  return (
    <Link to={item.link} className={`${getSizeClasses()} block`}>
      <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 hover:border-primary/50 hover:scale-[1.03] cursor-pointer h-full flex flex-col">
        <div className={`relative ${getImageHeight()} bg-muted flex-shrink-0 overflow-hidden`}>
          {/* Image Slider */}
          <div className="relative w-full h-full">
            {item.hasVideo && item.videoUrl ? (
              // Video Preview
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  src={item.videoUrl}
                  className="w-full h-full object-cover"
                  muted={isMuted}
                  loop
                  playsInline
                  onEnded={() => setIsPlaying(false)}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-10 w-10 rounded-full bg-white/90 hover:bg-white"
                    onClick={toggleVideo}
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>
                </div>
                {isPlaying && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute bottom-2 right-2 h-7 w-7 bg-black/50 hover:bg-black/70 text-white"
                    onClick={toggleMute}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            ) : (
              // Image Slider
              <>
                <img
                  src={item.images[currentImageIndex]}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600";
                  }}
                />
                
                {/* Image Navigation */}
                {item.images.length > 1 && (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute left-1 top-1/2 -translate-y-1/2 h-6 w-6 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={handlePrevImage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={handleNextImage}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    
                    {/* Image Dots */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                      {item.images.map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${
                            idx === currentImageIndex ? 'bg-white w-3' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
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

          {/* Discount Badge */}
          {item.originalPrice && item.price && item.originalPrice > item.price && (
            <Badge className="absolute bottom-2 left-2 bg-destructive text-[10px]">
              -{Math.round((1 - item.price / item.originalPrice) * 100)}%
            </Badge>
          )}
        </div>

        <div className="p-2.5 space-y-1.5 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-medium text-xs line-clamp-2">{item.name}</h3>
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-[10px] text-muted-foreground">{item.rating.toFixed(1)}</span>
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
  );
};

const EnhancedProductGrid = () => {
  const [activeTab, setActiveTab] = useState<ContentType>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const { formatPrice } = useCurrency();

  // Generate combined content with dynamic sizes and multiple images
  const allContent = useMemo((): ContentItem[] => {
    const content: ContentItem[] = [];
    let itemIndex = 0;

    // Add products with multiple images
    allHomeProducts.slice(0, 50).forEach(product => {
      content.push({
        id: `product-${product.id}`,
        type: "product",
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        rating: product.rating,
        images: getProductImages(product.image),
        category: product.category,
        link: `/product/${product.id}`,
        size: getSizeForIndex(itemIndex++),
      });
    });

    // Add needs with images
    Object.entries(needsCategoryData).slice(0, 5).forEach(([category, items]) => {
      items.slice(0, 3).forEach(item => {
        content.push({
          id: `need-${item.id}`,
          type: "need",
          name: item.name,
          description: item.description,
          price: item.price,
          rating: item.rating,
          images: [
            `https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600`,
            `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600`,
          ],
          category: category.charAt(0).toUpperCase() + category.slice(1),
          badge: "Need",
          link: `/needs/${category}`,
          size: getSizeForIndex(itemIndex++),
        });
      });
    });

    // Add healthcare with video previews
    healthVideos.slice(0, 10).forEach(video => {
      content.push({
        id: `health-${video.id}`,
        type: "healthcare",
        name: video.title,
        description: video.description,
        rating: 4.5 + Math.random() * 0.5,
        images: [`https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=600`],
        category: video.category,
        badge: video.duration,
        icon: <Play className="h-3 w-3" />,
        link: "/healthcare",
        size: getSizeForIndex(itemIndex++),
        hasVideo: true,
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      });
    });

    // Add learning content with videos
    educationalVideos.slice(0, 10).forEach(video => {
      content.push({
        id: `learn-video-${video.id}`,
        type: "learning",
        name: video.title,
        description: video.description,
        rating: 4.5 + Math.random() * 0.5,
        images: [`https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600`],
        category: video.category,
        badge: video.duration,
        icon: <Play className="h-3 w-3" />,
        link: "/learn",
        size: getSizeForIndex(itemIndex++),
        hasVideo: true,
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      });
    });

    // Add courses
    extendedCourses.slice(0, 10).forEach(course => {
      content.push({
        id: `course-${course.id}`,
        type: "learning",
        name: course.title,
        description: course.description,
        price: course.price,
        rating: course.rating,
        images: [
          `https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=600`,
          `https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600`,
        ],
        category: course.category,
        badge: course.level,
        icon: <GraduationCap className="h-3 w-3" />,
        link: `/learn/course/${course.id}`,
        size: getSizeForIndex(itemIndex++),
      });
    });

    // Add services
    const services = [
      { name: "Home Cleaning", category: "Cleaning", price: 50 },
      { name: "Plumbing Repair", category: "Building", price: 80 },
      { name: "Electrical Work", category: "Building", price: 90 },
      { name: "Carpentry", category: "Building", price: 75 },
      { name: "Painting", category: "Building", price: 60 },
    ];

    services.forEach((service) => {
      content.push({
        id: `service-${service.name}`,
        type: "service",
        name: service.name,
        price: service.price,
        rating: 4.5 + Math.random() * 0.5,
        images: [
          `https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600`,
          `https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600`,
        ],
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

  return (
    <section className="space-y-4">
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

      {/* Masonry Grid with stagger animations */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 auto-rows-min"
        initial="hidden"
        animate="visible"
        key={`${activeTab}-${currentPage}`}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.04 } },
        }}
      >
        {displayedContent.map((item) => (
          <motion.div
            key={item.id}
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
            }}
          >
            <ProductCardSlider item={item} formatPrice={formatPrice} />
          </motion.div>
        ))}
      </motion.div>

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

export default EnhancedProductGrid;
