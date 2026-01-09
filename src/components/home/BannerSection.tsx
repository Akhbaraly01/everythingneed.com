import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrendingUp, Sparkles, GraduationCap, HeartPulse, ChevronLeft, ChevronRight } from "lucide-react";

interface BannerProps {
  title: string;
  subtitle: string;
  cta: string;
  link: string;
  gradient: string;
  icon: React.ReactNode;
  index?: number;
  total?: number;
}

const BannerSlide = ({ title, subtitle, cta, link, gradient, icon, index = 0, total = 1 }: BannerProps) => {
  return (
    <Link to={link} className="block group min-w-full">
      <div 
        className={`relative overflow-hidden rounded-lg bg-gradient-to-br ${gradient} h-full transition-all duration-300 hover:shadow-lg`}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-2 -right-2 w-16 h-16 rounded-full bg-white/20" />
          <div className="absolute -bottom-2 -left-2 w-20 h-20 rounded-full bg-white/10" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-between p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-sm line-clamp-2">
                {title}
              </h3>
              <p className="text-white/70 mt-0.5 text-[10px] line-clamp-2">
                {subtitle}
              </p>
            </div>
            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm shrink-0">
              {icon}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <Button 
              size="sm" 
              className="h-6 text-[10px] px-2 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
            >
              {cta}
            </Button>
            {total > 1 && (
              <span className="text-[10px] text-white/60">{index + 1}/{total}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

const BannerSection = () => {
  const [trendingIndex, setTrendingIndex] = useState(0);
  const [learnIndex, setLearnIndex] = useState(0);
  const [healthIndex, setHealthIndex] = useState(0);

  // Trending items - Large banner with auto-slide
  const trendingBanners = [
    {
      title: "Hot Trending Items",
      subtitle: "Discover what's popular right now",
      cta: "Shop Now",
      link: "/deals",
      gradient: "from-orange-500 via-rose-500 to-red-500",
      icon: <TrendingUp className="h-4 w-4 text-white" />,
    },
    {
      title: "Flash Deals",
      subtitle: "Up to 70% off - Limited time!",
      cta: "Grab Now",
      link: "/deals",
      gradient: "from-purple-500 via-pink-500 to-rose-500",
      icon: <Sparkles className="h-4 w-4 text-white" />,
    },
    {
      title: "New Arrivals",
      subtitle: "Fresh products just landed",
      cta: "Explore",
      link: "/deals",
      gradient: "from-blue-500 via-indigo-500 to-purple-500",
      icon: <TrendingUp className="h-4 w-4 text-white" />,
    },
  ];

  // Learn & Needs campaign banners
  const learnBanners = [
    {
      title: "Learn New Skills",
      subtitle: "Master in-demand skills with courses",
      cta: "Start Learning",
      link: "/learn",
      gradient: "from-emerald-500 to-teal-600",
      icon: <GraduationCap className="h-4 w-4 text-white" />,
    },
    {
      title: "Needs Categories",
      subtitle: "Everything you need, one place",
      cta: "Browse",
      link: "/deals",
      gradient: "from-amber-500 to-orange-600",
      icon: <Sparkles className="h-4 w-4 text-white" />,
    },
  ];

  // Healthcare campaign banners
  const healthBanners = [
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
      subtitle: "Order medicines with prescription",
      cta: "Order",
      link: "/pharmacy",
      gradient: "from-cyan-500 to-blue-600",
      icon: <HeartPulse className="h-4 w-4 text-white" />,
    },
  ];

  // Auto-slide for trending
  useEffect(() => {
    const interval = setInterval(() => {
      setTrendingIndex((prev) => (prev + 1) % trendingBanners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-2 gap-2">
      {/* Large Banner - Trending Items (spans full width on mobile) */}
      <div className="col-span-2 md:col-span-1 h-28 md:h-32">
        <div className="relative h-full overflow-hidden rounded-lg">
          <div 
            className="flex h-full transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${trendingIndex * 100}%)` }}
          >
            {trendingBanners.map((banner, idx) => (
              <BannerSlide 
                key={idx} 
                {...banner} 
                index={idx} 
                total={trendingBanners.length}
              />
            ))}
          </div>
          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {trendingBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setTrendingIndex(idx)}
                className={`h-1 rounded-full transition-all ${
                  idx === trendingIndex ? "w-3 bg-white" : "w-1 bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Two smaller banners side by side */}
      <div className="col-span-1 h-28 md:h-32">
        <div className="relative h-full overflow-hidden rounded-lg">
          <div 
            className="flex h-full transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${learnIndex * 100}%)` }}
          >
            {learnBanners.map((banner, idx) => (
              <BannerSlide 
                key={idx} 
                {...banner} 
                index={idx} 
                total={learnBanners.length}
              />
            ))}
          </div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {learnBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setLearnIndex(idx)}
                className={`h-1 rounded-full transition-all ${
                  idx === learnIndex ? "w-3 bg-white" : "w-1 bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="col-span-1 h-28 md:h-32">
        <div className="relative h-full overflow-hidden rounded-lg">
          <div 
            className="flex h-full transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${healthIndex * 100}%)` }}
          >
            {healthBanners.map((banner, idx) => (
              <BannerSlide 
                key={idx} 
                {...banner} 
                index={idx} 
                total={healthBanners.length}
              />
            ))}
          </div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {healthBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setHealthIndex(idx)}
                className={`h-1 rounded-full transition-all ${
                  idx === healthIndex ? "w-3 bg-white" : "w-1 bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerSection;
