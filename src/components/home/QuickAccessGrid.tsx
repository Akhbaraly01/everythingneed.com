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
} from "lucide-react";
import BinanceStyleCategory from "./BinanceStyleCategory";

const quickAccessCategories = [
  { name: "Electronics", icon: Smartphone, link: "/deals", gradient: "from-blue-500 to-blue-600" },
  { name: "Fashion", icon: Shirt, link: "/deals", gradient: "from-pink-500 to-rose-500" },
  { name: "Home", icon: Home, link: "/deals", gradient: "from-amber-500 to-orange-500" },
  { name: "Sports", icon: Dumbbell, link: "/deals", gradient: "from-green-500 to-emerald-500" },
  { name: "Books", icon: BookOpen, link: "/deals", gradient: "from-violet-500 to-purple-500" },
  { name: "Gaming", icon: Gamepad2, link: "/deals", gradient: "from-red-500 to-rose-500" },
  { name: "Beauty", icon: Sparkles, link: "/deals", gradient: "from-fuchsia-500 to-pink-500" },
  { name: "Auto", icon: Car, link: "/deals", gradient: "from-slate-500 to-gray-600" },
  { name: "Booking", icon: Calendar, link: "/deals/booking", gradient: "from-cyan-500 to-blue-500" },
  { name: "Tasks", icon: CheckSquare, link: "/deals/tasks", gradient: "from-teal-500 to-emerald-500" },
  { name: "Transport", icon: Plane, link: "/deals/transport", gradient: "from-sky-500 to-indigo-500" },
  { name: "Hotels", icon: Hotel, link: "/deals/hotels", gradient: "from-yellow-500 to-amber-500" },
  { name: "Building", icon: Building2, link: "/deals/building", gradient: "from-stone-500 to-zinc-600" },
  { name: "Jobs", icon: Briefcase, link: "/deals/jobs", gradient: "from-indigo-500 to-violet-500" },
  { name: "Agri", icon: Wheat, link: "/deals/agriculture", gradient: "from-lime-500 to-green-500" },
  { name: "Food", icon: UtensilsCrossed, link: "/deals/food", gradient: "from-orange-500 to-red-500" },
];

const serviceCategories = [
  { name: "Courses", icon: GraduationCap, link: "/learn", gradient: "from-emerald-500 to-teal-500" },
  { name: "Healthcare", icon: HeartPulse, link: "/healthcare", gradient: "from-rose-500 to-pink-500" },
  { name: "Pharmacy", icon: Pill, link: "/pharmacy", gradient: "from-blue-500 to-cyan-500" },
  { name: "Community", icon: Users, link: "/deals", gradient: "from-purple-500 to-fuchsia-500" },
  { name: "Delivery", icon: Truck, link: "/deals", gradient: "from-amber-500 to-yellow-500" },
  { name: "Shopping", icon: ShoppingBag, link: "/deals", gradient: "from-pink-500 to-rose-500" },
];

export const QuickAccessGrid = () => {
  return (
    <div className="grid grid-cols-4 md:grid-cols-8 gap-4 md:gap-6">
      {quickAccessCategories.map((category) => (
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

export const ServicesGrid = () => {
  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-6">
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
