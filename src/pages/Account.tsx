import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  User, Settings, ShoppingBag, Heart, Clock, CreditCard, 
  Bell, HelpCircle, LogOut, ChevronRight, Shield, HeartPulse, 
  GraduationCap, Package, Moon, Sun, Wallet, ChevronDown, MapPin,
  Award, TrendingUp, BookOpen, Star, Sparkles
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const Account = () => {
  const { user, profile, role, signOut } = useAuth();
  const { currency, setCurrency, currencies } = useCurrency();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Fetch user stats
  const { data: stats } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async () => {
      if (!user) return { orders: 0, wishlist: 0, courses: 0, certificates: 0 };
      
      const [ordersRes, wishlistRes, enrollmentsRes, certsRes] = await Promise.all([
        supabase.from('vendor_orders').select('id', { count: 'exact' }).eq('customer_id', user.id),
        supabase.from('wishlists').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('enrollments').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('user_certificates').select('id', { count: 'exact' }).eq('user_id', user.id),
      ]);
      
      return {
        orders: ordersRes.count || 0,
        wishlist: wishlistRes.count || 0,
        courses: enrollmentsRes.count || 0,
        certificates: certsRes.count || 0,
      };
    },
    enabled: !!user,
  });

  // Check for dark mode on mount
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const quickActions = [
    { icon: ShoppingBag, label: "Orders", count: stats?.orders || 0, path: "/account/orders", color: "bg-primary/10 text-primary" },
    { icon: Heart, label: "Wishlist", count: stats?.wishlist || 0, path: "/account/wishlist", color: "bg-destructive/10 text-destructive" },
    { icon: GraduationCap, label: "Courses", count: stats?.courses || 0, path: "/account/learning", color: "bg-secondary/10 text-secondary" },
    { icon: Award, label: "Certificates", count: stats?.certificates || 0, path: "/account/certificates", color: "bg-warning/10 text-warning" },
  ];

  const menuItems = [
    { icon: User, title: "Profile", description: "Update your personal details", path: "/account/profile" },
    { icon: MapPin, title: "Track Orders", description: "Real-time order tracking", path: "/account/dashboard" },
    { icon: HeartPulse, title: "Health Tickets", description: "View your appointments", path: "/healthcare/tickets" },
    { icon: Wallet, title: "Wallet", description: "Manage your balance", path: "/account/wallet" },
    { icon: CreditCard, title: "Payments", description: "Manage payment methods", path: "/payments" },
    { icon: Bell, title: "Notifications", description: "Notification settings", path: "/account/notifications" },
    { icon: Settings, title: "Settings", description: "App preferences", path: "/settings" },
    { icon: HelpCircle, title: "Help & Support", description: "Get help", path: "/support/tickets" },
  ];

  const getRoleBadge = () => {
    switch (role) {
      case "super_admin":
        return <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white text-xs">Super Admin</Badge>;
      case "category_admin":
        return <Badge variant="secondary" className="text-xs">Category Admin</Badge>;
      case "customer_service":
        return <Badge variant="outline" className="text-xs">Customer Service</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">User</Badge>;
    }
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-primary via-primary/90 to-secondary pt-8 pb-16 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="flex flex-col items-center text-center text-white">
            <Avatar className="h-20 w-20 ring-4 ring-white/30 mb-4">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-xl bg-white/20">{getInitials()}</AvatarFallback>
            </Avatar>
            <h1 className="text-xl font-bold mb-1">
              {profile?.full_name || "Welcome!"}
            </h1>
            <p className="text-white/80 text-sm mb-2">{user?.email}</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {getRoleBadge()}
              <Badge className="bg-white/20 text-white text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-10 max-w-2xl">
        {/* Quick Stats */}
        <Card className="mb-4 shadow-lg border-0">
          <CardContent className="p-4">
            <div className="grid grid-cols-4 gap-2">
              {quickActions.map((action, idx) => (
                <Link key={idx} to={action.path}>
                  <div className="flex flex-col items-center p-2 rounded-lg hover:bg-muted transition-colors">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-1 ${action.color}`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <span className="text-lg font-bold">{action.count}</span>
                    <span className="text-[10px] text-muted-foreground">{action.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Settings Card */}
        <Card className="mb-4 border-0 shadow-sm">
          <CardContent className="p-4 space-y-4">
            {/* Currency Selector */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Currency</Label>
                <p className="text-xs text-muted-foreground">Preferred currency</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <span className="font-bold">{currency.symbol}</span>
                    <span>{currency.code}</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-60 overflow-y-auto">
                  <DropdownMenuLabel className="text-xs">Select Currency</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {currencies.map((c) => (
                    <DropdownMenuItem 
                      key={c.code} 
                      onClick={() => setCurrency(c)}
                      className={currency.code === c.code ? "bg-primary/10" : ""}
                    >
                      <span className="font-medium mr-2">{c.symbol}</span>
                      <span>{c.code}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isDarkMode ? (
                  <Moon className="h-4 w-4 text-primary" />
                ) : (
                  <Sun className="h-4 w-4 text-primary" />
                )}
                <div>
                  <Label className="text-sm font-medium">Dark Mode</Label>
                  <p className="text-xs text-muted-foreground">Toggle theme</p>
                </div>
              </div>
              <Switch 
                checked={isDarkMode}
                onCheckedChange={toggleDarkMode}
              />
            </div>
          </CardContent>
        </Card>

        {/* Menu Items */}
        <Card className="mb-4 border-0 shadow-sm">
          <CardContent className="p-0 divide-y">
            {menuItems.map((item, index) => (
              <Link key={index} to={item.path}>
                <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Card className="border-destructive/20 shadow-sm">
          <CardContent className="p-0">
            <div 
              className="flex items-center gap-3 p-4 cursor-pointer hover:bg-destructive/5 transition-colors"
              onClick={handleSignOut}
            >
              <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center">
                <LogOut className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium text-destructive">Sign Out</p>
                <p className="text-xs text-muted-foreground">Log out from your account</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Account;
