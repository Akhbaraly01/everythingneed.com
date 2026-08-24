import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { http } from "@/core/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Tag, Package } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  product_count: number;
  products: Product[];
}

export function CategoryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: category, isLoading } = useQuery<Category>({
    queryKey: ["category", id],
    queryFn: async () => {
      const res = await http.get<{ data: Category }>(`/api/categories/${id}`);
      return res.data;
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

  if (!category) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Category not found</p>
        <Button variant="link" onClick={() => navigate("/categories")}>Back to categories</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/categories")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-violet-100 flex items-center justify-center">
            <Tag className="h-6 w-6 text-violet-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{category.name}</h1>
            <p className="text-sm text-muted-foreground">{category.product_count} products</p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">{category.description}</p>
        </CardContent>
      </Card>

      {category.products && category.products.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {category.products.map((product) => (
            <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/product/${product.id}`)}>
              <CardContent className="p-4">
                {product.image && (
                  <img src={product.image} alt={product.name} className="w-full h-40 object-cover rounded-md mb-3" />
                )}
                <p className="font-medium">{product.name}</p>
                <p className="text-lg font-bold">${product.price?.toFixed(2)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default CategoryDetail;
