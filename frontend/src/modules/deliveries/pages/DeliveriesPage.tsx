import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck } from "lucide-react";

export default function DeliveriesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold flex items-center gap-2 mb-6"><Truck className="h-8 w-8" /> Deliveries</h1>
      <Card><CardHeader><CardTitle>Delivery Management</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Track and manage your deliveries.</p></CardContent>
      </Card>
    </div>
  );
}
