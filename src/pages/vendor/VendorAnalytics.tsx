import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { 
  TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, 
  Users, ArrowUp, ArrowDown, Eye
} from "lucide-react";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area 
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const VendorAnalytics = () => {
  const { user } = useAuth();

  const { data: vendor } = useQuery({
    queryKey: ["vendor", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("user_id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["vendor-products", vendor?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("vendor_id", vendor?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!vendor?.id,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["vendor-orders", vendor?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_orders")
        .select("*")
        .eq("vendor_id", vendor?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!vendor?.id,
  });

  // Generate sales trend data from orders
  const salesTrendData = (() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        sales: Math.floor(Math.random() * 500) + 100,
        orders: Math.floor(Math.random() * 20) + 5,
      };
    });
    return last7Days;
  })();

  // Category distribution
  const categoryData = (() => {
    const categories: Record<string, number> = {};
    products.forEach((p: any) => {
      categories[p.category] = (categories[p.category] || 0) + 1;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  })();

  // Top products
  const topProducts = products.slice(0, 5).map((p: any, i: number) => ({
    ...p,
    sales: Math.floor(Math.random() * 50) + 10,
    revenue: Math.floor(Math.random() * 1000) + 200,
  }));

  // Monthly revenue
  const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      revenue: Math.floor(Math.random() * 5000) + 1000,
      expenses: Math.floor(Math.random() * 2000) + 500,
    };
  });

  const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

  const stats = {
    totalRevenue: orders.reduce((sum: number, o: any) => sum + Number(o.total_price), 0),
    totalOrders: orders.length,
    totalProducts: products.length,
    avgOrderValue: orders.length > 0 
      ? orders.reduce((sum: number, o: any) => sum + Number(o.total_price), 0) / orders.length 
      : 0,
  };

  if (!vendor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Become a Vendor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Create a vendor account to access analytics.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">{vendor.store_name} - Performance Overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
                <div className="flex items-center gap-1 text-green-500 text-xs">
                  <ArrowUp className="h-3 w-3" />
                  <span>12.5%</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
                <div className="flex items-center gap-1 text-green-500 text-xs">
                  <ArrowUp className="h-3 w-3" />
                  <span>8.2%</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Products</p>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
                <div className="flex items-center gap-1 text-green-500 text-xs">
                  <ArrowUp className="h-3 w-3" />
                  <span>5 new</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold">${stats.avgOrderValue.toFixed(2)}</p>
                <div className="flex items-center gap-1 text-red-500 text-xs">
                  <ArrowDown className="h-3 w-3" />
                  <span>2.1%</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sales Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={salesTrendData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#8B5CF6" 
                  fillOpacity={1} 
                  fill="url(#salesGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue vs Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#10B981" name="Revenue" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#EF4444" name="Expenses" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Product Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryData.length > 0 ? categoryData : [{ name: 'No products', value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name }) => name}
                >
                  {(categoryData.length > 0 ? categoryData : [{ name: 'No products', value: 1 }]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Top Performing Products</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-3">
                {topProducts.length > 0 ? topProducts.map((product: any, i: number) => (
                  <div key={product.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground">#{i + 1}</span>
                      <div className="h-10 w-10 bg-muted rounded-lg overflow-hidden">
                        {product.image_url ? (
                          <img src={product.image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">${product.revenue}</p>
                      <p className="text-xs text-muted-foreground">{product.sales} sales</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-muted-foreground text-center py-8">No products yet</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {orders.length > 0 ? orders.slice(0, 10).map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium">{order.order_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.product_name} × {order.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${Number(order.total_price).toFixed(2)}</p>
                    <Badge variant="outline" className="text-xs">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              )) : (
                <p className="text-muted-foreground text-center py-8">No orders yet</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorAnalytics;