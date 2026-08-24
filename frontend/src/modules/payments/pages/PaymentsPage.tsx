import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard } from "lucide-react";
import { http } from "@core/api";

const API = import.meta.env.VITE_API_URL || "/api";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    http.get<any>(`${API}/payments`).then(res => setPayments(res.data?.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold flex items-center gap-2 mb-6"><CreditCard className="h-8 w-8" /> Payments</h1>
      <Card>
        <CardHeader><CardTitle>Payment History</CardTitle><CardDescription>All your transactions</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
            <TableBody>
              {payments.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-sm">{p.id?.slice(0, 8)}...</TableCell>
                  <TableCell>${p.amount || "0.00"}</TableCell>
                  <TableCell><Badge variant={p.status === "completed" ? "default" : p.status === "failed" ? "destructive" : "secondary"}>{p.status}</Badge></TableCell>
                  <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {payments.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No payments found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
