import { useQuery } from "@tanstack/react-query";
import { http, qs } from "@/core/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Home } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface Property { id: string; title: string; price: number; location: string; property_type: string; bedrooms: number; image?: string; }

export default function PropertiesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const { data: properties, isLoading } = useQuery({
    queryKey: ["properties", search, type],
    queryFn: async () => { const res = await http.get<any>(`/api/properties${qs({ q: search, type })}`); return res.data || []; },
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Properties</h1>
        <button className="bg-violet-600 text-white px-4 py-2 rounded-md" onClick={() => navigate("/properties/create")}>List Property</button>
      </div>
      <div className="flex gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by location..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></div>
        <select className="border rounded-md px-3 py-2" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All Types</option><option value="rent">For Rent</option><option value="buy">For Sale</option>
        </select>
      </div>
      {isLoading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" /></div> :
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties?.map((p: Property) => (
            <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/properties/${p.id}`)}>
              <CardContent className="p-4">
                {p.image && <img src={p.image} alt={p.title} className="w-full h-48 object-cover rounded-md mb-3" />}
                <h3 className="font-semibold">{p.title}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{p.location}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-lg font-bold">${p.price?.toLocaleString()}</p>
                  <span className="text-sm text-muted-foreground flex items-center gap-1"><Home className="h-3 w-3" />{p.bedrooms} bed</span>
                </div>
              </CardContent>
            </Card>
          ))}
          {properties?.length === 0 && <p className="col-span-full text-center py-12 text-muted-foreground">No properties found</p>}
        </div>}
    </div>
  );
}
