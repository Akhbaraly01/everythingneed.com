import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "../api";
import type { CreateMedicineOrderInput, CreateVendorOrderInput, AddTrackingInput } from "../validators";

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => ordersApi.getOrderById(id),
    enabled: !!id,
  });
}

export function useUserOrders(userId: string) {
  return useQuery({
    queryKey: ["orders", "user", userId],
    queryFn: () => ordersApi.getOrdersByUserId(userId),
    enabled: !!userId,
  });
}

export function useVendorOrders(vendorId: string) {
  return useQuery({
    queryKey: ["orders", "vendor", vendorId],
    queryFn: () => ordersApi.getVendorOrdersByVendorId(vendorId),
    enabled: !!vendorId,
  });
}

export function useCreateMedicineOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMedicineOrderInput) => ordersApi.createMedicineOrder(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useCreateVendorOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVendorOrderInput) => ordersApi.createVendorOrder(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) => ordersApi.cancelOrder(orderId, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useOrderTracking(orderId: string) {
  return useQuery({
    queryKey: ["orders", orderId, "tracking"],
    queryFn: () => ordersApi.getTrackingHistory(orderId),
    enabled: !!orderId,
  });
}
