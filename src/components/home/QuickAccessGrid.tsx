import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Smartphone,
  Shirt,
  Home,
  Dumbbell,
  Calendar,
  CheckSquare,
  Hotel,
  MoreHorizontal,
  GraduationCap,
  HeartPulse,
  Pill,
  Users,
  Truck,
  ShoppingBag,
  Shield,
  Headphones,
} from "lucide-react";
import BinanceStyleCategory from "./BinanceStyleCategory";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// First 7 categories shown initially + See More
const quickAccessCategories = [
  { name: "Electronics", icon: Smartphone, link: "/needs/electronics", gradient: "from-blue-500 to-blue-600" },
  { name: "Fashion", icon: Shirt, link: "/needs/fashion", gradient: "from-pink-500 to-rose-500" },
  { name: "Home", icon: Home, link: "/needs/home", gradient: "from-amber-500 to-orange-500" },
  { name: "Sports", icon: Dumbbell, link: "/needs/sports", gradient: "from-green-500 to-emerald-500" },
  { name: "Booking", icon: Calendar, link: "/deals/booking", gradient: "from-cyan-500 to-blue-500" },
  { name: "Tasks", icon: CheckSquare, link: "/deals/tasks", gradient: "from-teal-500 to-emerald-500" },
  { name: "Hotels", icon: Hotel, link: "/deals/hotels", gradient: "from-yellow-500 to-amber-500" },
];

// All other categories shown in "See More" sheet
const allCategories = [
  { name: "Electronics", icon: Smartphone, link: "/needs/electronics", gradient: "from-blue-500 to-blue-600" },
  { name: "Fashion", icon: Shirt, link: "/needs/fashion", gradient: "from-pink-500 to-rose-500" },
  { name: "Home", icon: Home, link: "/needs/home", gradient: "from-amber-500 to-orange-500" },
  { name: "Sports", icon: Dumbbell, link: "/needs/sports", gradient: "from-green-500 to-emerald-500" },
  { name: "Booking", icon: Calendar, link: "/deals/booking", gradient: "from-cyan-500 to-blue-500" },
  { name: "Tasks", icon: CheckSquare, link: "/deals/tasks", gradient: "from-teal-500 to-emerald-500" },
  { name: "Hotels", icon: Hotel, link: "/deals/hotels", gradient: "from-yellow-500 to-amber-500" },
  { name: "Learning", icon: GraduationCap, link: "/learn", gradient: "from-emerald-500 to-teal-500" },
  { name: "Healthcare", icon: HeartPulse, link: "/healthcare", gradient: "from-rose-500 to-pink-500" },
  { name: "Pharmacy", icon: Pill, link: "/pharmacy", gradient: "from-blue-500 to-cyan-500" },
  { name: "Community", icon: Users, link: "/community", gradient: "from-purple-500 to-fuchsia-500" },
  { name: "Delivery", icon: Truck, link: "/delivery", gradient: "from-amber-500 to-yellow-500" },
  { name: "Shopping", icon: ShoppingBag, link: "/deals", gradient: "from-pink-500 to-rose-500" },
  { name: "Security", icon: Shield, link: "/security", gradient: "from-slate-500 to-gray-600" },
  { name: "Audio", icon: Headphones, link: "/needs/audio", gradient: "from-indigo-500 to-blue-500" },
];

const serviceCategories = [
  { name: "Courses", icon: GraduationCap, link: "/learn", gradient: "from-emerald-500 to-teal-500" },
  { name: "Healthcare", icon: HeartPulse, link: "/healthcare", gradient: "from-rose-500 to-pink-500" },
  { name: "Pharmacy", icon: Pill, link: "/pharmacy", gradient: "from-blue-500 to-cyan-500" },
  { name: "Delivery", icon: Truck, link: "/deals", gradient: "from-amber-500 to-yellow-500" },
];

export const QuickAccessGrid = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-3 md:gap-4">
        {quickAccessCategories.map((category) => (
          <BinanceStyleCategory
            key={category.name}
            name={category.name}
            icon={category.icon}
            link={category.link}
            gradient={category.gradient}
          />
        ))}
        
        {/* See More button as 8th item */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center gap-1.5 group cursor-pointer">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center shadow-md transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg">
                <MoreHorizontal className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <span className="text-xs font-medium text-center text-muted-foreground group-hover:text-foreground transition-colors">
                More
              </span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh] rounded-t-xl">
            <SheetHeader>
              <SheetTitle>All Categories</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-4 mt-6 overflow-y-auto">
              {allCategories.map((category) => (
                <Link 
                  key={category.name} 
                  to={category.link}
                  onClick={() => setIsOpen(false)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center shadow-md transition-all group-hover:scale-105`}>
                    <category.icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xs font-medium text-center">{category.name}</span>
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export const ServicesGrid = () => {
  return (
    <div className="grid grid-cols-4 gap-3 md:gap-4">
      {serviceCategories.map((category) => (
        <BinanceStyleCategory
          key={category.name}
          name={category.name}
          icon={category.icon}
          link={category.link}
          gradient={category.gradient}
        />
      ))}
    </div>
  );
};
