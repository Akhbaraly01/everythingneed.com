import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deliveriesApi } from "../api";
import type { CreateShipmentInput, UpdateTrackingInput } from "../validators";

export function useShipment(id: string) {
  return useQuery({
    queryKey: ["deliveries", id],
    queryFn: () => deliveriesApi.getById(id),
    enabled: !!id,
  });
}

export function useShipmentsByOrder(orderId: string) {
  return useQuery({
    queryKey: ["deliveries", "order", orderId],
    queryFn: () => deliveriesApi.getByOrder(orderId),
    enabled: !!orderId,
  });
}

export function useShipmentTracking(shipmentId: string) {
  return useQuery({
    queryKey: ["deliveries", shipmentId, "tracking"],
    queryFn: () => deliveriesApi.getTrackingHistory(shipmentId),
    enabled: !!shipmentId,
  });
}

export function useCreateShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateShipmentInput) => deliveriesApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["deliveries"] }),
  });
}

export function useUpdateTracking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ shipmentId, data }: { shipmentId: string; data: UpdateTrackingInput }) =>
      deliveriesApi.updateTracking(shipmentId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["deliveries"] }),
  });
}

export function useMarkDelivered() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shipmentId: string) => deliveriesApi.markDelivered(shipmentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["deliveries"] }),
  });
}
