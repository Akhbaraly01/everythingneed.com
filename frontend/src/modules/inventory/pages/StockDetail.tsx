import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { http } from "@/core/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, AlertTriangle } from "lucide-react";

interface StockItem {
  id: string;
  product_name: string;
  sku: string;
  quantity: number;
  low_stock_threshold: number;
  status: string;
  last_restocked: string;
  movements: { id: string; type: string; quantity: number; date: string; note: string }[];
}

const statusColors: Record<string, string> = {
  in_stock: "bg-green-100 text-green-800",
  low_stock: "bg-yellow-100 text-yellow-800",
  out_of_stock: "bg-red-100 text-red-800",
};

export function StockDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: stock, isLoading } = useQuery<StockItem>({
    queryKey: ["stock", id],
    queryFn: async () => {
      const { data } = await http.get<any>(`/api/stock/${id}`);
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

  if (!stock) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Stock item not found</p>
        <Button variant="link" onClick={() => navigate("/inventory")}>Back to inventory</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/inventory")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{stock.product_name}</h1>
          <p className="text-sm text-muted-foreground font-mono">{stock.sku}</p>
        </div>
        <Badge className={statusColors[stock.status] || "bg-gray-100"}>{stock.status}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stock.quantity}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Threshold</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            {stock.quantity <= stock.low_stock_threshold && (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            )}
            <p className="text-3xl font-bold">{stock.low_stock_threshold}</p>
          </CardContent>
        </Card>
      </div>

      {stock.movements && stock.movements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" /> Stock Movements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {stock.movements.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-3">
                  <div>
                    <Badge variant={m.type === "in" ? "default" : "secondary"}>{m.type === "in" ? "Restocked" : "Sold"}</Badge>
                    <span className="ml-2 text-sm">{m.note}</span>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${m.type === "in" ? "text-green-600" : "text-red-600"}`}>
                      {m.type === "in" ? "+" : "-"}{m.quantity}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(m.date).toLocaleDateString()}</p>
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

export default StockDetail;
