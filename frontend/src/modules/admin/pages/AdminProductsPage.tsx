import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { http } from "@core/api";
import { AdminLayout } from "../components/AdminLayout";
import { Card, CardContent } from "@shared/ui/card";
import { Input } from "@shared/ui/input";
import { Badge } from "@shared/ui/badge";
import { Skeleton } from "@shared/ui/skeleton";
import { Button } from "@shared/ui/button";
import { ChevronLeft, ChevronRight, PackageSearch } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "/api";

interface AdminProductRow {
  id: string;
  name: string;
  category: string;
  price: string;
  stock_quantity: number;
  is_active: boolean;
  vendor?: { id: string; store_name: string } | null;
}

export default function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const productsRes = useQuery({
    queryKey: ["admin-products", page, search],
    queryFn: () => http.get<{ data: AdminProductRow[]; meta: { last_page: number; total: number } }>(
      `${API}/products?page=${page}&per_page=15${search ? `&search=${encodeURIComponent(search)}` : ""}`
    ),
  });

  const products = productsRes.data?.data ?? [];
  const lastPage = productsRes.data?.meta?.last_page ?? 1;
  const total = productsRes.data?.meta?.total ?? 0;

  return (
    <AdminLayout title="Products">
      <div className="flex items-center justify-between gap-3 mb-4">
        <Input
          placeholder="Search products…"
          className="max-w-xs"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <span className="text-sm text-muted-foreground">{total} products</span>
      </div>

      <Card>
        <CardContent className="p-0">
          {productsRes.isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <PackageSearch className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">No products found</p>
              <p className="text-xs text-muted-foreground">Try a different search term.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-4 py-2.5 font-medium">Product</th>
                  <th className="px-4 py-2.5 font-medium">Vendor</th>
                  <th className="px-4 py-2.5 font-medium">Category</th>
                  <th className="px-4 py-2.5 font-medium">Price</th>
                  <th className="px-4 py-2.5 font-medium">Stock</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-medium">{p.name}</td>
                    <td className="px-4 py-2.5">{p.vendor?.store_name ?? "—"}</td>
                    <td className="px-4 py-2.5">{p.category}</td>
                    <td className="px-4 py-2.5">${Number(p.price).toFixed(2)}</td>
                    <td className="px-4 py-2.5">{p.stock_quantity}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={p.is_active ? "default" : "secondary"}>
                        {p.is_active ? "Active" : "Archived"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2 mt-4">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <span className="text-xs text-muted-foreground px-2">Page {page} of {lastPage}</span>
        <Button variant="outline" size="sm" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </AdminLayout>
  );
}
