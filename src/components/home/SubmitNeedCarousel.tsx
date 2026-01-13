import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Package, Heart, Wrench, Building, Tractor, HelpCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RequestType {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  link: string;
}

const requestTypes: RequestType[] = [
  {
    id: "product",
    title: "Request Product",
    subtitle: "Can't find a product? Let us source it for you",
    icon: <Package className="h-5 w-5 text-white" />,
    gradient: "from-blue-500 to-indigo-600",
    link: "/needs/request?type=product"
  },
  {
    id: "healthcare",
    title: "Healthcare Request",
    subtitle: "Medical assistance, appointments & consultations",
    icon: <Heart className="h-5 w-5 text-white" />,
    gradient: "from-rose-500 to-pink-600",
    link: "/healthcare"
  },
  {
    id: "worker",
    title: "Request Workers",
    subtitle: "Find skilled laborers for your projects",
    icon: <Wrench className="h-5 w-5 text-white" />,
    gradient: "from-amber-500 to-orange-600",
    link: "/needs/request?type=worker"
  },
  {
    id: "building",
    title: "Construction Services",
    subtitle: "Engineers, contractors & building materials",
    icon: <Building className="h-5 w-5 text-white" />,
    gradient: "from-slate-500 to-gray-700",
    link: "/needs/request?type=building"
  },
  {
    id: "agriculture",
    title: "Agriculture Needs",
    subtitle: "Farm equipment, seeds & agricultural workers",
    icon: <Tractor className="h-5 w-5 text-white" />,
    gradient: "from-green-500 to-emerald-600",
    link: "/deals/agriculture"
  },
  {
    id: "general",
    title: "General Request",
    subtitle: "Any other service or product you need",
    icon: <HelpCircle className="h-5 w-5 text-white" />,
    gradient: "from-purple-500 to-violet-600",
    link: "/needs/request?type=general"
  },
  {
    id: "services",
    title: "Professional Services",
    subtitle: "Mechanics, electricians, plumbers & more",
    icon: <Users className="h-5 w-5 text-white" />,
    gradient: "from-cyan-500 to-teal-600",
    link: "/needs/request?type=services"
  }
];

const SubmitNeedCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const itemsPerView = 2; // Show 2 items at a time on mobile
  const maxIndex = Math.max(0, requestTypes.length - itemsPerView);

  const goNext = useCallback(() => {
    setCurrentIndex(prev => prev >= maxIndex ? 0 : prev + 1);
  }, [maxIndex]);

  const goPrev = useCallback(() => {
    setCurrentIndex(prev => prev <= 0 ? maxIndex : prev - 1);
  }, [maxIndex]);

  // Auto-slide effect
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      goNext();
    }, 4000); // Slide every 4 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, goNext]);

  // Pause auto-play on hover/touch
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  return (
    <section 
      className="py-4"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseEnter}
      onTouchEnd={handleMouseLeave}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Submit Your Need
          </h3>
          {/* Auto-play indicator */}
          <div className={`h-2 w-2 rounded-full transition-colors ${isAutoPlaying ? "bg-green-500 animate-pulse" : "bg-muted"}`} />
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              setIsAutoPlaying(false);
              goPrev();
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              setIsAutoPlaying(false);
              goNext();
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden">
        <div 
          className="flex gap-2 transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 50}%)` }}
        >
          {requestTypes.map((request) => (
            <Link
              key={request.id}
              to={request.link}
              className="min-w-[48%] md:min-w-[24%]"
            >
              <div className={`bg-gradient-to-br ${request.gradient} rounded-lg p-3 h-20 flex items-center gap-3 hover:scale-[1.02] transition-transform shadow-md hover:shadow-lg`}>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm shrink-0">
                  {request.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{request.title}</p>
                  <p className="text-[10px] text-white/70 line-clamp-2">{request.subtitle}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Dot Indicators with progress */}
      <div className="flex justify-center gap-1.5 mt-3">
        {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setCurrentIndex(idx);
              setIsAutoPlaying(false);
            }}
            className="relative h-1.5 rounded-full overflow-hidden transition-all"
            style={{ width: idx === currentIndex ? "24px" : "8px" }}
          >
            <div className="absolute inset-0 bg-muted-foreground/30" />
            {idx === currentIndex && (
              <div 
                className="absolute inset-0 bg-primary origin-left"
                style={{
                  animation: isAutoPlaying ? "progress 4s linear infinite" : "none",
                  width: isAutoPlaying ? "100%" : "100%",
                }}
              />
            )}
            {idx !== currentIndex && (
              <div className="absolute inset-0 bg-muted-foreground/30" />
            )}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </section>
  );
};

export default SubmitNeedCarousel;
