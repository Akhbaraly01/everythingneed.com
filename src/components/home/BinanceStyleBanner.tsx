import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Sparkles, GraduationCap, HeartPulse, Package, Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BannerItem {
  title: string;
  subtitle: string;
  cta: string;
  link: string;
  gradient: string;
  icon: React.ReactNode;
}

interface TrendingItem {
  id: number;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  sales: string;
  rating: number;
}

// Left Banner - Trending Items
const trendingItems: TrendingItem[] = [
  { id: 1, name: "Wireless Earbuds Pro", price: 49.99, originalPrice: 99.99, image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200", sales: "5.2k", rating: 4.8 },
  { id: 2, name: "Smart Watch Ultra", price: 199.99, originalPrice: 299.99, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200", sales: "3.8k", rating: 4.9 },
  { id: 3, name: "Premium Laptop Stand", price: 34.99, originalPrice: 59.99, image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=200", sales: "2.1k", rating: 4.7 },
  { id: 4, name: "Bluetooth Speaker", price: 79.99, originalPrice: 129.99, image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=200", sales: "4.5k", rating: 4.6 },
];

const BannerSlide = ({ item, showTrending = false }: { item: BannerItem; showTrending?: boolean }) => (
  <Link to={item.link} className="block h-full">
    <div className={`relative h-full overflow-hidden rounded-xl bg-gradient-to-br ${item.gradient} p-3 transition-all hover:shadow-lg`}>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-white/20" />
        <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/10" />
      </div>
      
      <div className="relative z-10 h-full flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-bold text-white text-xs md:text-sm line-clamp-1">
              {item.title}
            </h3>
            <p className="text-white/70 mt-0.5 text-[10px] md:text-xs line-clamp-1">
              {item.subtitle}
            </p>
          </div>
          <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm shrink-0">
            {item.icon}
          </div>
        </div>
        
        <Button 
          size="sm" 
          className="h-6 text-[10px] px-2 bg-white/20 hover:bg-white/30 text-white border-0 w-fit"
        >
          {item.cta}
        </Button>
      </div>
    </div>
  </Link>
);

const TrendingBanner = ({ items, currentIndex }: { items: TrendingItem[]; currentIndex: number }) => {
  const item = items[currentIndex];
  
  return (
    <div className="relative h-full overflow-hidden rounded-xl bg-gradient-to-br from-orange-500 via-rose-500 to-red-500 p-3">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/20" />
        <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/10" />
      </div>
      
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div className="p-1 bg-white/20 rounded-lg">
              <TrendingUp className="h-3 w-3 text-white" />
            </div>
            <span className="text-white font-bold text-xs">Trending Now</span>
          </div>
          <Badge className="bg-white/20 text-white text-[9px] px-1.5">
            🔥 Hot
          </Badge>
        </div>
        
        {/* Product Display */}
        <div className="flex-1 flex items-center gap-2">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden bg-white/10 shrink-0">
            <img 
              src={item.image} 
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-semibold text-xs md:text-sm line-clamp-1">{item.name}</h4>
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="h-2.5 w-2.5 fill-yellow-300 text-yellow-300" />
              <span className="text-white/80 text-[10px]">{item.rating}</span>
              <span className="text-white/60 text-[10px]">• {item.sales} sold</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-white font-bold text-sm">${item.price}</span>
              <span className="text-white/50 text-xs line-through">${item.originalPrice}</span>
            </div>
          </div>
        </div>
        
        {/* Dots */}
        <div className="flex justify-center gap-1 mt-2">
          {items.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 rounded-full transition-all ${
                idx === currentIndex ? "w-3 bg-white" : "w-1 bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const BinanceStyleBanner = () => {
  const [trendingIndex, setTrendingIndex] = useState(0);
  const [rightTopIndex, setRightTopIndex] = useState(0);
  const [rightBottomIndex, setRightBottomIndex] = useState(0);

  // Right top banners - Needs & Learn
  const rightTopBanners: BannerItem[] = [
    {
      title: "Submit Your Need",
      subtitle: "We find it for you",
      cta: "Request",
      link: "/needs/request",
      gradient: "from-amber-500 to-orange-600",
      icon: <Sparkles className="h-3 w-3 text-white" />,
    },
    {
      title: "Learn Skills",
      subtitle: "Master in-demand skills",
      cta: "Start",
      link: "/learn",
      gradient: "from-emerald-500 to-teal-600",
      icon: <GraduationCap className="h-3 w-3 text-white" />,
    },
  ];

  // Right bottom banners - Healthcare
  const rightBottomBanners: BannerItem[] = [
    {
      title: "Healthcare",
      subtitle: "Book appointments",
      cta: "Book",
      link: "/healthcare",
      gradient: "from-rose-500 to-pink-600",
      icon: <HeartPulse className="h-3 w-3 text-white" />,
    },
    {
      title: "Pharmacy",
      subtitle: "Order medicines",
      cta: "Order",
      link: "/pharmacy",
      gradient: "from-cyan-500 to-blue-600",
      icon: <Package className="h-3 w-3 text-white" />,
    },
  ];

  // Independent auto-slide for trending (left)
  useEffect(() => {
    const interval = setInterval(() => {
      setTrendingIndex((prev) => (prev + 1) % trendingItems.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Independent auto-slide for right top
  useEffect(() => {
    const interval = setInterval(() => {
      setRightTopIndex((prev) => (prev + 1) % rightTopBanners.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [rightTopBanners.length]);

  // Independent auto-slide for right bottom
  useEffect(() => {
    const interval = setInterval(() => {
      setRightBottomIndex((prev) => (prev + 1) % rightBottomBanners.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [rightBottomBanners.length]);

  return (
    <div className="grid grid-cols-5 gap-2 h-[130px] md:h-[140px]">
      {/* Left - Big Trending Banner (3 cols) - reduced by 3% from previous */}
      <div className="col-span-3 relative overflow-hidden rounded-xl">
        <TrendingBanner items={trendingItems} currentIndex={trendingIndex} />
      </div>

      {/* Right Column - Two stacked banners (2 cols) */}
      <div className="col-span-2 flex flex-col gap-2">
        {/* Right Top - Needs/Learn */}
        <div className="flex-1 relative overflow-hidden rounded-xl">
          <div 
            className="flex h-full transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${rightTopIndex * 100}%)` }}
          >
            {rightTopBanners.map((banner, idx) => (
              <div key={idx} className="min-w-full h-full">
                <BannerSlide item={banner} />
              </div>
            ))}
          </div>
        </div>

        {/* Right Bottom - Healthcare */}
        <div className="flex-1 relative overflow-hidden rounded-xl">
          <div 
            className="flex h-full transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${rightBottomIndex * 100}%)` }}
          >
            {rightBottomBanners.map((banner, idx) => (
              <div key={idx} className="min-w-full h-full">
                <BannerSlide item={banner} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BinanceStyleBanner;
