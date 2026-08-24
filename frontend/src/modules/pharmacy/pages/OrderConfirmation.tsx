import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, Package, Truck, MapPin, ArrowLeft } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Card } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import { db } from "@core/api/laravelGateway";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  delivery_address: string;
  created_at: string;
}

const OrderConfirmation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;

      try {
        const data = await db
          .from("medicine_orders")
          .select("*")
          .where("id", "=", id)
          .single();

        setOrder(data);
      } catch (error) {
        console.error("Error fetching order:", error);
        navigate("/pharmacy");
        return;
      }
      setLoading(false);
    };

    fetchOrder();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>Order not found</p>
        <Button onClick={() => navigate("/pharmacy")} className="mt-4">
          Go to Pharmacy
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-warning text-warning-foreground";
      case "confirmed":
        return "bg-primary text-primary-foreground";
      case "shipped":
        return "bg-secondary text-secondary-foreground";
      case "delivered":
        return "bg-success text-success-foreground";
      case "cancelled":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Order Placed Successfully!
          </h1>
          <p className="text-muted-foreground mb-6">
            Your order has been received and is being processed.
          </p>

          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-muted-foreground">Order Number</p>
            <p className="text-xl font-bold text-primary">{order.order_number}</p>
          </div>

          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Status</span>
              </div>
              <Badge className={getStatusColor(order.status)}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Estimated Delivery</span>
              </div>
              <span className="text-sm text-muted-foreground">2-3 business days</span>
            </div>

            <div className="p-3 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Delivery Address</span>
              </div>
              <p className="text-sm text-muted-foreground pl-8">
                {order.delivery_address}
              </p>
            </div>

            <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
              <span className="font-medium">Total Amount</span>
              <span className="text-xl font-bold text-primary">
                ${Number(order.total_amount).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/pharmacy")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
            <Button className="flex-1" onClick={() => navigate("/account")}>
              View My Orders
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default OrderConfirmation;
