import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Wrench,
  Users,
  ShoppingCart,
  TrendingUp,
  Eye,
  Calendar,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Navigate } from "react-router-dom";

const AdminDashboard = () => {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("posts");

  // Check admin access
  const isAdmin = hasRole("category_admin") || hasRole("super_admin");

  // Fetch pending learn posts
  const { data: pendingPosts = [] } = useQuery({
    queryKey: ["admin-pending-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learn_posts")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch building service bookings
  const { data: bookings = [] } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("building_service_bookings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch vendor orders
  const { data: vendorOrders = [] } = useQuery({
    queryKey: ["admin-vendor-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_orders")
        .select("*, vendors(store_name)")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Approve/reject post mutation
  const updatePostMutation = useMutation({
    mutationFn: async ({ postId, status }: { postId: string; status: string }) => {
      const { error } = await supabase
        .from("learn_posts")
        .update({ status })
        .eq("id", postId);

      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-posts"] });
      toast.success(`Post ${status === "approved" ? "approved" : "rejected"} successfully`);
    },
    onError: () => {
      toast.error("Failed to update post");
    },
  });

  // Update booking status mutation
  const updateBookingMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const { error } = await supabase
        .from("building_service_bookings")
        .update({ status })
        .eq("id", bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      toast.success("Booking status updated");
    },
  });

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      confirmed: "bg-blue-100 text-blue-800",
      in_progress: "bg-purple-100 text-purple-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  // Stats
  const stats = {
    pendingPosts: pendingPosts.length,
    totalBookings: bookings.length,
    pendingBookings: bookings.filter((b) => b.status === "pending").length,
    totalOrders: vendorOrders.length,
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage learn posts, bookings, and orders</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Posts</p>
                <p className="text-xl font-bold">{stats.pendingPosts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wrench className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
                <p className="text-xl font-bold">{stats.totalBookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Bookings</p>
                <p className="text-xl font-bold">{stats.pendingBookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vendor Orders</p>
                <p className="text-xl font-bold">{stats.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="posts" className="gap-2">
            <FileText className="h-4 w-4" />
            Learn Posts
            {stats.pendingPosts > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {stats.pendingPosts}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="bookings" className="gap-2">
            <Wrench className="h-4 w-4" />
            Building Services
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Vendor Orders
          </TabsTrigger>
        </TabsList>

        {/* Learn Posts Tab */}
        <TabsContent value="posts" className="space-y-4 mt-4">
          {pendingPosts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <p className="text-muted-foreground">No pending posts to review</p>
              </CardContent>
            </Card>
          ) : (
            pendingPosts.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarFallback>{post.author_name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{post.title}</h3>
                        <Badge className={getStatusBadge(post.status)}>{post.status}</Badge>
                        <Badge variant="outline">{post.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {post.content}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Submitted {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => updatePostMutation.mutate({ postId: post.id, status: "rejected" })}
                      >
                        <XCircle className="h-4 w-4 text-red-500" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1"
                        onClick={() => updatePostMutation.mutate({ postId: post.id, status: "approved" })}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Building Services Tab */}
        <TabsContent value="bookings" className="space-y-4 mt-4">
          {bookings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No bookings yet</p>
              </CardContent>
            </Card>
          ) : (
            bookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{booking.worker_type}</h3>
                        <Badge className={getStatusBadge(booking.status)}>{booking.status}</Badge>
                        <Badge variant="outline">{booking.service_category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{booking.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(booking.scheduled_date), "MMM d, yyyy")}
                          {booking.scheduled_time && ` at ${booking.scheduled_time}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {booking.address}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {booking.estimated_cost && (
                        <p className="text-lg font-bold text-primary">${booking.estimated_cost}</p>
                      )}
                      <select
                        value={booking.status}
                        onChange={(e) =>
                          updateBookingMutation.mutate({ bookingId: booking.id, status: e.target.value })
                        }
                        className="text-xs border rounded px-2 py-1"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Vendor Orders Tab */}
        <TabsContent value="orders" className="space-y-4 mt-4">
          {vendorOrders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No orders yet</p>
              </CardContent>
            </Card>
          ) : (
            vendorOrders.map((order: any) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{order.order_number}</p>
                        <Badge className={getStatusBadge(order.status)}>{order.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.product_name} × {order.quantity}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Vendor: {order.vendors?.store_name || "Unknown"} ·{" "}
                        {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">${Number(order.total_price).toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
