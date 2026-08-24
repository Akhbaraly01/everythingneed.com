import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { needsApi } from "../api";
import type { CreateNeedCategoryInput, CreateNeedItemInput } from "../validators";

export function useNeedCategories() {
  return useQuery({
    queryKey: ["needs", "categories"],
    queryFn: () => needsApi.getAllCategories(),
  });
}

export function useCategoriesWithItems() {
  return useQuery({
    queryKey: ["needs", "categories", "with-items"],
    queryFn: () => needsApi.getCategoriesWithItems(),
  });
}

export function useNeedItemsByCategory(categoryId: string) {
  return useQuery({
    queryKey: ["needs", "items", "category", categoryId],
    queryFn: () => needsApi.getItemsByCategory(categoryId),
    enabled: !!categoryId,
  });
}

export function useCreateNeedCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateNeedCategoryInput) => needsApi.createCategory(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["needs"] }),
  });
}

export function useCreateNeedItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateNeedItemInput) => needsApi.createItem(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["needs"] }),
  });
}

export function useDeleteNeedCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => needsApi.deleteCategory(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["needs"] }),
  });
}

export function useDeleteNeedItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => needsApi.deleteItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["needs"] }),
  });
}
