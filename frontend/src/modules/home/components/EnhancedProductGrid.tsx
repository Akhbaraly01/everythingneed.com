import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@shared/ui/button";
import { Card } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import { 
  Star, Heart, Play, Pause, FileText, Stethoscope, GraduationCap, 
  Briefcase, Users, ChevronRight, ChevronLeft, ShoppingCart, Volume2, VolumeX,
  Loader2, Search, X, ArrowUpDown, GitCompareArrows
} from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/contexts/AuthContext";
import { useCompare } from "@/contexts/CompareContext";
import { toast } from "sonner";
import { Input } from "@shared/ui/input";
import { Skeleton } from "@shared/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { useCurrency } from "@/contexts/CurrencyContext";
import { http } from "@core/api";

const API = import.meta.env.VITE_API_URL || "/api";

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

const INITIAL_ITEMS = 20;
const LOAD_MORE_COUNT = 15;

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

// Skeleton card for loading state
const ProductCardSkeleton = () => (
  <Card className="overflow-hidden h-full flex flex-col">
    <Skeleton className="h-28 md:h-32 w-full" />
    <div className="p-2.5 space-y-2 flex-1">
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex justify-between pt-1">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
    </div>
  </Card>
);

// Product Card with Image Slider
const ProductCardSlider = ({ item, formatPrice }: { item: ContentItem; formatPrice: (p: number) => string }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuth();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { addToCompare, isInCompare, removeFromCompare } = useCompare();
  const productId = item.id.replace(/^(product-|need-|health-|learn-video-|course-|service-)/, "");
  const inWishlist = isInWishlist(productId);
  const inCompare = isInCompare(item.id);

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
                  className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  loading="lazy"
                  onLoad={() => setImageLoaded(true)}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600";
                    setImageLoaded(true);
                  }}
                />
                {!imageLoaded && <Skeleton className="absolute inset-0" />}
                
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
          
          {/* Wishlist Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className={`absolute top-2 right-2 h-7 w-7 transition-all ${
              inWishlist ? "bg-destructive/90 text-destructive-foreground opacity-100" : "bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100"
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!user) { toast.error("Please sign in to add to wishlist"); return; }
              if (inWishlist) { removeFromWishlist(productId); } else { addToWishlist(productId); }
            }}
          >
            <Heart className={`h-3.5 w-3.5 ${inWishlist ? "fill-current" : ""}`} />
          </Button>

          {/* Compare Button */}
          <Button
            variant="ghost"
            size="icon"
            className={`absolute top-10 right-2 h-7 w-7 transition-all ${
              inCompare ? "bg-primary text-primary-foreground opacity-100" : "bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100"
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (inCompare) {
                removeFromCompare(item.id);
              } else {
                const added = addToCompare({
                  id: item.id, name: item.name, price: item.price,
                  originalPrice: item.originalPrice, rating: item.rating,
                  image: item.images[0], category: item.category, description: item.description,
                });
                if (!added) toast.info("You can compare up to 3 items");
              }
            }}
          >
            <GitCompareArrows className="h-3.5 w-3.5" />
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

type SortOption = "default" | "price_low" | "price_high" | "rating" | "name";

const EnhancedProductGrid = () => {
  const [activeTab, setActiveTab] = useState<ContentType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [visibleCount, setVisibleCount] = useState(INITIAL_ITEMS);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { formatPrice } = useCurrency();

  const [allContent, setAllContent] = useState<ContentItem[]>([]);

  useEffect(() => {
    let itemIndex = 0;
    const fetchContent = async () => {
      setInitialLoading(true);
      const content: ContentItem[] = [];
      try {
        const [productsRes, coursesRes, doctorsRes, needsRes] = await Promise.allSettled([
          http.get<any>(`${API}/products?per_page=50`),
          http.get<any>(`${API}/courses?per_page=20`),
          http.get<any>(`${API}/doctors?per_page=15`),
          http.get<any>(`${API}/needs/categories`),
        ]);

        if (productsRes.status === "fulfilled") {
          const products = productsRes.value?.data || productsRes.value || [];
          (Array.isArray(products) ? products : []).forEach((p: any) => {
            content.push({
              id: `product-${p.id}`,
              type: "product",
              name: p.name,
              description: p.description,
              price: p.price,
              originalPrice: p.compare_price,
              rating: p.rating || 4.5,
              images: getProductImages(p.image_url || p.images?.[0]?.url || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600"),
              category: p.category?.name || "Products",
              link: `/product/${p.id}`,
              size: getSizeForIndex(itemIndex++),
            });
          });
        }

        if (coursesRes.status === "fulfilled") {
          const courses = coursesRes.value?.data || coursesRes.value || [];
          (Array.isArray(courses) ? courses : []).forEach((c: any) => {
            content.push({
              id: `course-${c.id}`,
              type: "learning",
              name: c.title,
              description: c.description,
              price: c.price,
              rating: c.rating || 4.5,
              images: getProductImages(c.thumbnail_url || "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=600"),
              category: c.category?.name || "Learning",
              badge: c.course_type,
              icon: <GraduationCap className="h-3 w-3" />,
              link: `/learn/course/${c.id}`,
              size: getSizeForIndex(itemIndex++),
            });
          });
        }

        if (doctorsRes.status === "fulfilled") {
          const doctors = doctorsRes.value?.data || doctorsRes.value || [];
          (Array.isArray(doctors) ? doctors : []).forEach((d: any) => {
            content.push({
              id: `doctor-${d.id}`,
              type: "healthcare",
              name: `Dr. ${d.full_name?.split(' ')[0]} ${d.full_name?.split(' ').slice(1).join(' ')}`,
              description: d.specialization,
              rating: d.rating || 4.5,
              images: getProductImages(d.avatar_url || "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=600"),
              category: d.specialization || "Healthcare",
              badge: d.is_available ? "Available" : "Busy",
              icon: <Stethoscope className="h-3 w-3" />,
              link: `/healthcare/doctor/${d.id}`,
              size: getSizeForIndex(itemIndex++),
            });
          });
        }

        if (needsRes.status === "fulfilled") {
          const categories = needsRes.value?.data || needsRes.value || [];
          (Array.isArray(categories) ? categories.slice(0, 5) : []).forEach((cat: any) => {
            (cat.needs || cat.items || []).slice(0, 3).forEach((item: any) => {
              content.push({
                id: `need-${item.id}`,
                type: "need",
                name: item.name,
                description: item.description,
                price: item.price,
                rating: item.rating || 4.5,
                images: getProductImages(item.image || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600"),
                category: cat.name || cat.category || "Needs",
                badge: "Need",
                link: `/needs/${cat.slug || cat.id}`,
                size: getSizeForIndex(itemIndex++),
              });
            });
          });
        }
      } catch (e) {
        console.error("Failed to load home content:", e);
      }
      setAllContent(content.sort(() => Math.random() - 0.5));
      setInitialLoading(false);
    };
    fetchContent();
  }, []);

  const filteredContent = useMemo(() => {
    let items = allContent;
    if (activeTab !== "all") {
      items = items.filter(item => 
        (activeTab === "products" && item.type === "product") ||
        (activeTab === "needs" && item.type === "need") ||
        (activeTab === "healthcare" && item.type === "healthcare") ||
        (activeTab === "learning" && item.type === "learning") ||
        (activeTab === "services" && item.type === "service")
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
      );
    }
    // Sorting
    if (sortBy !== "default") {
      items = [...items].sort((a, b) => {
        switch (sortBy) {
          case "price_low": return (a.price ?? 0) - (b.price ?? 0);
          case "price_high": return (b.price ?? 0) - (a.price ?? 0);
          case "rating": return b.rating - a.rating;
          case "name": return a.name.localeCompare(b.name);
          default: return 0;
        }
      });
    }
    return items;
  }, [activeTab, allContent, searchQuery, sortBy]);

  const displayedContent = filteredContent.slice(0, visibleCount);
  const hasMore = visibleCount < filteredContent.length;

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setIsLoadingMore(true);
          // Small delay for smooth UX
          setTimeout(() => {
            setVisibleCount(prev => Math.min(prev + LOAD_MORE_COUNT, filteredContent.length));
            setIsLoadingMore(false);
          }, 300);
        }
      },
      { rootMargin: "200px" }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, filteredContent.length]);

  const handleTabChange = (tab: ContentType) => {
    setActiveTab(tab);
    setVisibleCount(INITIAL_ITEMS);
    setSearchQuery("");
  };

  return (
    <section
      id="product-grid"
      tabIndex={-1}
      aria-label="Product grid"
      className="space-y-4 scroll-mt-24 outline-none"
    >
      {/* Search Bar + Sort */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products, services, courses..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setVisibleCount(INITIAL_ITEMS);
            }}
            className="pl-9 pr-9 h-10 rounded-full bg-muted/50 border-border text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); setVisibleCount(INITIAL_ITEMS); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={sortBy} onValueChange={(v) => { setSortBy(v as SortOption); setVisibleCount(INITIAL_ITEMS); }}>
          <SelectTrigger className="w-[120px] h-10 rounded-full text-xs shrink-0">
            <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="price_low">Price: Low</SelectItem>
            <SelectItem value="price_high">Price: High</SelectItem>
            <SelectItem value="rating">Top Rated</SelectItem>
            <SelectItem value="name">A-Z</SelectItem>
          </SelectContent>
        </Select>
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

      {/* Skeleton loading on initial load */}
      {initialLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 auto-rows-min">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : displayedContent.length === 0 ? (
        <div className="text-center py-12">
          <Search className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No results found for "{searchQuery}"</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => setSearchQuery("")}>
            Clear search
          </Button>
        </div>
      ) : (
        /* Masonry Grid with stagger animations */
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 auto-rows-min"
          initial="hidden"
          animate="visible"
          key={`${activeTab}-${searchQuery}`}
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
      )}

      {/* Infinite scroll sentinel */}
      {hasMore && !initialLoading && (
        <div ref={loadMoreRef} className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading more...</span>
        </div>
      )}

      {!hasMore && filteredContent.length > INITIAL_ITEMS && !initialLoading && (
        <p className="text-center text-xs text-muted-foreground py-4">
          Showing all {filteredContent.length} items
        </p>
      )}
    </section>
  );
};

export default EnhancedProductGrid;
