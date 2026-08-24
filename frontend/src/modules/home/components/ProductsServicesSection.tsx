import { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@shared/ui/button";
import { Card } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import { ChevronLeft, ChevronRight, Star, ShoppingCart, Heart, Play, FileText, Stethoscope, GraduationCap, Briefcase, Home as HomeIcon, Users, Loader2 } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@shared/ui/pagination";
import { http } from "@core/api";

const API = import.meta.env.VITE_API_URL || "/api";

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

const SimplePagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (currentPage > 1) onPageChange(currentPage - 1);
            }}
          />
        </PaginationItem>
        {pages.map((p) => (
          <PaginationItem key={p}>
            <PaginationLink
              href="#"
              isActive={p === currentPage}
              onClick={(e) => {
                e.preventDefault();
                onPageChange(p);
              }}
            >
              {p}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (currentPage < totalPages) onPageChange(currentPage + 1);
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

const ProductsServicesSection = () => {
  const [activeTab, setActiveTab] = useState<ContentType>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [allContent, setAllContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      const content: ContentItem[] = [];
      try {
        const [productsRes, coursesRes, doctorsRes, needsRes] = await Promise.allSettled([
          http.get<any>(`${API}/products?per_page=100`),
          http.get<any>(`${API}/courses?per_page=30`),
          http.get<any>(`${API}/doctors?per_page=20`),
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
              image: p.image_url || p.images?.[0]?.url || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop",
              category: p.category?.name || "Products",
              link: `/product/${p.id}`,
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
              image: c.thumbnail_url || "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=400&h=400&fit=crop",
              category: c.category?.name || "Learning",
              badge: c.course_type,
              icon: <GraduationCap className="h-3 w-3" />,
              link: `/learn/course/${c.id}`,
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
              image: d.avatar_url || "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=400&fit=crop",
              category: d.specialization || "Healthcare",
              badge: d.is_available ? "Available" : "Busy",
              icon: <Stethoscope className="h-3 w-3" />,
              link: `/healthcare/doctor/${d.id}`,
            });
          });
        }

        if (needsRes.status === "fulfilled") {
          const categories = needsRes.value?.data || needsRes.value || [];
          (Array.isArray(categories) ? categories.slice(0, 8) : []).forEach((cat: any) => {
            (cat.needs || cat.items || []).slice(0, 5).forEach((item: any) => {
              content.push({
                id: `need-${item.id}`,
                type: "need",
                name: item.name,
                description: item.description,
                price: item.price,
                rating: item.rating || 4.5,
                image: item.image || `https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=400&fit=crop`,
                category: cat.name || cat.category || "Needs",
                badge: "Need",
                link: `/needs/${cat.slug || cat.id}`,
              });
            });
          });
        }
      } catch (e) {
        console.error("Failed to load home content:", e);
      }
      setAllContent(content.sort(() => Math.random() - 0.5));
      setLoading(false);
    };
    fetchContent();
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
        {loading ? (
          Array.from({ length: 12 }).map((_, i) => (
            <Card key={i} className="overflow-hidden h-full">
              <div className="aspect-square bg-muted animate-pulse" />
              <div className="p-2.5 space-y-2">
                <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
              </div>
            </Card>
          ))
        ) : displayedContent.length > 0 ? (
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
        <SimplePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </section>
  );
};

export default ProductsServicesSection;
