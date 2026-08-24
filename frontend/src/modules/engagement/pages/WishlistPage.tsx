import { http } from "@/core/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

export default function WishlistPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: wishlist, isLoading } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => http.get<any>("/api/wishlist").then((res) => res.data),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string | number) =>
      http.delete(`/api/wishlist/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <h1 className="text-2xl font-bold">My Wishlist</h1>

      {isLoading ? (
        <div className="text-center py-8">Loading wishlist...</div>
      ) : !wishlist || wishlist.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Your wishlist is empty.
        </div>
      ) : (
        <div className="grid gap-4">
          {wishlist.map((item: any) => {
            const product = item.product || item;
            return (
              <Card key={item.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-medium">
                      {product.name || product.title || "Product"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      ${product.price?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeMutation.mutate(item.id)}
                    disabled={removeMutation.isPending}
                  >
                    Remove
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
