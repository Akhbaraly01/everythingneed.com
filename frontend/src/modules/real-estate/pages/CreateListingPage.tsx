import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { http } from "@/core/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle } from "lucide-react";

export default function CreateListingPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", price: "", property_type: "rent", location: "", bedrooms: "", bathrooms: "", area_sqft: "" });

  const mutation = useMutation({
    mutationFn: async () => { await http.post("/api/properties", { ...form, price: Number(form.price), bedrooms: Number(form.bedrooms), bathrooms: Number(form.bathrooms), area_sqft: Number(form.area_sqft) }); },
    onSuccess: () => navigate("/properties"),
  });

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/properties")}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
        <h1 className="text-2xl font-bold">List Property</h1>
      </div>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div><label className="text-sm font-medium">Title</label><input className="w-full border rounded-md px-3 py-2 mt-1" value={form.title} onChange={(e) => update("title", e.target.value)} /></div>
          <div><label className="text-sm font-medium">Description</label><textarea className="w-full border rounded-md px-3 py-2 mt-1" rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium">Price</label><input type="number" className="w-full border rounded-md px-3 py-2 mt-1" value={form.price} onChange={(e) => update("price", e.target.value)} /></div>
            <div><label className="text-sm font-medium">Type</label><select className="w-full border rounded-md px-3 py-2 mt-1" value={form.property_type} onChange={(e) => update("property_type", e.target.value)}>
              <option value="rent">For Rent</option><option value="buy">For Sale</option></select></div>
          </div>
          <div><label className="text-sm font-medium">Location</label><input className="w-full border rounded-md px-3 py-2 mt-1" value={form.location} onChange={(e) => update("location", e.target.value)} /></div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="text-sm font-medium">Bedrooms</label><input type="number" className="w-full border rounded-md px-3 py-2 mt-1" value={form.bedrooms} onChange={(e) => update("bedrooms", e.target.value)} /></div>
            <div><label className="text-sm font-medium">Bathrooms</label><input type="number" className="w-full border rounded-md px-3 py-2 mt-1" value={form.bathrooms} onChange={(e) => update("bathrooms", e.target.value)} /></div>
            <div><label className="text-sm font-medium">Area (sqft)</label><input type="number" className="w-full border rounded-md px-3 py-2 mt-1" value={form.area_sqft} onChange={(e) => update("area_sqft", e.target.value)} /></div>
          </div>
          <Button className="w-full" onClick={() => mutation.mutate()} disabled={mutation.isPending}>{mutation.isPending ? "Creating..." : "Create Listing"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
