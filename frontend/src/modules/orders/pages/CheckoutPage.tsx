import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin, CreditCard, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/textarea";
import { Card } from "@shared/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/ui/select";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { http } from "@core/api";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.VITE_API_URL || "/api";

const PAYMENT_METHODS = [
  { value: "card", label: "Card" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

type Step = "details" | "payment" | "done";

interface PlacedOrder {
  id: string;
  order_number: string;
  total_amount: string;
}

const CheckoutPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("details");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [method, setMethod] = useState("card");
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<PlacedOrder | null>(null);

  const handlePlaceOrder = async () => {
    if (!user) {
      toast({ title: "Please sign in", description: "Sign in to place an order.", variant: "destructive" });
      navigate("/auth");
      return;
    }

    if (!address.trim()) {
      toast({ title: "Address required", description: "Enter your delivery address.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await http.post<{ data: PlacedOrder }>(`${API}/product-orders`, {
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        shipping_address: address,
        shipping_city: city || undefined,
        shipping_country: country || undefined,
        phone: phone || undefined,
        notes: notes || undefined,
      });
      setOrder(res.data);
      setStep("payment");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not place your order.";
      toast({ title: "Order failed", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePay = async () => {
    if (!order) return;

    setSubmitting(true);
    try {
      await http.post(`${API}/payments/charge`, {
        order_id: order.id,
        amount: Number(order.total_amount),
        method,
      });

      await clearCart();
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setStep("done");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Payment could not be processed.";
      toast({ title: "Payment failed", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Confirmation ──
  if (step === "done" && order) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-muted/30 px-4">
        <Card className="max-w-lg w-full p-8 text-center">
          <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Payment successful</h1>
          <p className="text-muted-foreground text-sm mb-1">
            Order <span className="font-semibold text-foreground">{order.order_number}</span> is confirmed and paid.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Total paid: <span className="font-semibold text-foreground">${Number(order.total_amount).toFixed(2)}</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate(`/orders/${order.id}`)}>Track order</Button>
            <Button variant="outline" onClick={() => navigate("/orders")}>View all orders</Button>
            <Button variant="ghost" onClick={() => navigate("/products")}>Continue shopping</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (items.length === 0 && step !== "done") {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <Button onClick={() => navigate("/products")}>Browse products</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          {(["details", "payment"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full grid place-items-center text-xs font-semibold ${step === s ? "bg-primary text-primary-foreground" : step === "done" || (s === "payment" && step === "payment") ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                {i + 1}
              </span>
              <span className={step === s ? "font-medium" : "text-muted-foreground"}>
                {s === "details" ? "Delivery details" : "Payment"}
              </span>
              {i === 0 && <span className="mx-2 h-px w-8 bg-border" />}
            </div>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); step === "details" ? handlePlaceOrder() : handlePay(); }} className="space-y-6">
          {step === "details" && (
            <>
              <Card className="p-6">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" /> Delivery address
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <Label htmlFor="address">Full address *</Label>
                    <Textarea id="address" rows={3} required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, building, apartment…" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 …" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="notes">Delivery notes (optional)</Label>
                    <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="font-semibold mb-4">Order summary</h2>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm border-b border-border pb-2 last:border-0">
                      <span>{item.product?.name ?? "Item"} × {item.quantity}</span>
                      <span className="font-medium">${(Number(item.unit_price) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-3 border-t">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold text-primary">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </Card>

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? "Placing order…" : "Continue to payment"}
              </Button>
            </>
          )}

          {step === "payment" && order && (
            <>
              <Card className="p-6">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" /> Payment method
                </h2>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="mt-4 p-3 rounded-lg bg-muted/50 flex items-start gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" />
                  Payments are processed by EverythingNeed Pay in test mode. No real money moves yet.
                </div>

                <div className="flex justify-between pt-4 mt-2 border-t">
                  <span className="font-semibold">Amount due</span>
                  <span className="text-xl font-bold text-primary">${Number(order.total_amount).toFixed(2)}</span>
                </div>
              </Card>

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? "Processing payment…" : `Pay $${Number(order.total_amount).toFixed(2)}`}
              </Button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;
