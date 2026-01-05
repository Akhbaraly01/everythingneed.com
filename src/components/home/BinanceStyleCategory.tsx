import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface BinanceStyleCategoryProps {
  name: string;
  icon: LucideIcon;
  link: string;
  gradient: string;
}

const BinanceStyleCategory = ({
  name,
  icon: Icon,
  link,
  gradient,
}: BinanceStyleCategoryProps) => {
  return (
    <Link to={link} className="group flex flex-col items-center gap-2">
      <div
        className={`relative w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20`}
      >
        {/* Glow effect */}
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-300`}
        />
        <Icon className="h-6 w-6 md:h-7 md:w-7 text-primary-foreground relative z-10" />
      </div>
      <span className="text-xs md:text-sm font-medium text-center text-foreground/80 group-hover:text-foreground transition-colors line-clamp-1">
        {name}
      </span>
    </Link>
  );
};

export default BinanceStyleCategory;
