import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoriesApi } from "../api";
import type { CreateCategoryInput, UpdateCategoryInput } from "../validators";

export function useCategory(id: string) {
  return useQuery({
    queryKey: ["categories", id],
    queryFn: () => categoriesApi.getById(id),
    enabled: !!id,
  });
}

export function useCategoryTree() {
  return useQuery({
    queryKey: ["categories", "tree"],
    queryFn: () => categoriesApi.getTree(),
  });
}

export function useRootCategories() {
  return useQuery({
    queryKey: ["categories", "roots"],
    queryFn: () => categoriesApi.getRoots(),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryInput) => categoriesApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryInput }) => categoriesApi.update(id, data),
    onSuccess: (_, { id }) => queryClient.invalidateQueries({ queryKey: ["categories", id] }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useReorderCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { newSortOrder: number } }) => categoriesApi.reorder(id, { categoryId: id, ...data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useToggleCategoryActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesApi.toggleActive(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}
