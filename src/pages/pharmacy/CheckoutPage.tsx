import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, MapPin, CreditCard, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, totalPrice, requiresPrescription, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      setPrescriptionFile(file);
    }
  };

  const uploadPrescription = async () => {
    if (!prescriptionFile || !user) return null;

    setUploading(true);
    const fileExt = prescriptionFile.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("prescriptions")
      .upload(filePath, prescriptionFile);

    setUploading(false);

    if (error) {
      toast({
        title: "Upload failed",
        description: "Could not upload prescription",
        variant: "destructive",
      });
      return null;
    }

    return data.path;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to place an order",
        variant: "destructive",
      });
      return;
    }

    if (!address.trim()) {
      toast({
        title: "Address required",
        description: "Please enter your delivery address",
        variant: "destructive",
      });
      return;
    }

    if (requiresPrescription && !prescriptionFile) {
      toast({
        title: "Prescription required",
        description: "Please upload a prescription for prescription medicines",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    let prescriptionUrl = null;
    if (prescriptionFile) {
      prescriptionUrl = await uploadPrescription();
      if (requiresPrescription && !prescriptionUrl) {
        setSubmitting(false);
        return;
      }
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("medicine_orders")
      .insert({
        user_id: user.id,
        total_amount: totalPrice,
        delivery_address: address,
        prescription_url: prescriptionUrl,
      } as any)
      .select()
      .single();

    if (orderError) {
      toast({
        title: "Order failed",
        description: "Could not create order. Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    // Add order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      medicine_id: item.medicine_id,
      quantity: item.quantity,
      unit_price: item.medicine.price,
    }));

    const { error: itemsError } = await supabase
      .from("medicine_order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Error adding order items:", itemsError);
    }

    // Clear cart
    await clearCart();

    toast({
      title: "Order placed!",
      description: `Order ${order.order_number} has been placed successfully`,
    });

    navigate(`/pharmacy/order/${order.id}`);
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <Button onClick={() => navigate("/pharmacy")}>Go to Pharmacy</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/pharmacy")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Pharmacy
        </Button>

        <h1 className="text-2xl md:text-3xl font-bold mb-6">Checkout</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Delivery Address */}
            <Card className="p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Delivery Address
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="address">Full Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter your complete delivery address..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Delivery Notes (Optional)</Label>
                  <Input
                    id="notes"
                    placeholder="Any special instructions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </Card>

            {/* Prescription Upload */}
            <Card className="p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Prescription Upload
                {requiresPrescription && (
                  <span className="text-xs text-destructive">* Required</span>
                )}
              </h2>

              {requiresPrescription && (
                <div className="mb-4 p-3 bg-warning/10 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Some items in your cart require a valid prescription. Please
                    upload a clear image or PDF of your prescription.
                  </p>
                </div>
              )}

              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Input
                  type="file"
                  id="prescription"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Label
                  htmlFor="prescription"
                  className="cursor-pointer block space-y-2"
                >
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {prescriptionFile
                      ? prescriptionFile.name
                      : "Click to upload prescription"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG or PDF up to 5MB
                  </p>
                </Label>
              </div>
            </Card>
          </div>

          {/* Order Summary */}
          <Card className="p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Order Summary
            </h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between text-sm py-2 border-b border-border last:border-0"
                >
                  <span>
                    {item.medicine.name} x {item.quantity}
                  </span>
                  <span className="font-medium">
                    ${(Number(item.medicine.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between pt-3 border-t border-border">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-primary">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </Card>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={submitting || uploading}
          >
            {submitting ? "Placing Order..." : "Place Order"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;
