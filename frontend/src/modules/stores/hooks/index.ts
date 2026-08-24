import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { storesApi } from "../api";
import type { CreateStoreInput, UpdateStoreInput } from "../validators";

export function useStore(id: string) {
  return useQuery({
    queryKey: ["stores", id],
    queryFn: () => storesApi.getById(id),
    enabled: !!id,
  });
}

export function useStoreBySlug(slug: string) {
  return useQuery({
    queryKey: ["stores", "slug", slug],
    queryFn: () => storesApi.getBySlug(slug),
    enabled: !!slug,
  });
}

export function useStoresByVendor(vendorId: string) {
  return useQuery({
    queryKey: ["stores", "vendor", vendorId],
    queryFn: () => storesApi.getByVendor(vendorId),
    enabled: !!vendorId,
  });
}

export function useCreateStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStoreInput) => storesApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stores"] }),
  });
}

export function useUpdateStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStoreInput }) => storesApi.update(id, data),
    onSuccess: (_, { id }) => queryClient.invalidateQueries({ queryKey: ["stores", id] }),
  });
}

export function useCloseStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => storesApi.close(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stores"] }),
  });
}

export function useReopenStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => storesApi.reopen(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stores"] }),
  });
}

export function useStoreCategories() {
  return useQuery({
    queryKey: ["stores", "categories"],
    queryFn: () => storesApi.listCategories(),
  });
}
