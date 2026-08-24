import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Package, Eye, Loader2 } from "lucide-react";
import { http } from "@core/api";

const API = import.meta.env.VITE_API_URL || "/api";

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    http.get<any>(`${API}/product-orders`).then(res => {
      setOrders(res.data?.data || res.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter(o =>
    o.id?.toLowerCase().includes(search.toLowerCase()) ||
    o.order_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2"><Package className="h-8 w-8" /> My Orders</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 w-64" />
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle>Order History</CardTitle><CardDescription>Track all your orders</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Order ID</TableHead><TableHead>Status</TableHead><TableHead>Total</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.map(order => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">{order.id?.slice(0, 8)}...</TableCell>
                  <TableCell><Badge variant={order.status === "delivered" ? "default" : order.status === "cancelled" ? "destructive" : "secondary"}>{order.status}</Badge></TableCell>
                  <TableCell>${order.total_amount || "0.00"}</TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => navigate(`/orders/${order.id}`)}><Eye className="h-4 w-4 mr-1" />View</Button></TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No orders found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
