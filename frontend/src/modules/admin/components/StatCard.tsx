import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Skeleton } from "@shared/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

type StatColor = "primary" | "success" | "warning" | "danger" | "info";

interface StatTrend {
  value: number;
  isPositive: boolean;
  label?: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: StatTrend;
  color?: StatColor;
  isLoading?: boolean;
  href?: string;
  description?: string;
}

const colorMap: Record<StatColor, { bg: string; icon: string; badge: string; glow: string }> = {
  primary: {
    bg: "from-violet-500/20 to-indigo-500/10",
    icon: "bg-gradient-to-br from-violet-500 to-indigo-600 shadow-violet-500/25",
    badge: "bg-violet-500/10 text-violet-400",
    glow: "hover:shadow-violet-500/10",
  },
  success: {
    bg: "from-emerald-500/20 to-teal-500/10",
    icon: "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/25",
    badge: "bg-emerald-500/10 text-emerald-400",
    glow: "hover:shadow-emerald-500/10",
  },
  warning: {
    bg: "from-amber-500/20 to-orange-500/10",
    icon: "bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/25",
    badge: "bg-amber-500/10 text-amber-400",
    glow: "hover:shadow-amber-500/10",
  },
  danger: {
    bg: "from-red-500/20 to-rose-500/10",
    icon: "bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/25",
    badge: "bg-red-500/10 text-red-400",
    glow: "hover:shadow-red-500/10",
  },
  info: {
    bg: "from-blue-500/20 to-cyan-500/10",
    icon: "bg-gradient-to-br from-blue-500 to-cyan-600 shadow-blue-500/25",
    badge: "bg-blue-500/10 text-blue-400",
    glow: "hover:shadow-blue-500/10",
  },
};

export function StatCard({
  title,
  value,
  icon,
  trend,
  color = "primary",
  isLoading = false,
  href,
  description,
}: StatCardProps) {
  const colors = colorMap[color];

  const content = isLoading ? (
    <div className="p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20 bg-slate-700/50" />
          <Skeleton className="h-7 w-24 bg-slate-700/50" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl bg-slate-700/50" />
      </div>
      <Skeleton className="h-3 w-16 bg-slate-700/50" />
    </div>
  ) : (
    <div className={cn("p-5 rounded-2xl bg-gradient-to-br", colors.bg)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">{title}</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-100 tabular-nums">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {description && (
            <p className="mt-1 text-xs text-slate-500 truncate">{description}</p>
          )}
        </div>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg text-white", colors.icon)}>
          {icon}
        </div>
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className={cn("inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md", trend.isPositive ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400")}>
            {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend.value)}%
          </span>
          {trend.label && (
            <span className="text-xs text-slate-500">{trend.label}</span>
          )}
        </div>
      )}
    </div>
  );

  const cardClass = cn(
    "rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-sm overflow-hidden",
    "transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-600/70 shadow-lg hover:shadow-xl",
    colors.glow,
    href && "cursor-pointer"
  );

  if (href) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Link to={href} className={cardClass} aria-label={`${title}: ${value}`}>
          {content}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={cardClass} role="region" aria-label={title}>
      {content}
    </motion.div>
  );
}
