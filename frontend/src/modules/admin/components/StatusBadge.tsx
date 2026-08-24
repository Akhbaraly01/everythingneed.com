import { cn } from "@/lib/utils";

type BadgeSize = "sm" | "md" | "lg";

interface StatusBadgeProps {
  status: string;
  size?: BadgeSize;
  className?: string;
}

const statusConfig: Record<string, { label: string; classes: string; dot: string }> = {
  // Green
  active:     { label: "Active",      classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", dot: "bg-emerald-400" },
  approved:   { label: "Approved",    classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", dot: "bg-emerald-400" },
  completed:  { label: "Completed",   classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", dot: "bg-emerald-400" },
  verified:   { label: "Verified",    classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", dot: "bg-emerald-400" },
  resolved:   { label: "Resolved",    classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", dot: "bg-emerald-400" },
  published:  { label: "Published",   classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", dot: "bg-emerald-400" },
  paid:       { label: "Paid",        classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", dot: "bg-emerald-400" },

  // Yellow
  pending:    { label: "Pending",     classes: "bg-amber-500/15 text-amber-400 border-amber-500/25",   dot: "bg-amber-400" },
  review:     { label: "In Review",   classes: "bg-amber-500/15 text-amber-400 border-amber-500/25",   dot: "bg-amber-400" },
  awaiting:   { label: "Awaiting",    classes: "bg-amber-500/15 text-amber-400 border-amber-500/25",   dot: "bg-amber-400" },
  draft:      { label: "Draft",       classes: "bg-slate-500/15 text-slate-400 border-slate-500/25",   dot: "bg-slate-400" },

  // Blue
  in_progress:  { label: "In Progress",  classes: "bg-blue-500/15 text-blue-400 border-blue-500/25", dot: "bg-blue-400" },
  processing:   { label: "Processing",   classes: "bg-blue-500/15 text-blue-400 border-blue-500/25", dot: "bg-blue-400" },
  open:         { label: "Open",         classes: "bg-blue-500/15 text-blue-400 border-blue-500/25", dot: "bg-blue-400" },
  enrolled:     { label: "Enrolled",     classes: "bg-blue-500/15 text-blue-400 border-blue-500/25", dot: "bg-blue-400" },
  scheduled:    { label: "Scheduled",    classes: "bg-blue-500/15 text-blue-400 border-blue-500/25", dot: "bg-blue-400" },

  // Orange
  suspended:  { label: "Suspended",   classes: "bg-orange-500/15 text-orange-400 border-orange-500/25", dot: "bg-orange-400" },
  blocked:    { label: "Blocked",     classes: "bg-orange-500/15 text-orange-400 border-orange-500/25", dot: "bg-orange-400" },
  on_hold:    { label: "On Hold",     classes: "bg-orange-500/15 text-orange-400 border-orange-500/25", dot: "bg-orange-400" },

  // Red
  rejected:   { label: "Rejected",    classes: "bg-red-500/15 text-red-400 border-red-500/25", dot: "bg-red-400" },
  cancelled:  { label: "Cancelled",   classes: "bg-red-500/15 text-red-400 border-red-500/25", dot: "bg-red-400" },
  failed:     { label: "Failed",      classes: "bg-red-500/15 text-red-400 border-red-500/25", dot: "bg-red-400" },
  banned:     { label: "Banned",      classes: "bg-red-500/15 text-red-400 border-red-500/25", dot: "bg-red-400" },
  refunded:   { label: "Refunded",    classes: "bg-red-500/15 text-red-400 border-red-500/25", dot: "bg-red-400" },

  // Purple
  featured:   { label: "Featured",    classes: "bg-purple-500/15 text-purple-400 border-purple-500/25", dot: "bg-purple-400" },
  premium:    { label: "Premium",     classes: "bg-purple-500/15 text-purple-400 border-purple-500/25", dot: "bg-purple-400" },

  // Urgent
  urgent:     { label: "Urgent",      classes: "bg-red-600/20 text-red-300 border-red-500/40 animate-pulse", dot: "bg-red-400" },
  high:       { label: "High",        classes: "bg-orange-500/15 text-orange-300 border-orange-500/25", dot: "bg-orange-400" },
  medium:     { label: "Medium",      classes: "bg-amber-500/15 text-amber-300 border-amber-500/25", dot: "bg-amber-400" },
  low:        { label: "Low",         classes: "bg-slate-500/15 text-slate-400 border-slate-500/25",  dot: "bg-slate-400" },
};

const sizeMap: Record<BadgeSize, string> = {
  sm: "text-[10px] px-1.5 py-0.5 gap-1",
  md: "text-xs px-2 py-0.5 gap-1.5",
  lg: "text-sm px-2.5 py-1 gap-1.5",
};

const dotSizeMap: Record<BadgeSize, string> = {
  sm: "w-1.5 h-1.5",
  md: "w-2 h-2",
  lg: "w-2 h-2",
};

export function StatusBadge({ status, size = "md", className }: StatusBadgeProps) {
  const key = status.toLowerCase().replace(/ /g, "_");
  const config = statusConfig[key] ?? {
    label: status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    classes: "bg-slate-500/15 text-slate-400 border-slate-500/25",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border",
        config.classes,
        sizeMap[size],
        className
      )}
      aria-label={`Status: ${config.label}`}
    >
      <span className={cn("rounded-full flex-shrink-0", config.dot, dotSizeMap[size])} />
      {config.label}
    </span>
  );
}
