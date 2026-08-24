import { http } from "@/core/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

const STATUSES = ["placed", "preparing", "on_the_way", "delivered"];

export default function FoodOrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: order, isLoading } = useQuery({
    queryKey: ["foodOrder", id],
    queryFn: () =>
      http.get<any>(`/api/bookings/${id}`).then((res) => res.data),
  });

  if (isLoading) {
    return <div className="p-8 text-center">Loading order...</div>;
  }

  if (!order) {
    return <div className="p-8 text-center">Order not found.</div>;
  }

  const currentIndex = STATUSES.indexOf(order.status || "placed");

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate("/food")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Food
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Order #{order.id}</CardTitle>
            <Badge variant="secondary">
              {order.status?.replace("_", " ") || "Placed"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            {STATUSES.map((status, index) => (
              <div key={status} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentIndex
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </div>
                <div>
                  <p
                    className={`font-medium ${
                      index <= currentIndex
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </p>
                  {index === currentIndex && (
                    <p className="text-xs text-muted-foreground">Current</p>
                  )}
                  {index < currentIndex && (
                    <p className="text-xs text-muted-foreground">Completed</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {order.items && order.items.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Order Items</h3>
              {order.items.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex justify-between py-1 border-b last:border-b-0"
                >
                  <span>
                    {item.name} x{item.quantity}
                  </span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {order.total && (
            <div className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>Total</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
