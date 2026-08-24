/* eslint-disable no-restricted-imports */
import { useState, useCallback, useEffect, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@modules/authentication";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Avatar } from "@shared/ui/avatar";
import { Badge } from "@shared/ui/badge";
import { Separator } from "@shared/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@shared/ui/tooltip";
import { AdminSidebar } from "./AdminSidebar";
import {
  Menu, X, Search, Bell, ChevronRight, Moon, Sun,
  LogOut, User, Settings,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  breadcrumbs?: Breadcrumb[];
}

export function AdminLayout({ children, title, breadcrumbs }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, role } = useAuth();
  const location = useLocation();

  // Keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Apply dark class on root
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const toggleSidebar = useCallback(() => setSidebarCollapsed((v) => !v), []);
  const toggleTheme = useCallback(() => setIsDark((v) => !v), []);

  // Auto-generate breadcrumbs from path if not provided
  const resolvedBreadcrumbs: Breadcrumb[] = breadcrumbs ?? (() => {
    const parts = location.pathname.split("/").filter(Boolean);
    return parts.map((p, i) => ({
      label: p.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      href: i < parts.length - 1 ? "/" + parts.slice(0, i + 1).join("/") : undefined,
    }));
  })();

  return (
    <div className={cn("flex h-screen overflow-hidden", isDark ? "dark bg-slate-950" : "bg-slate-50")}>
      {/* Sidebar */}
      <AdminSidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top navbar */}
        <header
          className={cn(
            "flex items-center gap-3 px-4 h-14 border-b flex-shrink-0 z-10",
            isDark
              ? "bg-slate-900 border-slate-700/50"
              : "bg-white border-slate-200 shadow-sm"
          )}
          role="banner"
        >
          {/* Toggle sidebar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn("w-8 h-8 rounded-lg flex-shrink-0", isDark ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100")}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>

          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1 text-sm min-w-0">
            {resolvedBreadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3 h-3 text-slate-400 flex-shrink-0" />}
                {crumb.href ? (
                  <Link
                    to={crumb.href}
                    className={cn("hover:underline truncate", isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-900")}
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={cn("font-medium truncate", isDark ? "text-slate-200" : "text-slate-900")}>
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>

          {/* Mobile title */}
          {title && (
            <h1 className={cn("md:hidden text-sm font-semibold truncate", isDark ? "text-slate-200" : "text-slate-900")}>
              {title}
            </h1>
          )}

          <div className="ml-auto flex items-center gap-2">
            {/* Global search */}
            <div className="relative hidden md:block">
              {searchOpen ? (
                <motion.div
                  initial={{ width: 120, opacity: 0 }}
                  animate={{ width: 260, opacity: 1 }}
                  className="flex items-center"
                >
                  <Search className={cn("absolute left-2.5 w-3.5 h-3.5", isDark ? "text-slate-400" : "text-slate-500")} />
                  <Input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search anything..."
                    className={cn("pl-8 pr-8 h-8 text-sm", isDark ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-slate-100 border-transparent")}
                  />
                  <button
                    onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                    className="absolute right-2 text-slate-400 hover:text-slate-200"
                    aria-label="Close search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSearchOpen(true)}
                        className={cn("w-8 h-8 rounded-lg", isDark ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100")}
                        aria-label="Open search (Ctrl+K)"
                      >
                        <Search className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Search (Ctrl+K)</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {/* Dark mode toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className={cn("w-8 h-8 rounded-lg", isDark ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100")}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className={cn("w-8 h-8 rounded-lg relative", isDark ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100")}
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" aria-label="New notifications" />
            </Button>

            <Separator orientation="vertical" className={cn("h-5", isDark ? "bg-slate-700" : "bg-slate-200")} />

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="User menu"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {(user?.name || user?.email || "A").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className={cn("text-xs font-medium leading-tight", isDark ? "text-slate-200" : "text-slate-900")}>
                      {user?.name || user?.email || "Admin"}
                    </p>
                    <p className="text-[10px] text-slate-500 leading-tight capitalize">{role?.replace(/_/g, " ")}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={cn("w-48", isDark ? "bg-slate-800 border-slate-700" : "")}>
                <DropdownMenuLabel className={isDark ? "text-slate-300" : ""}>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className={isDark ? "bg-slate-700" : ""} />
                <DropdownMenuItem className={isDark ? "text-slate-300 focus:bg-slate-700 focus:text-slate-100" : ""}>
                  <User className="w-3.5 h-3.5 mr-2" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem className={isDark ? "text-slate-300 focus:bg-slate-700 focus:text-slate-100" : ""}>
                  <Settings className="w-3.5 h-3.5 mr-2" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className={isDark ? "bg-slate-700" : ""} />
                <DropdownMenuItem className="text-red-500 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-900/20">
                  <LogOut className="w-3.5 h-3.5 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main
          className={cn(
            "flex-1 overflow-y-auto",
            isDark ? "bg-slate-950" : "bg-slate-50"
          )}
          role="main"
          id="main-content"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
