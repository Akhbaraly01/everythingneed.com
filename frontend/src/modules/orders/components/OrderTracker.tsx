import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import { Progress } from "@shared/ui/progress";
import { Separator } from "@shared/ui/separator";
import { 
  Package, CheckCircle, Truck, MapPin, Clock, 
  ShoppingBag, Loader2, Bell
} from "lucide-react";
import { db } from "@core/api/laravelGateway";
import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface OrderStatus {
  id: string;
  order_id: string;
  order_type: string;
  status: string;
  status_message: string | null;
  estimated_delivery: string | null;
  updated_at: string;
}

interface OrderTrackerProps {
  orderId?: string;
  orderType?: 'medicine' | 'product' | 'service';
  showAll?: boolean;
}

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: ShoppingBag },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: MapPin },
];

const getStatusIndex = (status: string) => {
  const index = statusSteps.findIndex(s => s.key === status);
  return index >= 0 ? index : 0;
};

const getProgressPercentage = (status: string) => {
  const index = getStatusIndex(status);
  return ((index + 1) / statusSteps.length) * 100;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'delivered':
      return 'text-green-500';
    case 'cancelled':
      return 'text-red-500';
    case 'shipped':
      return 'text-blue-500';
    default:
      return 'text-primary';
  }
};

const OrderTracker = ({ orderId, orderType, showAll = false }: OrderTrackerProps) => {
  const { user } = useAuth();
  const { notifyOrderUpdate, permission, requestPermission } = usePushNotifications();
  const [orders, setOrders] = useState<OrderStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    fetchOrders();

    // TODO: Realtime subscriptions will be implemented via WebSocket adapter
  }, [user, permission]);

  const fetchOrders = async () => {
    try {
      let query = db
        .from('order_tracking')
        .select('*')
        .orderBy('updated_at', false);

      if (orderId) {
        query = query.where('order_id', '=', orderId);
      }
      
      if (orderType) {
        query = query.where('order_type', '=', orderType);
      }

      if (!showAll) {
        query = query.limit(5);
      }

      const data = await query;

      setOrders((data as unknown as OrderStatus[]) || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No orders to track</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {permission !== 'granted' && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <span className="text-sm">Enable notifications for order updates</span>
            </div>
            <Badge 
              className="cursor-pointer" 
              onClick={requestPermission}
            >
              Enable
            </Badge>
          </CardContent>
        </Card>
      )}

      {orders.map((order) => {
        const currentStep = getStatusIndex(order.status);
        const progress = getProgressPercentage(order.status);

        return (
          <Card key={order.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Order #{order.order_id.slice(0, 8).toUpperCase()}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground capitalize">
                    {order.order_type} Order
                  </p>
                </div>
                <Badge className={cn("capitalize", getStatusColor(order.status))}>
                  {order.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Status Steps */}
              <div className="flex justify-between">
                {statusSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = index <= currentStep;
                  const isCurrent = index === currentStep;

                  return (
                    <div 
                      key={step.key}
                      className={cn(
                        "flex flex-col items-center gap-1 text-center",
                        isCompleted ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                        isCompleted ? "bg-primary text-primary-foreground" : "bg-muted",
                        isCurrent && "ring-2 ring-primary ring-offset-2"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-medium hidden md:block">{step.label}</span>
                    </div>
                  );
                })}
              </div>

              <Separator />

              {/* Status Message */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {order.status_message || `Your order is ${order.status}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Updated {formatDistanceToNow(new Date(order.updated_at), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {/* Estimated Delivery */}
              {order.estimated_delivery && (
                <div className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg p-3">
                  <Truck className="h-4 w-4 text-primary" />
                  <span>Estimated delivery: {new Date(order.estimated_delivery).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default OrderTracker;
