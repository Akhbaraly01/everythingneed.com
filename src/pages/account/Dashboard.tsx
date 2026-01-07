import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  Heart, 
  Star, 
  Clock, 
  ChevronRight,
  TrendingUp,
  ShoppingBag,
  BookOpen,
  Ticket
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface OrderItem {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
}

interface SavedItem {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface Recommendation {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  reason: string;
}

// Mock saved items and recommendations
const mockSavedItems: SavedItem[] = [
  { id: 1, name: "Smartphone Pro Max", price: 999, image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300", category: "Electronics" },
  { id: 2, name: "Wireless Earbuds", price: 199, image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300", category: "Electronics" },
  { id: 3, name: "Running Shoes", price: 149, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300", category: "Fashion" },
  { id: 4, name: "Yoga Mat Premium", price: 79, image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=300", category: "Sports" },
  { id: 5, name: "Coffee Maker", price: 299, image: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=300", category: "Home" },
  { id: 6, name: "Laptop Stand", price: 89, image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300", category: "Office" },
];

const mockRecommendations: Recommendation[] = [
  { id: 1, name: "Smart Watch Series 5", price: 399, image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300", category: "Electronics", reason: "Based on your electronics interest" },
  { id: 2, name: "Bluetooth Speaker", price: 129, image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300", category: "Electronics", reason: "Similar to items you viewed" },
  { id: 3, name: "Fitness Tracker", price: 89, image: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=300", category: "Sports", reason: "Popular in your area" },
  { id: 4, name: "Desk Organizer", price: 49, image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=300", category: "Office", reason: "Trending this week" },
  { id: 5, name: "LED Desk Lamp", price: 69, image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=300", category: "Home", reason: "Customers also bought" },
  { id: 6, name: "Mechanical Keyboard", price: 159, image: "https://images.unsplash.com/photo-1595225476474-87563907a212?w=300", category: "Electronics", reason: "Based on your browsing" },
  { id: 7, name: "Webcam HD", price: 79, image: "https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=300", category: "Electronics", reason: "Frequently bought together" },
  { id: 8, name: "USB Hub", price: 39, image: "https://images.unsplash.com/photo-1625723044792-44de16ccb4e9?w=300", category: "Electronics", reason: "You might also like" },
];

const Dashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("medicine_orders")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-500/10 text-green-500";
      case "shipped": return "bg-blue-500/10 text-blue-500";
      case "processing": return "bg-yellow-500/10 text-yellow-500";
      case "pending": return "bg-gray-500/10 text-gray-500";
      case "cancelled": return "bg-red-500/10 text-red-500";
      default: return "bg-gray-500/10 text-gray-500";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Dashboard</h1>
          <p className="text-muted-foreground">Track your orders, saved items, and personalized recommendations</p>
        </div>
        <Link to="/account">
          <Button variant="outline">
            Account Settings <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{orders.length}</p>
              <p className="text-sm text-muted-foreground">Total Orders</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-rose-500/10">
              <Heart className="h-6 w-6 text-rose-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockSavedItems.length}</p>
              <p className="text-sm text-muted-foreground">Saved Items</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-amber-500/10">
              <Star className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">12</p>
              <p className="text-sm text-muted-foreground">Reviews Given</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-500/10">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">$2,450</p>
              <p className="text-sm text-muted-foreground">Total Spent</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/account/orders">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
              <ShoppingBag className="h-8 w-8 text-primary" />
              <span className="font-medium">Order History</span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/learn">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
              <BookOpen className="h-8 w-8 text-emerald-500" />
              <span className="font-medium">My Courses</span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/healthcare/tickets">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
              <Ticket className="h-8 w-8 text-rose-500" />
              <span className="font-medium">Health Tickets</span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/support/tickets">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
              <Clock className="h-8 w-8 text-blue-500" />
              <span className="font-medium">Support Tickets</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Tabs for Orders, Saved, Recommendations */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orders">Order History</TabsTrigger>
          <TabsTrigger value="saved">Saved Items</TabsTrigger>
          <TabsTrigger value="recommendations">For You</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Orders</span>
                <Link to="/account/orders">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No orders yet</p>
                  <Link to="/">
                    <Button className="mt-4">Start Shopping</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <Package className="h-10 w-10 text-primary" />
                        <div>
                          <p className="font-medium">{order.order_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                        <p className="font-bold mt-1">${order.total_amount.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Saved Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {mockSavedItems.map((item) => (
                  <div key={item.id} className="group cursor-pointer">
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <Button 
                        size="icon" 
                        variant="secondary" 
                        className="absolute top-2 right-2 h-8 w-8"
                      >
                        <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
                      </Button>
                    </div>
                    <p className="mt-2 font-medium text-sm line-clamp-2">{item.name}</p>
                    <p className="text-primary font-bold">${item.price}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Personalized Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mockRecommendations.map((item) => (
                  <div key={item.id} className="group cursor-pointer">
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <Badge className="absolute top-2 left-2 bg-primary/90 text-xs">
                        {item.category}
                      </Badge>
                    </div>
                    <p className="mt-2 font-medium text-sm line-clamp-2">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.reason}</p>
                    <p className="text-primary font-bold">${item.price}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
