import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "@core/api";
import { listenToOrderChannel } from "@core/realtime/echo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, Truck, CheckCircle, Clock, XCircle } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "/api";

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: string;
  total_price: string;
}

interface ProductOrder {
  id: string;
  order_number: string;
  status: string;
  total_amount: string;
  created_at: string;
  items: OrderItem[];
  shipping_address: string;
}

interface TrackingEntry {
  id: string;
  status: string;
  status_message: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery<ProductOrder>({
    queryKey: ["product-order", id],
    queryFn: async () => {
      const res = await http.get<{ data: ProductOrder }>(`${API}/product-orders/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const { data: tracking } = useQuery<TrackingEntry[]>({
    queryKey: ["product-order-tracking", id],
    queryFn: async () => {
      const res = await http.get<{ data: TrackingEntry[] }>(`${API}/product-orders/${id}/tracking`);
      return res.data ?? [];
    },
    enabled: !!id,
    refetchInterval: order && !["delivered", "cancelled", "refunded"].includes(order.status) ? 15_000 : false,
  });

  // Live status pushes over Reverb
  useEffect(() => {
    if (!id || (order && ["delivered", "cancelled", "refunded"].includes(order.status))) return;
    return listenToOrderChannel(id, () => {
      queryClient.invalidateQueries({ queryKey: ["product-order", id] });
      queryClient.invalidateQueries({ queryKey: ["product-order-tracking", id] });
    });
  }, [id, order?.status, queryClient]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Order not found</p>
        <Button variant="link" onClick={() => navigate("/orders")}>Back to orders</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/orders")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Order {order.order_number}</h1>
          <p className="text-sm text-muted-foreground">
            Placed on {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
        <Badge className={statusColors[order.status] || "bg-gray-100"}>
          {order.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            {order.status === "delivered" ? <CheckCircle className="h-5 w-5 text-green-500" /> :
             order.status === "shipped" ? <Truck className="h-5 w-5 text-purple-500" /> :
             ["cancelled", "refunded"].includes(order.status) ? <XCircle className="h-5 w-5 text-red-400" /> :
             <Clock className="h-5 w-5 text-blue-500" />}
            <span className="capitalize font-semibold">{order.status}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${Number(order.total_amount).toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {tracking && tracking.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tracking timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {[...tracking].reverse().map((t) => (
                <li key={t.id} className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-violet-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium capitalize">{t.status}</p>
                    {t.status_message && (
                      <p className="text-xs text-muted-foreground">{t.status_message}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(t.created_at).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" /> Items ({order.items?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Qty: {item.quantity} · ${Number(item.unit_price).toFixed(2)} each
                  </p>
                </div>
                <p className="font-semibold">${Number(item.total_price).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Shipping address</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{order.shipping_address}</p>
        </CardContent>
      </Card>

      {!["cancelled", "refunded", "delivered"].includes(order.status) && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await http.post(`${API}/product-orders/${id}/cancel`);
                navigate(0);
              } catch {
                // cancellation window has passed — server enforces status rules
              }
            }}
          >
            Cancel order
          </Button>
        </div>
      )}
    </div>
  );
}

export default OrderDetail;
