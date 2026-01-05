import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  User, Settings, ShoppingBag, Heart, Clock, CreditCard, 
  Bell, HelpCircle, LogOut, ChevronRight, Shield, HeartPulse, 
  GraduationCap, Package
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const Account = () => {
  const { user, profile, role, signOut } = useAuth();

  const menuItems = [
    { icon: User, title: "Profile Information", description: "Update your personal details", path: "/account/profile" },
    { icon: Package, title: "Order History", description: "View all pharmacy orders", path: "/account/orders" },
    { icon: HeartPulse, title: "Health Tickets", description: "View your appointments", path: "/healthcare/tickets" },
    { icon: GraduationCap, title: "My Courses", description: "Enrolled courses and progress", path: "/learn" },
    { icon: Heart, title: "Wishlist", description: "Saved items and favorites", badge: "12", path: "/wishlist" },
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
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
              </Avatar>
              <div className="text-center md:text-left flex-1">
                <h1 className="text-2xl font-bold mb-1">
                  {profile?.full_name || "User"}
                </h1>
                <p className="text-muted-foreground mb-3">{user?.email}</p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {getRoleBadge()}
                  <Badge variant="outline">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                </div>
              </div>
              <Button variant="outline">
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Orders</CardDescription>
              <CardTitle className="text-3xl">0</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active Orders</CardDescription>
              <CardTitle className="text-3xl">0</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Wishlist Items</CardDescription>
              <CardTitle className="text-3xl">0</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Courses Enrolled</CardDescription>
              <CardTitle className="text-3xl">0</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Menu Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {menuItems.map((item, index) => (
            <Link key={index} to={item.path}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {item.title}
                        {item.badge && (
                          <Badge variant="destructive" className="h-5 px-2">
                            {item.badge}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {item.description}
                      </CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        {/* Sign Out */}
        <Card className="border-destructive/20">
          <CardHeader 
            className="cursor-pointer hover:bg-destructive/5 transition-colors"
            onClick={handleSignOut}
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <LogOut className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-base text-destructive">Sign Out</CardTitle>
                <CardDescription>Log out from your account</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default Account;
