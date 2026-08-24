import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ridesApi } from "../api";
import type { RequestRideInput, AcceptRideInput, CompleteRideInput, CancelRideInput } from "../validators";

export function useRide(id: string) {
  return useQuery({
    queryKey: ["rides", id],
    queryFn: () => ridesApi.getById(id),
    enabled: !!id,
  });
}

export function useRiderRides(riderId: string) {
  return useQuery({
    queryKey: ["rides", "rider", riderId],
    queryFn: () => ridesApi.getRiderRides(riderId),
    enabled: !!riderId,
  });
}

export function useRequestRide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RequestRideInput) => ridesApi.requestRide(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rides"] }),
  });
}

export function useAcceptRide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AcceptRideInput) => ridesApi.acceptRide(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rides"] }),
  });
}

export function useCompleteRide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CompleteRideInput) => ridesApi.completeRide(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rides"] }),
  });
}

export function useCancelRide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CancelRideInput) => ridesApi.cancelRide(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rides"] }),
  });
}
