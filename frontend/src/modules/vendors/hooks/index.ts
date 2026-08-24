import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vendorsApi } from "../api";
import type { RegisterVendorInput, UpdateVendorProfileInput } from "../validators";

export function useVendor(id: string) {
  return useQuery({
    queryKey: ["vendors", id],
    queryFn: () => vendorsApi.getById(id),
    enabled: !!id,
  });
}

export function useVendorByUser(userId: string) {
  return useQuery({
    queryKey: ["vendors", "user", userId],
    queryFn: () => vendorsApi.getByUserId(userId),
    enabled: !!userId,
  });
}

export function useVendorsByCategory(category: string) {
  return useQuery({
    queryKey: ["vendors", "category", category],
    queryFn: () => vendorsApi.getByCategory(category),
  });
}

export function useRegisterVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RegisterVendorInput) => vendorsApi.register(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vendors"] }),
  });
}

export function useUpdateVendorProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVendorProfileInput }) => vendorsApi.updateProfile(id, data),
    onSuccess: (_, { id }) => queryClient.invalidateQueries({ queryKey: ["vendors", id] }),
  });
}

export function useVerifyVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vendorsApi.verify(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vendors"] }),
  });
}

export function useSuspendVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => vendorsApi.suspend(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vendors"] }),
  });
}

export function useSearchVendors(query: string) {
  return useQuery({
    queryKey: ["vendors", "search", query],
    queryFn: () => vendorsApi.search(query),
    enabled: query.length >= 2,
  });
}
