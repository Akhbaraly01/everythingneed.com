/* eslint-disable no-restricted-imports */
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@modules/authentication";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@shared/ui/tooltip";
import { Badge } from "@shared/ui/badge";
import { Separator } from "@shared/ui/separator";
import {
  LayoutDashboard, Users, Shield, Store, Package, ShoppingCart,
  FolderOpen, DollarSign, FileText, Stethoscope,
  GraduationCap, Ticket,
  Eye, CheckCircle, TrendingUp, Settings,
  ScrollText, Activity, ChevronDown, ChevronRight, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AppRole = "super_admin" | "category_admin" | "customer_service" | "user" |
  "administrator" | "vendor_admin" | "moderator" | "support_staff" |
  "content_manager" | "finance_admin" | "healthcare_admin" | "learning_admin";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  title: string;
  roles: AppRole[];
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    roles: ["super_admin", "administrator", "vendor_admin", "moderator", "support_staff", "content_manager", "finance_admin", "healthcare_admin", "learning_admin", "category_admin", "customer_service"],
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    title: "User Management",
    roles: ["super_admin", "administrator"],
    items: [
      { label: "All Users", href: "/admin/users", icon: Users },
      { label: "Roles & Permissions", href: "/admin/roles", icon: Shield },
    ],
  },
  {
    title: "Commerce",
    roles: ["super_admin", "administrator", "vendor_admin"],
    items: [
      { label: "Vendors", href: "/admin/vendors", icon: Store },
      { label: "Products", href: "/admin/products", icon: Package },
      { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
      { label: "Categories", href: "/admin/category", icon: FolderOpen },
    ],
  },
  {
    title: "Finance",
    roles: ["super_admin", "finance_admin"],
    items: [
      { label: "Finance Overview", href: "/admin/finance", icon: DollarSign },
    ],
  },
  {
    title: "Content",
    roles: ["super_admin", "content_manager"],
    items: [
      { label: "Content Manager", href: "/admin/cms", icon: FileText },
    ],
  },
  {
    title: "Healthcare",
    roles: ["super_admin", "healthcare_admin"],
    items: [
      { label: "Doctors", href: "/admin/healthcare/doctors", icon: Stethoscope },
    ],
  },
  {
    title: "Learning",
    roles: ["super_admin", "learning_admin"],
    items: [
      { label: "Courses & Enrollments", href: "/admin/learning/courses", icon: GraduationCap },
    ],
  },
  {
    title: "Support",
    roles: ["super_admin", "support_staff", "customer_service"],
    items: [
      { label: "Tickets", href: "/admin/support/tickets", icon: Ticket },
    ],
  },
  {
    title: "Moderation",
    roles: ["super_admin", "moderator"],
    items: [
      { label: "Vendor Approvals", href: "/admin/vendors", icon: CheckCircle },
      { label: "Pending Content", href: "/admin/cms", icon: Eye },
    ],
  },
  {
    title: "Analytics",
    roles: ["super_admin", "administrator"],
    items: [
      { label: "Analytics", href: "/admin/analytics", icon: TrendingUp },
    ],
  },
  {
    title: "System",
    roles: ["super_admin"],
    items: [
      { label: "Settings", href: "/admin/settings", icon: Settings },
      { label: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
      { label: "System Health", href: "/admin/system", icon: Activity },
    ],
  },
];

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  administrator: "Administrator",
  vendor_admin: "Vendor Admin",
  moderator: "Moderator",
  support_staff: "Support Staff",
  content_manager: "Content Mgr",
  finance_admin: "Finance Admin",
  healthcare_admin: "Healthcare Admin",
  learning_admin: "Learning Admin",
  category_admin: "Category Admin",
  customer_service: "Customer Service",
  user: "User",
};

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const location = useLocation();
  const { role } = useAuth();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Overview: true,
    Commerce: true,
    "User Management": true,
  });

  const userRole = (role || "user") as AppRole;

  const visibleGroups = NAV_GROUPS.filter(
    (g) => g.roles.includes(userRole) || userRole === "super_admin"
  );

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isActive = (href: string) => {
    if (href === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(href);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex flex-col h-full bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-slate-700/50 transition-all duration-300 overflow-hidden",
          collapsed ? "w-16" : "w-72"
        )}
        aria-label="Admin navigation sidebar"
      >
        {/* Logo */}
        <div className={cn("flex items-center gap-3 px-4 py-5 border-b border-slate-700/50", collapsed && "justify-center px-2")}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/25">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="min-w-0"
              >
                <p className="text-sm font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent leading-tight">
                  EverythingNeed
                </p>
                <p className="text-[10px] text-slate-500 font-medium">Admin Control Center</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Role badge */}
        {!collapsed && (
          <div className="px-4 py-3 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-400">Logged in as</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-violet-500/20 text-violet-300 border-violet-500/30">
                {ROLE_LABELS[userRole] || userRole}
              </Badge>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700" aria-label="Sidebar navigation">
          {visibleGroups.map((group) => (
            <div key={group.title} className="px-2">
              {!collapsed && (
                <button
                  onClick={() => toggleGroup(group.title)}
                  className="w-full flex items-center justify-between px-2 py-1.5 mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-400 transition-colors"
                  aria-expanded={expandedGroups[group.title]}
                >
                  {group.title}
                  {expandedGroups[group.title] ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </button>
              )}

              <AnimatePresence initial={false}>
                {(collapsed || expandedGroups[group.title] !== false) && (
                  <motion.div
                    initial={!collapsed ? { height: 0, opacity: 0 } : false}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={!collapsed ? { height: 0, opacity: 0 } : undefined}
                    transition={{ duration: 0.2 }}
                    className="space-y-0.5 overflow-hidden"
                  >
                    {group.items.map((item) => {
                      const active = isActive(item.href);
                      const Icon = item.icon;

                      if (collapsed) {
                        return (
                          <Tooltip key={item.href}>
                            <TooltipTrigger asChild>
                              <Link
                                to={item.href}
                                className={cn(
                                  "flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-all duration-150",
                                  active
                                    ? "bg-violet-500/20 text-violet-400"
                                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/60"
                                )}
                                aria-label={item.label}
                                aria-current={active ? "page" : undefined}
                              >
                                <Icon className="w-4 h-4" />
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-slate-800 text-slate-200 border-slate-700">
                              {item.label}
                            </TooltipContent>
                          </Tooltip>
                        );
                      }

                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 group",
                            active
                              ? "bg-violet-500/15 text-violet-300 border border-violet-500/20"
                              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                          )}
                          aria-current={active ? "page" : undefined}
                        >
                          <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-violet-400" : "text-slate-500 group-hover:text-slate-300")} />
                          <span className="truncate">{item.label}</span>
                          {active && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />
                          )}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {!collapsed && <Separator className="mt-2 bg-slate-700/30" />}
            </div>
          ))}
        </nav>

        {/* Bottom version */}
        {!collapsed && (
          <div className="px-4 py-3 border-t border-slate-700/50">
            <p className="text-[10px] text-slate-600 text-center">EverythingNeed v1.0 · Admin</p>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}
