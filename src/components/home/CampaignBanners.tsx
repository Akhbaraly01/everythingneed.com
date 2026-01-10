import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Sparkles, Gift, Percent, TrendingUp, Zap, Star,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Campaign {
  id: number;
  title: string;
  subtitle: string;
  cta: string;
  link: string;
  gradient: string;
  icon: React.ReactNode;
}

const campaigns: Campaign[] = [
  {
    id: 1,
    title: "Flash Sale - Up to 70% Off",
    subtitle: "Limited time offers on thousands of items",
    cta: "Shop Now",
    link: "/deals",
    gradient: "from-orange-500 via-rose-500 to-red-500",
    icon: <Zap className="h-6 w-6 text-white" />,
  },
  {
    id: 2,
    title: "New User Bonus",
    subtitle: "Get $50 off your first order",
    cta: "Claim Now",
    link: "/auth",
    gradient: "from-purple-500 via-pink-500 to-rose-500",
    icon: <Gift className="h-6 w-6 text-white" />,
  },
  {
    id: 3,
    title: "Premium Services",
    subtitle: "Access exclusive healthcare & learning",
    cta: "Explore",
    link: "/healthcare",
    gradient: "from-blue-500 via-indigo-500 to-purple-500",
    icon: <Sparkles className="h-6 w-6 text-white" />,
  },
  {
    id: 4,
    title: "Daily Deals",
    subtitle: "Save up to 50% on top products",
    cta: "View Deals",
    link: "/deals",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    icon: <Percent className="h-6 w-6 text-white" />,
  },
  {
    id: 5,
    title: "Trending Now",
    subtitle: "Discover what's hot this week",
    cta: "Browse",
    link: "/deals",
    gradient: "from-amber-500 via-orange-500 to-red-500",
    icon: <TrendingUp className="h-6 w-6 text-white" />,
  },
  {
    id: 6,
    title: "VIP Membership",
    subtitle: "Unlock exclusive rewards & benefits",
    cta: "Join Now",
    link: "/account",
    gradient: "from-yellow-500 via-amber-500 to-orange-500",
    icon: <Star className="h-6 w-6 text-white" />,
  },
];

const CampaignBanners = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % campaigns.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % campaigns.length);
  };

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + campaigns.length) % campaigns.length);
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Campaign Slider */}
      <div 
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {campaigns.map((campaign) => (
          <Link 
            key={campaign.id} 
            to={campaign.link}
            className="min-w-full"
          >
            <div className={`relative h-24 md:h-28 overflow-hidden rounded-xl bg-gradient-to-r ${campaign.gradient} p-4`}>
              {/* Background decorations */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -top-4 -right-8 w-24 h-24 rounded-full bg-white/20" />
                <div className="absolute -bottom-4 -left-8 w-32 h-32 rounded-full bg-white/10" />
              </div>
              
              <div className="relative z-10 h-full flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                      {campaign.icon}
                    </div>
                    <h3 className="font-bold text-white text-sm md:text-base line-clamp-1">
                      {campaign.title}
                    </h3>
                  </div>
                  <p className="text-white/80 text-xs md:text-sm line-clamp-1 ml-10">
                    {campaign.subtitle}
                  </p>
                </div>
                <Button 
                  size="sm" 
                  className="h-8 text-xs px-4 bg-white/20 hover:bg-white/30 text-white border-0 shrink-0 ml-2"
                >
                  {campaign.cta}
                </Button>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 bg-black/30 hover:bg-black/50 text-white rounded-full"
        onClick={goPrev}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 bg-black/30 hover:bg-black/50 text-white rounded-full"
        onClick={goNext}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        {campaigns.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 rounded-full transition-all ${
              idx === currentIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default CampaignBanners;
