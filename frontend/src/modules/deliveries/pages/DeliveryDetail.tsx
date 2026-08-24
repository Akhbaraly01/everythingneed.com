import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { http } from "@/core/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Truck, MapPin, Clock, Package } from "lucide-react";

interface Delivery {
  id: string;
  order_number: string;
  status: string;
  driver_name: string;
  driver_phone: string;
  current_location?: string;
  pickup_address: string;
  delivery_address: string;
  estimated_delivery: string;
  created_at: string;
  updates: { id: string; status: string; location: string; timestamp: string; note: string }[];
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  picked_up: "bg-blue-100 text-blue-800",
  in_transit: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

export function DeliveryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: delivery, isLoading } = useQuery<Delivery>({
    queryKey: ["delivery", id],
    queryFn: async () => {
      const { data } = await http.get<any>(`/api/delivery/managers/${id}`);
      return data.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Delivery not found</p>
        <Button variant="link" onClick={() => navigate("/deliveries")}>Back to deliveries</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/deliveries")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Delivery {delivery.order_number}</h1>
          <p className="text-sm text-muted-foreground">
            Created {new Date(delivery.created_at).toLocaleDateString()}
          </p>
        </div>
        <Badge className={statusColors[delivery.status] || "bg-gray-100"}>
          {delivery.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pickup</CardTitle>
          </CardHeader>
          <CardContent className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-blue-500 mt-0.5" />
            <p className="text-sm">{delivery.pickup_address}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Delivery</CardTitle>
          </CardHeader>
          <CardContent className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-green-500 mt-0.5" />
            <p className="text-sm">{delivery.delivery_address}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Driver</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{delivery.driver_name}</p>
            <p className="text-sm text-muted-foreground">{delivery.driver_phone}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ETA</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p>{new Date(delivery.estimated_delivery).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {delivery.updates && delivery.updates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" /> Tracking Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative pl-6 space-y-4">
              <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200" />
              {delivery.updates.map((u) => (
                <div key={u.id} className="relative">
                  <div className="absolute -left-4 top-1 h-3 w-3 rounded-full bg-violet-500 border-2 border-white" />
                  <div>
                    <Badge variant="outline" className="text-xs">{u.status}</Badge>
                    <p className="text-sm mt-1">{u.note}</p>
                    {u.location && <p className="text-xs text-muted-foreground">{u.location}</p>}
                    <p className="text-xs text-muted-foreground">{new Date(u.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default DeliveryDetail;
