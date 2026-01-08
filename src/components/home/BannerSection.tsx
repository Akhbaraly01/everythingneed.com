import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrendingUp, Sparkles, ShoppingBag, Star, Users, Zap } from "lucide-react";

interface BannerProps {
  title: string;
  subtitle: string;
  cta: string;
  link: string;
  gradient: string;
  icon: React.ReactNode;
  size?: "large" | "small";
}

const Banner = ({ title, subtitle, cta, link, gradient, icon, size = "large" }: BannerProps) => {
  const isLarge = size === "large";
  
  return (
    <Link to={link} className="block group">
      <div 
        className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${gradient} 
          ${isLarge ? "h-48 md:h-56" : "h-36 md:h-44"} 
          transition-all duration-300 hover:shadow-lg hover:scale-[1.02]`}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/20" />
          <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full bg-white/10" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-between p-4 md:p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className={`font-bold text-white ${isLarge ? "text-lg md:text-xl" : "text-base md:text-lg"}`}>
                {title}
              </h3>
              <p className={`text-white/80 mt-1 ${isLarge ? "text-sm" : "text-xs"} line-clamp-2`}>
                {subtitle}
              </p>
            </div>
            <div className={`${isLarge ? "p-2.5" : "p-2"} bg-white/20 rounded-lg backdrop-blur-sm`}>
              {icon}
            </div>
          </div>
          
          <Button 
            size="sm" 
            className="w-fit bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
          >
            {cta}
          </Button>
        </div>
      </div>
    </Link>
  );
};

const BannerSection = () => {
  const banners = {
    large: {
      title: "Popular Services",
      subtitle: "Discover top-rated services from verified vendors. Quality guaranteed!",
      cta: "Explore Now",
      link: "/deals",
      gradient: "from-violet-600 via-purple-600 to-indigo-700",
      icon: <Star className="h-6 w-6 text-white" />,
    },
    small1: {
      title: "Trending Now",
      subtitle: "Hot deals on trending products",
      cta: "Shop Deals",
      link: "/deals",
      gradient: "from-orange-500 to-rose-500",
      icon: <TrendingUp className="h-5 w-5 text-white" />,
    },
    small2: {
      title: "Flash Sale",
      subtitle: "Up to 70% off - Limited time!",
      cta: "Grab Now",
      link: "/deals",
      gradient: "from-emerald-500 to-teal-600",
      icon: <Zap className="h-5 w-5 text-white" />,
    },
  };

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4">
      {/* Large Banner - Full Width on first row */}
      <div className="col-span-2 md:col-span-1">
        <Banner {...banners.large} size="large" />
      </div>
      
      {/* Two Small Banners */}
      <div className="col-span-1 md:col-span-1 flex flex-col gap-3 md:gap-4">
        <Banner {...banners.small1} size="small" />
      </div>
      <div className="col-span-1 md:col-span-2 md:hidden">
        <Banner {...banners.small2} size="small" />
      </div>
      
      {/* Desktop layout adjustment */}
      <div className="hidden md:block md:col-span-1">
        <Banner {...banners.small2} size="small" />
      </div>
    </div>
  );
};

export default BannerSection;
