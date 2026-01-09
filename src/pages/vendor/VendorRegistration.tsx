import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Store, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const vendorCategories = [
  "Electronics",
  "Fashion",
  "Home & Garden",
  "Sports & Fitness",
  "Beauty & Care",
  "Food & Groceries",
  "Healthcare",
  "Books & Education",
  "Agriculture",
  "Building & Construction",
  "Professional Services",
  "Other"
];

const VendorRegistration = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    storeName: "",
    category: "",
    description: "",
    businessEmail: user?.email || "",
    businessPhone: "",
    businessAddress: "",
    taxId: "",
    acceptTerms: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please sign in to register as a vendor");
      navigate("/auth");
      return;
    }

    if (!formData.storeName || !formData.category || !formData.acceptTerms) {
      toast.error("Please fill in all required fields and accept terms");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.from("vendors").insert({
        user_id: user.id,
        store_name: formData.storeName,
        category: formData.category,
        description: formData.description,
        is_verified: false
      });

      if (error) throw error;
      
      toast.success("Vendor application submitted! We'll review and get back to you within 24-48 hours.");
      setStep(3); // Success step
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("You already have a vendor account");
      } else {
        toast.error("Failed to submit application. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              Your vendor application has been received. Our team will review it and contact you within 24-48 hours.
            </p>
            <Button onClick={() => navigate("/")}>Back to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary via-primary to-secondary py-8">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Store className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground">Become a Vendor</h1>
              <p className="text-primary-foreground/80">
                Start selling your products to thousands of customers
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {s}
              </div>
              {s < 2 && <div className={`w-16 h-1 mx-2 ${s < step ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>
              {step === 1 ? "Store Information" : "Business Details"}
            </CardTitle>
            <CardDescription>
              {step === 1 
                ? "Tell us about your store and what you'll be selling"
                : "Provide your business contact information"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); setStep(2); }} className="space-y-6">
              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Store Name *</Label>
                    <Input
                      id="storeName"
                      placeholder="Your store or business name"
                      value={formData.storeName}
                      onChange={(e) => setFormData(prev => ({ ...prev, storeName: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Product Category *</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your main category" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendorCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Store Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your store and products..."
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Continue
                  </Button>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Business Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="business@example.com"
                        value={formData.businessEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, businessEmail: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Business Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={formData.businessPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, businessPhone: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Business Address</Label>
                    <Textarea
                      id="address"
                      placeholder="Your business address"
                      rows={2}
                      value={formData.businessAddress}
                      onChange={(e) => setFormData(prev => ({ ...prev, businessAddress: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID / Business Registration (Optional)</Label>
                    <Input
                      id="taxId"
                      placeholder="Your tax ID or registration number"
                      value={formData.taxId}
                      onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
                    />
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={formData.acceptTerms}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, acceptTerms: checked as boolean }))}
                    />
                    <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                      I agree to the <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> and{" "}
                      <Link to="/privacy" className="text-primary hover:underline">Vendor Agreement</Link>. 
                      I confirm that the information provided is accurate.
                    </Label>
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Application"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorRegistration;
