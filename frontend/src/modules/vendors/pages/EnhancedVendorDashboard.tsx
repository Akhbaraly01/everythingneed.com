import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { http } from "@core/api";
const API = import.meta.env.VITE_API_URL || "/api";

interface VendorProduct {
  id: string;
  name: string;
  price: string;
  stock_quantity: number;
  is_active: boolean;
  category: string;
}

interface VendorOrderRow {
  shipping_address: string | null;
  id: string;
  order_number: string;
  product_name: string;
  quantity: number;
  total_price: string;
  status: string;
  created_at: string;
}
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Bell,
  Truck,
  Clock,
  CheckCircle,
  Video,
  Upload,
  RefreshCw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@shared/ui/dialog";
import { formatDistanceToNow } from "date-fns";

const EnhancedVendorDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    compare_price: "",
    category: "",
    stock_quantity: "",
    image_url: "",
    video_url: "",
    production_video_url: "",
  });

  // Fetch vendor info
  const { data: vendor } = useQuery({
    queryKey: ["vendor-mine"],
    queryFn: async () => {
      const res = await http.get<{ data: { id: string; store_name: string } | null }>(`${API}/vendors/mine`);
      if (!res.data) throw new Error("Vendor not found");
      return res.data;
    },
    enabled: !!user?.id,
  });

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ["vendor-products", vendor?.id],
    queryFn: async () => {
      const res = await http.get<{ data: VendorProduct[] }>(
        `${API}/products?vendor_id=${vendor?.id}&per_page=100`
      );
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!vendor?.id,
  });

  // Fetch orders with real-time subscription
  const { data: orders = [], refetch: refetchOrders } = useQuery({
    queryKey: ["vendor-orders", vendor?.id],
    queryFn: async () => {
      const res = await http.get<{ data: VendorOrderRow[] }>(`${API}/vendor/orders`);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!vendor?.id,
    refetchInterval: 15_000,
  });

  // Add product mutation with video support
  const addProductMutation = useMutation({
    mutationFn: async (product: typeof newProduct) => {
      await http.post(`${API}/products`, {
        vendor_id: vendor?.id,
        name: product.name,
        description: product.description,
        price: parseFloat(product.price),
        compare_price: product.compare_price ? parseFloat(product.compare_price) : null,
        category: product.category,
        stock_quantity: parseInt(product.stock_quantity),
        image_url: product.image_url || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      setIsAddProductOpen(false);
      setNewProduct({
        name: "",
        description: "",
        price: "",
        compare_price: "",
        category: "",
        stock_quantity: "",
        image_url: "",
        video_url: "",
        production_video_url: "",
      });
      toast.success("Product added successfully!");
    },
    onError: () => {
      toast.error("Failed to add product");
    },
  });

  // Update order status through the vendor fulfilment API
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const actionByStatus: Record<string, string> = {
        confirmed: "accept",
        processing: "accept",
        shipped: "ship",
        delivered: "deliver",
      };
      const action = actionByStatus[status];
      if (!action) throw new Error(`Unsupported status '${status}'`);
      await http.post(`${API}/vendor/orders/${orderId}/${action}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
      toast.success("Order status updated!");
    },
    onError: () => {
      toast.error("Failed to update order status");
    },
  });

  // Delete product
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      await http.delete(`${API}/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      toast.success("Product deleted!");
    },
  });

  const getStatusMessage = (status: string) => {
    const messages: Record<string, string> = {
      pending: "Order received, awaiting confirmation",
      confirmed: "Order confirmed by vendor",
      processing: "Order is being prepared",
      shipped: "Order has been shipped",
      delivered: "Order delivered successfully",
      cancelled: "Order has been cancelled",
    };
    return messages[status] || status;
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalProducts: products.length,
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + Number(o.total_price), 0),
    pendingOrders: orders.filter((o) => o.status === "pending").length,
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      processing: "bg-purple-100 text-purple-800",
      shipped: "bg-indigo-100 text-indigo-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      pending: <Clock className="h-4 w-4" />,
      confirmed: <CheckCircle className="h-4 w-4" />,
      processing: <RefreshCw className="h-4 w-4" />,
      shipped: <Truck className="h-4 w-4" />,
      delivered: <CheckCircle className="h-4 w-4" />,
    };
    return icons[status];
  };

  if (!vendor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Become a Vendor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You don't have a vendor account yet. Create one to start selling!
            </p>
            <Button className="w-full">Apply to Become a Vendor</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
          <p className="text-muted-foreground">{vendor.store_name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            {stats.pendingOrders > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                {stats.pendingOrders}
              </span>
            )}
          </Button>
          <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Product Name</Label>
                  <Input
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Product description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Price</Label>
                    <Input
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Compare Price</Label>
                    <Input
                      type="number"
                      value={newProduct.compare_price}
                      onChange={(e) => setNewProduct({ ...newProduct, compare_price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Input
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      placeholder="Category"
                    />
                  </div>
                  <div>
                    <Label>Stock Quantity</Label>
                    <Input
                      type="number"
                      value={newProduct.stock_quantity}
                      onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <Label>Image URL</Label>
                  <Input
                    value={newProduct.image_url}
                    onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Product Video URL
                  </Label>
                  <Input
                    value={newProduct.video_url}
                    onChange={(e) => setNewProduct({ ...newProduct, video_url: e.target.value })}
                    placeholder="https://youtube.com/... or video file URL"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Showcase your product with a video demo
                  </p>
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Production Video URL
                  </Label>
                  <Input
                    value={newProduct.production_video_url}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, production_video_url: e.target.value })
                    }
                    placeholder="https://... (how product is made)"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Show customers how your product is made
                  </p>
                </div>
                <Button
                  className="w-full"
                  onClick={() => addProductMutation.mutate(newProduct)}
                  disabled={addProductMutation.isPending}
                >
                  {addProductMutation.isPending ? "Adding..." : "Add Product"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Products</p>
                <p className="text-xl font-bold">{stats.totalProducts}</p>
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
                <p className="text-sm text-muted-foreground">Orders</p>
                <p className="text-xl font-bold">{stats.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={stats.pendingOrders > 0 ? "border-yellow-400 bg-yellow-50/50" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl font-bold">{stats.pendingOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Orders
            {stats.pendingOrders > 0 && (
              <Badge variant="destructive" className="ml-1">
                {stats.pendingOrders}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <Package className="h-4 w-4" />
            Products
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4 mt-4">
          {orders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No orders yet</p>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => (
              <Card
                key={order.id}
                className={order.status === "pending" ? "border-yellow-400 bg-yellow-50/30" : ""}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{order.order_number}</p>
                        <Badge className={`${getStatusColor(order.status)} gap-1`}>
                          {getStatusIcon(order.status)}
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.product_name} × {order.quantity}
                      </p>
                      {order.shipping_address && (
                        <p className="text-xs text-muted-foreground">
                          📍 {order.shipping_address}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="text-lg font-bold text-primary">
                        ${Number(order.total_price).toFixed(2)}
                      </p>
                      <Select
                        value={order.status}
                        onValueChange={(value) =>
                          updateOrderMutation.mutate({ orderId: order.id, status: value })
                        }
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">⏳ Pending</SelectItem>
                          <SelectItem value="confirmed">✅ Confirmed</SelectItem>
                          <SelectItem value="processing">🔄 Processing</SelectItem>
                          <SelectItem value="shipped">🚚 Shipped</SelectItem>
                          <SelectItem value="delivered">📦 Delivered</SelectItem>
                          <SelectItem value="cancelled">❌ Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="products" className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid gap-4">
            {filteredProducts.map((product: any) => (
              <Card key={product.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden relative">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      {(product.video_url || product.production_video_url) && (
                        <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1 rounded-tl">
                          <Video className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.category}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-bold text-primary">
                          ${Number(product.price).toFixed(2)}
                        </span>
                        {product.compare_price && (
                          <span className="text-sm text-muted-foreground line-through">
                            ${Number(product.compare_price).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={product.stock_quantity > 0 ? "default" : "destructive"}>
                        {product.stock_quantity} in stock
                      </Badge>
                      <Button size="icon" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteProductMutation.mutate(product.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredProducts.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No products found</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedVendorDashboard;
