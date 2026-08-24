import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingsApi } from "../api";
import type { CreateBookingInput, CancelBookingInput } from "../validators";

export function useBooking(id: string) {
  return useQuery({
    queryKey: ["bookings", id],
    queryFn: () => bookingsApi.getById(id),
    enabled: !!id,
  });
}

export function useUserBookings(userId: string) {
  return useQuery({
    queryKey: ["bookings", "user", userId],
    queryFn: () => bookingsApi.getByUser(userId),
    enabled: !!userId,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBookingInput) => bookingsApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookings"] }),
  });
}

export function useConfirmBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookingsApi.confirm(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookings"] }),
  });
}

export function useCompleteBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookingsApi.complete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookings"] }),
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CancelBookingInput) => bookingsApi.cancel(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookings"] }),
  });
}
