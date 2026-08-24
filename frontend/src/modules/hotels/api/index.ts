import { http, qs } from "@core/api";
import type { CreateReservationInput, CancelReservationInput } from "../validators";

const API_BASE = "/api/hotels";

export const hotelsApi = {
  getById: (id: string) => http.get<any>(`${API_BASE}/${id}`),
  getRooms: (hotelId: string) => http.get<any[]>(`${API_BASE}/${hotelId}/rooms`),
  getAvailableRooms: (hotelId: string, checkIn: string, checkOut: string) =>
    http.get<any[]>(`${API_BASE}/${hotelId}/rooms/available${qs({ checkIn, checkOut })}`),
  getUserReservations: (userId: string) => http.get<any[]>(`${API_BASE}/reservations/user/${userId}`),
  getHotelReservations: (hotelId: string) => http.get<any[]>(`${API_BASE}/${hotelId}/reservations`),
  createReservation: (data: CreateReservationInput) => http.post<any>(`${API_BASE}/reservations`, data),
  cancelReservation: (data: CancelReservationInput) => http.post<void>(`${API_BASE}/reservations/cancel`, data),
  confirmReservation: (reservationId: string) => http.post<void>(`${API_BASE}/reservations/${reservationId}/confirm`),
  checkIn: (reservationId: string) => http.post<void>(`${API_BASE}/reservations/${reservationId}/check-in`),
  checkOut: (reservationId: string) => http.post<void>(`${API_BASE}/reservations/${reservationId}/check-out`),
};
