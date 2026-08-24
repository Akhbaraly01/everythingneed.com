import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hotelsApi } from "../api";
import type { CreateReservationInput, CancelReservationInput } from "../validators";

export function useHotel(id: string) {
  return useQuery({
    queryKey: ["hotels", id],
    queryFn: () => hotelsApi.getById(id),
    enabled: !!id,
  });
}

export function useHotelRooms(hotelId: string, checkIn?: string, checkOut?: string) {
  return useQuery({
    queryKey: ["hotels", hotelId, "rooms", checkIn, checkOut],
    queryFn: () => checkIn && checkOut ? hotelsApi.getAvailableRooms(hotelId, checkIn, checkOut) : hotelsApi.getRooms(hotelId),
    enabled: !!hotelId,
  });
}

export function useUserReservations(userId: string) {
  return useQuery({
    queryKey: ["hotels", "reservations", "user", userId],
    queryFn: () => hotelsApi.getUserReservations(userId),
    enabled: !!userId,
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReservationInput) => hotelsApi.createReservation(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hotels"] }),
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CancelReservationInput) => hotelsApi.cancelReservation(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hotels"] }),
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reservationId: string) => hotelsApi.checkIn(reservationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hotels"] }),
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reservationId: string) => hotelsApi.checkOut(reservationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hotels"] }),
  });
}
