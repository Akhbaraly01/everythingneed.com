import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { http } from "@core/api";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Textarea } from "@shared/ui/textarea";
import { Label } from "@shared/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@shared/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/ui/select";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "/api";

interface NeedCategory {
  id: string;
  name: string;
  description?: string;
}

const SubmitRequest = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const initialType = searchParams.get("type") || "";

  const [formData, setFormData] = useState({
    categoryId: initialType,
    title: "",
    description: "",
    budgetMin: "",
    budgetMax: "",
    location: "",
    deadline: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["need-categories"],
    queryFn: () => http.get<{ data: NeedCategory[] }>(`${API}/need-categories`).then((r) => r.data ?? []),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please sign in to submit a request");
      navigate("/auth");
      return;
    }

    if (!formData.title || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      await http.post(`${API}/need-requests`, {
        title: formData.title,
        description: formData.description,
        category_id: formData.categoryId || undefined,
        budget_min: formData.budgetMin ? Number(formData.budgetMin) : undefined,
        budget_max: formData.budgetMax ? Number(formData.budgetMax) : undefined,
        location: formData.location || undefined,
        deadline: formData.deadline || undefined,
      });

      toast.success("Request submitted! Providers can now send you offers.");
      navigate("/account/requests");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 5);
      setFormData(prev => ({ ...prev, attachments: files }));
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-gradient-primary py-8">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground">Submit Your Need</h1>
          <p className="text-primary-foreground/80 mt-2">
            Tell us what you're looking for and our team will help you find it
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Request Form</CardTitle>
            <CardDescription>
              Fill out the details below and we'll connect you with the right vendor or service provider
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category Selection */}
              <div className="space-y-2">
                <Label>Request Category</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">What do you need? *</Label>
                <Input
                  id="title"
                  required
                  placeholder="e.g., Looking for a plumber for bathroom renovation"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description *</Label>
                <Textarea
                  id="description"
                  required
                  placeholder="Provide as much detail as possible about your requirements..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              {/* Budget & Deadline */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget-min">Budget from ($)</Label>
                  <Input
                    id="budget-min"
                    type="number"
                    min={0}
                    placeholder="80"
                    value={formData.budgetMin}
                    onChange={(e) => setFormData(prev => ({ ...prev, budgetMin: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget-max">Budget up to ($)</Label>
                  <Input
                    id="budget-max"
                    type="number"
                    min={0}
                    placeholder="150"
                    value={formData.budgetMax}
                    onChange={(e) => setFormData(prev => ({ ...prev, budgetMax: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="Your city or area"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline (optional)</Label>
                  <input
                    id="deadline"
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={formData.deadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubmitRequest;
