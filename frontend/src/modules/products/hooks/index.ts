import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "../api";
import type { CreateProductInput, UpdateProductInput } from "../validators";

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: () => productsApi.getById(id),
    enabled: !!id,
  });
}

export function useProductsByCategory(category: string) {
  return useQuery({
    queryKey: ["products", "category", category],
    queryFn: () => productsApi.getByCategory(category),
  });
}

export function useSearchProducts(query: string) {
  return useQuery({
    queryKey: ["products", "search", query],
    queryFn: () => productsApi.search(query),
    enabled: query.length >= 2,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductInput) => productsApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductInput }) => productsApi.update(id, data),
    onSuccess: (_, { id }) => queryClient.invalidateQueries({ queryKey: ["products", id] }),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useProductReviews(productId: string) {
  return useQuery({
    queryKey: ["products", productId, "reviews"],
    queryFn: () => productsApi.getReviews(productId),
    enabled: !!productId,
  });
}
