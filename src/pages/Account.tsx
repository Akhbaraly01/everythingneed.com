import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  User, Settings, ShoppingBag, Heart, Clock, CreditCard, 
  Bell, HelpCircle, LogOut, ChevronRight, Shield, HeartPulse, 
  GraduationCap, Package, Moon, Sun, Wallet, ChevronDown
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
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
  const { currency, setCurrency, currencies, formatPrice } = useCurrency();
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  const menuItems = [
    { icon: User, title: "Profile Information", description: "Update your personal details", path: "/account/profile" },
    { icon: Package, title: "Order History", description: "View all pharmacy orders", path: "/account/orders" },
    { icon: HeartPulse, title: "Health Tickets", description: "View your appointments", path: "/healthcare/tickets" },
    { icon: GraduationCap, title: "My Courses", description: "Enrolled courses and progress", path: "/learn" },
    { icon: Heart, title: "Wishlist", description: "Saved items and favorites", badge: "12", path: "/account/wishlist" },
    { icon: CreditCard, title: "Payment Methods", description: "Manage cards and payment options", path: "/payments" },
    { icon: Bell, title: "Notification Settings", description: "Manage push notifications", path: "/account/notifications" },
    { icon: Settings, title: "Settings", description: "App preferences and security", path: "/settings" },
    { icon: HelpCircle, title: "Help & Support", description: "Get help and contact support", path: "/support/tickets" },
  ];

  const getRoleBadge = () => {
    switch (role) {
      case "super_admin":
        return <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white">Super Admin</Badge>;
      case "category_admin":
        return <Badge variant="secondary">Category Admin</Badge>;
      case "customer_service":
        return <Badge variant="outline">Customer Service</Badge>;
      default:
        return <Badge variant="outline">User</Badge>;
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
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
              </Avatar>
              <div className="text-center md:text-left flex-1">
                <h1 className="text-xl font-bold mb-1">
                  {profile?.full_name || "User"}
                </h1>
                <p className="text-muted-foreground text-sm mb-2">{user?.email}</p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {getRoleBadge()}
                  <Badge variant="outline">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Currency & Theme Settings Card */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Wallet & Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Currency Selector */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Currency</Label>
                <p className="text-xs text-muted-foreground">Select your preferred currency</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <span className="font-bold">{currency.symbol}</span>
                    <span>{currency.code}</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
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
                      <span className="text-muted-foreground ml-2 text-xs">- {c.name}</span>
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
                  <p className="text-xs text-muted-foreground">Toggle dark theme</p>
                </div>
              </div>
              <Switch 
                checked={isDarkMode}
                onCheckedChange={toggleDarkMode}
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardDescription className="text-xs">Total Orders</CardDescription>
              <CardTitle className="text-2xl">0</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardDescription className="text-xs">Active Orders</CardDescription>
              <CardTitle className="text-2xl">0</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardDescription className="text-xs">Wishlist</CardDescription>
              <CardTitle className="text-2xl">0</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardDescription className="text-xs">Courses</CardDescription>
              <CardTitle className="text-2xl">0</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Menu Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {menuItems.map((item, index) => (
            <Link key={index} to={item.path}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm flex items-center gap-2">
                        {item.title}
                        {item.badge && (
                          <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">
                            {item.badge}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        {item.description}
                      </CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        {/* Sign Out */}
        <Card className="border-destructive/20">
          <CardHeader 
            className="cursor-pointer hover:bg-destructive/5 transition-colors py-4"
            onClick={handleSignOut}
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center">
                <LogOut className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-sm text-destructive">Sign Out</CardTitle>
                <CardDescription className="text-xs">Log out from your account</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default Account;
