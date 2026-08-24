import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { http } from "@/core/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, Receipt } from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  reference: string;
  description?: string;
  created_at: string;
  order_id?: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};

export function PaymentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: payment, isLoading } = useQuery<Payment>({
    queryKey: ["payment", id],
    queryFn: async () => {
      const { data } = await http.get<any>(`/api/payments/${id}`);
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

  if (!payment) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Payment not found</p>
        <Button variant="link" onClick={() => navigate("/payments")}>Back to payments</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/payments")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Payment Details</h1>
          <p className="text-sm text-muted-foreground">{payment.reference}</p>
        </div>
        <Badge className={statusColors[payment.status] || "bg-gray-100"}>
          {payment.status}
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Amount</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">
            {payment.currency} {payment.amount?.toFixed(2)}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Method</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="capitalize">{payment.method}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Date</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{new Date(payment.created_at).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {payment.description && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{payment.description}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Receipt</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="gap-2">
            <Receipt className="h-4 w-4" /> Download Receipt
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default PaymentDetail;
