import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { http } from "@/core/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Store, Star, MapPin } from "lucide-react";

interface StoreDetailData {
  id: string;
  name: string;
  description: string;
  logo?: string;
  rating: number;
  total_products: number;
  location: string;
  verified: boolean;
  created_at: string;
}

export function StoreDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: store, isLoading } = useQuery<StoreDetailData>({
    queryKey: ["store", id],
    queryFn: async () => {
      const { data } = await http.get<any>(`/api/vendors/${id}`);
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

  if (!store) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Store not found</p>
        <Button variant="link" onClick={() => navigate("/stores")}>Back to stores</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/stores")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div className="flex items-center gap-3">
          {store.logo ? (
            <img src={store.logo} alt={store.name} className="h-12 w-12 rounded-lg object-cover" />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-violet-100 flex items-center justify-center">
              <Store className="h-6 w-6 text-violet-500" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {store.name}
              {store.verified && <Badge variant="default">Verified</Badge>}
            </h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {store.rating?.toFixed(1)}</span>
              <span>{store.total_products} products</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {store.location}</span>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{store.description}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default StoreDetail;
