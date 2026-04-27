import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Zap, GraduationCap, Heart, User, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useCartDrawer } from "@/contexts/CartDrawerContext";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/Footer";
import { AnimatedPage } from "@/components/AnimatedPage";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const { openCart } = useCartDrawer();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/deals", icon: Zap, label: "Needs" },
    { path: "/learn", icon: GraduationCap, label: "Learn" },
    { path: "/healthcare", icon: Heart, label: "Health" },
    { path: "/account", icon: User, label: "Account" },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Don't show bottom nav on home page (it has its own static header)
  const isHomePage = location.pathname === "/";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 pb-20 md:pb-4">
        <AnimatedPage>{children}</AnimatedPage>
      </main>

      <div className="hidden md:block"><Footer /></div>

      {/* Bottom Navigation - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
        <div className="flex items-center justify-around h-14">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive(path) ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                <Icon className="h-5 w-5 mb-0.5" />
                {path === "/pharmacy" && totalItems > 0 && (
                  <Badge className="absolute -top-1 -right-2 h-4 w-4 p-0 text-[9px] bg-destructive">
                    {totalItems > 9 ? "9+" : totalItems}
                  </Badge>
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Floating Cart Button - Desktop */}
      <Button
        onClick={openCart}
        className="hidden md:flex fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40"
        size="icon"
      >
        <div className="relative">
          <ShoppingCart className="h-6 w-6" />
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-[10px] bg-destructive">
              {totalItems > 9 ? "9+" : totalItems}
            </Badge>
          )}
        </div>
      </Button>
    </div>
  );
};

export default Layout;
