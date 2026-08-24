import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pharmacyApi } from "../api";
import type { CreateMedicineInput, CreateMedicineOrderInput } from "../validators";

export function useMedicine(id: string) {
  return useQuery({
    queryKey: ["pharmacy", "medicines", id],
    queryFn: () => pharmacyApi.getMedicine(id),
    enabled: !!id,
  });
}

export function useMedicinesByCategory(category: string) {
  return useQuery({
    queryKey: ["pharmacy", "medicines", "category", category],
    queryFn: () => pharmacyApi.getByCategory(category),
    enabled: !!category,
  });
}

export function useSearchMedicines(query: string) {
  return useQuery({
    queryKey: ["pharmacy", "medicines", "search", query],
    queryFn: () => pharmacyApi.search(query),
    enabled: query.length >= 2,
  });
}

export function useCreateMedicine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMedicineInput) => pharmacyApi.createMedicine(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pharmacy"] }),
  });
}

export function useUpdateMedicineStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quantityChange }: { id: string; quantityChange: number }) =>
      pharmacyApi.updateStock(id, quantityChange),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pharmacy"] }),
  });
}

export function useCreateMedicineOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMedicineOrderInput) => pharmacyApi.createOrder(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pharmacy"] }),
  });
}

export function usePharmacyOrder(orderId: string) {
  return useQuery({
    queryKey: ["pharmacy", "orders", orderId],
    queryFn: () => pharmacyApi.getOrder(orderId),
    enabled: !!orderId,
  });
}
