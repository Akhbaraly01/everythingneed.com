import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Sparkles, GraduationCap, HeartPulse, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BannerItem {
  title: string;
  subtitle: string;
  cta: string;
  link: string;
  gradient: string;
  icon: React.ReactNode;
}

const BannerSlide = ({ item, index, total }: { item: BannerItem; index: number; total: number }) => (
  <Link to={item.link} className="block h-full">
    <div className={`relative h-full overflow-hidden rounded-xl bg-gradient-to-br ${item.gradient} p-4 transition-all hover:shadow-lg`}>
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/20" />
        <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white/10" />
      </div>
      
      <div className="relative z-10 h-full flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-bold text-white text-sm md:text-base line-clamp-2">
              {item.title}
            </h3>
            <p className="text-white/70 mt-1 text-[11px] md:text-xs line-clamp-2">
              {item.subtitle}
            </p>
          </div>
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm shrink-0">
            {item.icon}
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-3">
          <Button 
            size="sm" 
            className="h-7 text-xs px-3 bg-white/20 hover:bg-white/30 text-white border-0"
          >
            {item.cta}
          </Button>
          {total > 1 && (
            <span className="text-xs text-white/60">{index + 1}/{total}</span>
          )}
        </div>
      </div>
    </div>
  </Link>
);

const BinanceStyleBanner = () => {
  const [leftIndex, setLeftIndex] = useState(0);
  const [rightTopIndex, setRightTopIndex] = useState(0);
  const [rightBottomIndex, setRightBottomIndex] = useState(0);

  // Left banners - Trending Items (Big)
  const leftBanners: BannerItem[] = [
    {
      title: "Hot Trending Items",
      subtitle: "Discover what's popular right now. Up to 70% off on selected items!",
      cta: "Shop Now",
      link: "/deals",
      gradient: "from-orange-500 via-rose-500 to-red-500",
      icon: <TrendingUp className="h-5 w-5 text-white" />,
    },
    {
      title: "Flash Deals",
      subtitle: "Limited time offers - Grab them before they're gone!",
      cta: "View Deals",
      link: "/deals",
      gradient: "from-purple-500 via-pink-500 to-rose-500",
      icon: <Sparkles className="h-5 w-5 text-white" />,
    },
    {
      title: "New Arrivals",
      subtitle: "Fresh products and services just landed on our platform",
      cta: "Explore",
      link: "/deals",
      gradient: "from-blue-500 via-indigo-500 to-purple-500",
      icon: <Package className="h-5 w-5 text-white" />,
    },
  ];

  // Right top banners - Needs & Learn
  const rightTopBanners: BannerItem[] = [
    {
      title: "Needs Categories",
      subtitle: "Everything you need, one place",
      cta: "Browse",
      link: "/deals",
      gradient: "from-amber-500 to-orange-600",
      icon: <Sparkles className="h-4 w-4 text-white" />,
    },
    {
      title: "Learn New Skills",
      subtitle: "Master in-demand skills",
      cta: "Start",
      link: "/learn",
      gradient: "from-emerald-500 to-teal-600",
      icon: <GraduationCap className="h-4 w-4 text-white" />,
    },
  ];

  // Right bottom banners - Healthcare
  const rightBottomBanners: BannerItem[] = [
    {
      title: "Healthcare Services",
      subtitle: "Book appointments & consultations",
      cta: "Book Now",
      link: "/healthcare",
      gradient: "from-rose-500 to-pink-600",
      icon: <HeartPulse className="h-4 w-4 text-white" />,
    },
    {
      title: "Pharmacy & Meds",
      subtitle: "Order medicines online",
      cta: "Order",
      link: "/pharmacy",
      gradient: "from-cyan-500 to-blue-600",
      icon: <HeartPulse className="h-4 w-4 text-white" />,
    },
  ];

  // Auto-slide for left banner
  useEffect(() => {
    const interval = setInterval(() => {
      setLeftIndex((prev) => (prev + 1) % leftBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [leftBanners.length]);

  // Auto-slide for right top
  useEffect(() => {
    const interval = setInterval(() => {
      setRightTopIndex((prev) => (prev + 1) % rightTopBanners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [rightTopBanners.length]);

  // Auto-slide for right bottom
  useEffect(() => {
    const interval = setInterval(() => {
      setRightBottomIndex((prev) => (prev + 1) % rightBottomBanners.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [rightBottomBanners.length]);

  return (
    <div className="grid grid-cols-5 gap-2 h-[200px] md:h-[240px]">
      {/* Left - Big Trending Banner (3 cols) */}
      <div className="col-span-3 relative overflow-hidden rounded-xl">
        <div 
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${leftIndex * 100}%)` }}
        >
          {leftBanners.map((banner, idx) => (
            <div key={idx} className="min-w-full h-full">
              <BannerSlide item={banner} index={idx} total={leftBanners.length} />
            </div>
          ))}
        </div>
        {/* Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {leftBanners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setLeftIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === leftIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
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
                <BannerSlide item={banner} index={idx} total={rightTopBanners.length} />
              </div>
            ))}
          </div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {rightTopBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setRightTopIndex(idx)}
                className={`h-1 rounded-full transition-all ${
                  idx === rightTopIndex ? "w-3 bg-white" : "w-1 bg-white/50"
                }`}
              />
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
                <BannerSlide item={banner} index={idx} total={rightBottomBanners.length} />
              </div>
            ))}
          </div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {rightBottomBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setRightBottomIndex(idx)}
                className={`h-1 rounded-full transition-all ${
                  idx === rightBottomIndex ? "w-3 bg-white" : "w-1 bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BinanceStyleBanner;
