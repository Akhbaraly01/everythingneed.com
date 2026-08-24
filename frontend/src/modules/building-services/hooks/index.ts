import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { buildingServicesApi } from "../api";
import type { RegisterServiceWorkerInput, CreateServiceBookingInput, RegisterDeliveryManagerInput } from "../validators";

export function useServiceWorker(id: string) {
  return useQuery({
    queryKey: ["building-services", "workers", id],
    queryFn: () => buildingServicesApi.getWorker(id),
    enabled: !!id,
  });
}

export function useAvailableWorkers() {
  return useQuery({
    queryKey: ["building-services", "workers", "available"],
    queryFn: () => buildingServicesApi.getAvailableWorkers(),
  });
}

export function useUserBookings(userId: string) {
  return useQuery({
    queryKey: ["building-services", "bookings", "user", userId],
    queryFn: () => buildingServicesApi.getUserBookings(userId),
    enabled: !!userId,
  });
}

export function useRegisterServiceWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RegisterServiceWorkerInput) => buildingServicesApi.registerWorker(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["building-services"] }),
  });
}

export function useCreateServiceBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateServiceBookingInput) => buildingServicesApi.createBooking(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["building-services"] }),
  });
}

export function useCancelServiceBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => buildingServicesApi.cancelBooking(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["building-services"] }),
  });
}

export function useRegisterDeliveryManager() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RegisterDeliveryManagerInput) => buildingServicesApi.registerDeliveryManager(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["building-services"] }),
  });
}

export function useAvailableDeliveryManagers() {
  return useQuery({
    queryKey: ["building-services", "delivery", "available"],
    queryFn: () => buildingServicesApi.getAvailableDeliveryManagers(),
  });
}
