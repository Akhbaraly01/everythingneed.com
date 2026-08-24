import { http } from "@/core/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

export default function AddressesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    street: "",
    city: "",
    state: "",
    zip: "",
  });

  const { data: addresses, isLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => http.get<{ data: any[] }>("/api/addresses").then((res) => res.data),
  });

  const addMutation = useMutation({
    mutationFn: (data: typeof form) => http.post("/api/addresses", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      setForm({ street: "", city: "", state: "", zip: "" });
      setShowForm(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate(form);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Addresses</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Address"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">New Address</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="street" className="text-sm font-medium">
                  Street
                </label>
                <input
                  id="street"
                  type="text"
                  value={form.street}
                  onChange={(e) => setForm({ ...form, street: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="city" className="text-sm font-medium">
                    City
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="state" className="text-sm font-medium">
                    State
                  </label>
                  <input
                    id="state"
                    type="text"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="zip" className="text-sm font-medium">
                    ZIP
                  </label>
                  <input
                    id="zip"
                    type="text"
                    value={form.zip}
                    onChange={(e) => setForm({ ...form, zip: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? "Saving..." : "Save Address"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-8">Loading addresses...</div>
      ) : !addresses || addresses.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No addresses saved yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {addresses.map((addr: any) => (
            <Card key={addr.id}>
              <CardContent className="p-4">
                <p className="font-medium">{addr.street}</p>
                <p className="text-sm text-muted-foreground">
                  {addr.city}, {addr.state} {addr.zip}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
