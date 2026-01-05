import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Campaign {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  link: string;
  gradient: string;
  icon: string;
}

const campaigns: Campaign[] = [
  {
    id: "1",
    title: "New Year Mega Sale",
    subtitle: "Up to 50% off on all products. Limited time offer!",
    cta: "Shop Now",
    link: "/deals",
    gradient: "from-primary via-primary/80 to-secondary",
    icon: "🎉",
  },
  {
    id: "2",
    title: "Learn New Skills in 2026",
    subtitle: "Master in-demand skills with expert-led courses",
    cta: "Start Learning",
    link: "/learn",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    icon: "🎓",
  },
  {
    id: "3",
    title: "Healthcare at Your Doorstep",
    subtitle: "Book appointments & order medicines online",
    cta: "Book Now",
    link: "/healthcare",
    gradient: "from-rose-500 via-pink-500 to-fuchsia-500",
    icon: "🏥",
  },
  {
    id: "4",
    title: "Farm Fresh Products",
    subtitle: "Direct from farm to your table. Organic & healthy!",
    cta: "Explore",
    link: "/deals/agriculture",
    gradient: "from-lime-500 via-green-500 to-emerald-500",
    icon: "🌾",
  },
  {
    id: "5",
    title: "Travel & Hotel Deals",
    subtitle: "Plan your perfect getaway with exclusive discounts",
    cta: "Book Hotels",
    link: "/deals/hotels",
    gradient: "from-amber-500 via-orange-500 to-red-500",
    icon: "✈️",
  },
  {
    id: "6",
    title: "Find Your Dream Job",
    subtitle: "Connect with top employers and land your next opportunity",
    cta: "Browse Jobs",
    link: "/deals/jobs",
    gradient: "from-indigo-500 via-purple-500 to-pink-500",
    icon: "💼",
  },
];

const CampaignCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % campaigns.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goTo = (index: number) => {
    setCurrent(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goNext = () => goTo((current + 1) % campaigns.length);
  const goPrev = () => goTo((current - 1 + campaigns.length) % campaigns.length);

  return (
    <section className="relative h-56 md:h-72 lg:h-96 overflow-hidden rounded-xl md:rounded-2xl mx-4 md:mx-0">
      {/* Slides */}
      <div
        className="flex transition-transform duration-500 ease-out h-full"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            className={`min-w-full h-full bg-gradient-to-r ${campaign.gradient} flex items-center relative overflow-hidden`}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 text-8xl md:text-9xl">
                {campaign.icon}
              </div>
              <div className="absolute bottom-10 right-10 text-6xl md:text-8xl rotate-12">
                {campaign.icon}
              </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-6 md:px-8 relative z-10">
              <div className="max-w-xl">
                <span className="text-4xl md:text-5xl mb-2 md:mb-4 block">
                  {campaign.icon}
                </span>
                <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-2 md:mb-4">
                  {campaign.title}
                </h2>
                <p className="text-sm md:text-lg text-primary-foreground/90 mb-4 md:mb-6">
                  {campaign.subtitle}
                </p>
                <Link to={campaign.link}>
                  <Button
                    size="lg"
                    className="bg-background text-foreground hover:bg-background/90 shadow-lg"
                  >
                    {campaign.cta}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-background/20 hover:bg-background/40 text-primary-foreground backdrop-blur-sm"
        onClick={goPrev}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-background/20 hover:bg-background/40 text-primary-foreground backdrop-blur-sm"
        onClick={goNext}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      {/* Dot Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {campaigns.map((_, index) => (
          <button
            key={index}
            onClick={() => goTo(index)}
            className={`h-2 rounded-full transition-all ${
              index === current
                ? "w-8 bg-primary-foreground"
                : "w-2 bg-primary-foreground/50 hover:bg-primary-foreground/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default CampaignCarousel;
