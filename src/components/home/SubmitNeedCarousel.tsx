import { useState } from "react";
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
  const itemsPerView = 2; // Show 2 items at a time on mobile
  const maxIndex = Math.max(0, requestTypes.length - itemsPerView);

  const goNext = () => setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  const goPrev = () => setCurrentIndex(prev => Math.max(prev - 1, 0));

  return (
    <section className="py-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Submit Your Need
        </h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={goPrev}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={goNext}
            disabled={currentIndex >= maxIndex}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden">
        <div 
          className="flex gap-2 transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 50}%)` }}
        >
          {requestTypes.map((request) => (
            <Link
              key={request.id}
              to={request.link}
              className="min-w-[48%] md:min-w-[24%]"
            >
              <div className={`bg-gradient-to-br ${request.gradient} rounded-lg p-3 h-20 flex items-center gap-3 hover:scale-[1.02] transition-transform`}>
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

      {/* Dot Indicators */}
      <div className="flex justify-center gap-1 mt-2">
        {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 rounded-full transition-all ${
              idx === currentIndex ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default SubmitNeedCarousel;
