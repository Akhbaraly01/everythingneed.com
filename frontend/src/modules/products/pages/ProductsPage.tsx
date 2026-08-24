import { useQuery } from "@tanstack/react-query";
import { http, qs } from "@/core/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Star } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface Product { id: string; name: string; price: number; image?: string; rating?: number; category?: string; }

export default function ProductsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data: products, isLoading } = useQuery({
    queryKey: ["products", search],
    queryFn: async () => { const res = await http.get<any>(`/api/products${qs({ q: search })}`); return res.data || []; },
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Products</h1>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></div>
      {isLoading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" /></div> :
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products?.map((p: Product) => (
            <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/product/${p.id}`)}>
              <CardContent className="p-4">
                {p.image && <img src={p.image} alt={p.name} className="w-full h-48 object-cover rounded-md mb-3" />}
                <h3 className="font-medium line-clamp-2">{p.name}</h3>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-lg font-bold">${p.price?.toFixed(2)}</p>
                  {p.rating && <span className="flex items-center gap-1 text-sm"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{p.rating}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
          {products?.length === 0 && <p className="col-span-full text-center py-12 text-muted-foreground">No products found</p>}
        </div>}
    </div>
  );
}
