import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plane, Hotel, Building, Briefcase, Tractor, UtensilsCrossed, Heart,
  GraduationCap, Laptop, Shirt, Sparkles, Home, Music, Dumbbell, Car,
  Wallet, Scale, Sparkle, Shield, Dog, Compass, Calendar, Camera, Printer,
  Truck, HardHat, Wrench, Baby, HeartHandshake, Phone,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<any>> = {
  Plane, Hotel, Building, Briefcase, Tractor, UtensilsCrossed, Heart,
  GraduationCap, Laptop, Shirt, Sparkles, Home, Music, Dumbbell, Car,
  Wallet, Scale, Sparkle, Shield, Dog, Compass, Calendar, Camera, Printer,
  Truck, HardHat, Wrench, Baby, HeartHandshake, Phone,
};

export interface NeedsCategory {
  id: string;
  slug: string;
  name: string;
  icon?: string;
  color?: string;
}

interface Props {
  categories: NeedsCategory[];
  loading?: boolean;
}

const NeedsCategoryGrid = ({ categories, loading }: Props) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
      {categories.map((c) => {
        const Icon = iconMap[c.icon ?? "Briefcase"] ?? Briefcase;
        const color = c.color ?? "hsl(var(--primary))";
        return (
          <Link key={c.id} to={`/needs/${c.slug}`} className="group">
            <Card className="aspect-square flex flex-col items-center justify-center p-3 sm:p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <div
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"
                style={{ background: `${color}22` }}
              >
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <span className="text-[11px] sm:text-xs font-medium text-center line-clamp-2">
                {c.name}
              </span>
            </Card>
          </Link>
        );
      })}
    </div>
  );
};

export default NeedsCategoryGrid;
