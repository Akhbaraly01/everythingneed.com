import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Warehouse } from "lucide-react";

export default function InventoryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold flex items-center gap-2 mb-6"><Warehouse className="h-8 w-8" /> Inventory</h1>
      <Card><CardHeader><CardTitle>Stock Management</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Monitor stock levels and manage inventory across warehouses.</p></CardContent>
      </Card>
    </div>
  );
}
