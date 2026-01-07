import { useState } from "react";
import {
  Smartphone,
  Shirt,
  Home,
  Dumbbell,
  BookOpen,
  Gamepad2,
  Sparkles,
  Car,
  Calendar,
  CheckSquare,
  Plane,
  Hotel,
  Building2,
  Briefcase,
  Wheat,
  UtensilsCrossed,
  GraduationCap,
  HeartPulse,
  Pill,
  Users,
  Truck,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Wrench,
  Baby,
  Dog,
  Leaf,
  Hammer,
  Camera,
  Music,
  Palette,
  Globe,
  Shield,
  Headphones,
  Watch,
  Gift,
  Coffee,
  Scissors,
  Bike,
  Tv,
  Printer,
} from "lucide-react";
import BinanceStyleCategory from "./BinanceStyleCategory";
import { Button } from "@/components/ui/button";

const quickAccessCategories = [
  { name: "Electronics", icon: Smartphone, link: "/needs/electronics", gradient: "from-blue-500 to-blue-600" },
  { name: "Fashion", icon: Shirt, link: "/needs/fashion", gradient: "from-pink-500 to-rose-500" },
  { name: "Home", icon: Home, link: "/needs/home", gradient: "from-amber-500 to-orange-500" },
  { name: "Sports", icon: Dumbbell, link: "/needs/sports", gradient: "from-green-500 to-emerald-500" },
  { name: "Booking", icon: Calendar, link: "/deals/booking", gradient: "from-cyan-500 to-blue-500" },
  { name: "Tasks", icon: CheckSquare, link: "/deals/tasks", gradient: "from-teal-500 to-emerald-500" },
  { name: "Transport", icon: Plane, link: "/deals/transportation", gradient: "from-sky-500 to-indigo-500" },
  { name: "Hotels", icon: Hotel, link: "/deals/hotels", gradient: "from-yellow-500 to-amber-500" },
  { name: "Books", icon: BookOpen, link: "/needs/books", gradient: "from-violet-500 to-purple-500" },
  { name: "Gaming", icon: Gamepad2, link: "/needs/gaming", gradient: "from-red-500 to-rose-500" },
  { name: "Beauty", icon: Sparkles, link: "/needs/beauty", gradient: "from-fuchsia-500 to-pink-500" },
  { name: "Auto", icon: Car, link: "/needs/auto", gradient: "from-slate-500 to-gray-600" },
  { name: "Real Estate", icon: Building2, link: "/deals/real-estate", gradient: "from-stone-500 to-zinc-600" },
  { name: "Jobs", icon: Briefcase, link: "/deals/jobs", gradient: "from-indigo-500 to-violet-500" },
  { name: "Agriculture", icon: Wheat, link: "/deals/agriculture", gradient: "from-lime-500 to-green-500" },
  { name: "Food", icon: UtensilsCrossed, link: "/deals/food", gradient: "from-orange-500 to-red-500" },
  { name: "Baby", icon: Baby, link: "/needs/baby", gradient: "from-pink-400 to-rose-400" },
  { name: "Pets", icon: Dog, link: "/needs/pets", gradient: "from-amber-400 to-yellow-500" },
  { name: "Garden", icon: Leaf, link: "/needs/garden", gradient: "from-green-400 to-emerald-500" },
  { name: "Tools", icon: Hammer, link: "/needs/tools", gradient: "from-gray-500 to-slate-600" },
  { name: "Camera", icon: Camera, link: "/needs/cameras", gradient: "from-purple-500 to-violet-600" },
  { name: "Music", icon: Music, link: "/needs/music", gradient: "from-red-400 to-pink-500" },
  { name: "Art", icon: Palette, link: "/needs/art", gradient: "from-cyan-400 to-blue-500" },
  { name: "Services", icon: Wrench, link: "/deals", gradient: "from-orange-400 to-amber-500" },
];

const serviceCategories = [
  { name: "Courses", icon: GraduationCap, link: "/learn", gradient: "from-emerald-500 to-teal-500" },
  { name: "Healthcare", icon: HeartPulse, link: "/healthcare", gradient: "from-rose-500 to-pink-500" },
  { name: "Pharmacy", icon: Pill, link: "/pharmacy", gradient: "from-blue-500 to-cyan-500" },
  { name: "Community", icon: Users, link: "/community", gradient: "from-purple-500 to-fuchsia-500" },
  { name: "Delivery", icon: Truck, link: "/delivery", gradient: "from-amber-500 to-yellow-500" },
  { name: "Shopping", icon: ShoppingBag, link: "/deals", gradient: "from-pink-500 to-rose-500" },
  { name: "Security", icon: Shield, link: "/security", gradient: "from-slate-500 to-gray-600" },
  { name: "Audio", icon: Headphones, link: "/needs/audio", gradient: "from-indigo-500 to-blue-500" },
  { name: "Watches", icon: Watch, link: "/needs/watches", gradient: "from-yellow-500 to-orange-500" },
  { name: "Gifts", icon: Gift, link: "/needs/gifts", gradient: "from-red-500 to-pink-500" },
  { name: "Cafe", icon: Coffee, link: "/needs/cafe", gradient: "from-amber-600 to-yellow-600" },
  { name: "Salon", icon: Scissors, link: "/needs/salon", gradient: "from-fuchsia-400 to-pink-500" },
  { name: "Fitness", icon: Bike, link: "/needs/fitness", gradient: "from-green-500 to-teal-500" },
  { name: "TV", icon: Tv, link: "/needs/tv", gradient: "from-blue-600 to-indigo-600" },
  { name: "Printing", icon: Printer, link: "/needs/printing", gradient: "from-gray-500 to-zinc-600" },
  { name: "Global", icon: Globe, link: "/needs/global", gradient: "from-cyan-500 to-blue-600" },
];

export const QuickAccessGrid = () => {
  const [showAll, setShowAll] = useState(false);
  const displayedCategories = showAll ? quickAccessCategories : quickAccessCategories.slice(0, 8);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 md:grid-cols-8 gap-4 md:gap-6">
        {displayedCategories.map((category) => (
          <BinanceStyleCategory
            key={category.name}
            name={category.name}
            icon={category.icon}
            link={category.link}
            gradient={category.gradient}
          />
        ))}
      </div>
      {quickAccessCategories.length > 8 && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="text-muted-foreground hover:text-foreground"
          >
            {showAll ? (
              <>
                Show Less <ChevronUp className="h-4 w-4 ml-1" />
              </>
            ) : (
              <>
                See More ({quickAccessCategories.length - 8} more) <ChevronDown className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export const ServicesGrid = () => {
  const [showAll, setShowAll] = useState(false);
  const displayedServices = showAll ? serviceCategories : serviceCategories.slice(0, 8);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 md:grid-cols-8 gap-4 md:gap-6">
        {displayedServices.map((category) => (
          <BinanceStyleCategory
            key={category.name}
            name={category.name}
            icon={category.icon}
            link={category.link}
            gradient={category.gradient}
          />
        ))}
      </div>
      {serviceCategories.length > 8 && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="text-muted-foreground hover:text-foreground"
          >
            {showAll ? (
              <>
                Show Less <ChevronUp className="h-4 w-4 ml-1" />
              </>
            ) : (
              <>
                See More ({serviceCategories.length - 8} more) <ChevronDown className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
