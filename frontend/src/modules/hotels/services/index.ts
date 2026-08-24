import { http } from "@/core/api/client";
import { qs } from "@core/api";
import { eventBus } from "@core/events/EventBus";
import type { HotelService } from "../domain";

export const hotelService: HotelService = {
  async createReservation(data) {
    const result: any = await http.post(`/api/hotels/${data.hotelId}/reserve`, data);
    const reservation = result.data;
    eventBus.emit("ReservationCreated", { reservationId: reservation?.id, hotelId: data.hotelId, roomId: data.roomId, userId: data.userId, checkInDate: data.checkInDate, checkOutDate: data.checkOutDate, totalAmount: reservation?.totalAmount, timestamp: new Date() });
    return reservation;
  },

  async cancelReservation(reservationId, reason) {
    await http.post(`/api/bookings/${reservationId}/cancel`, { reason });
    eventBus.emit("ReservationCancelled", { reservationId, hotelId: "", userId: "", reason, timestamp: new Date() });
  },

  async confirmReservation(reservationId) {
    await http.post(`/api/bookings/${reservationId}/confirm`);
    eventBus.emit("ReservationConfirmed", { reservationId, timestamp: new Date() });
  },

  async checkIn(reservationId) {
    await http.post(`/api/bookings/${reservationId}/check-in`);
    eventBus.emit("GuestCheckedIn", { reservationId, hotelId: "", userId: "", timestamp: new Date() });
  },

  async checkOut(reservationId) {
    await http.post(`/api/bookings/${reservationId}/check-out`);
    eventBus.emit("GuestCheckedOut", { reservationId, hotelId: "", userId: "", timestamp: new Date() });
  },

  async getHotelById(hotelId) {
    const data: any = await http.get(`/api/hotels/${hotelId}`);
    return data.data || null;
  },

  async getHotelRooms(hotelId, params) {
    const data: any = await http.get(`/api/hotels/${hotelId}/rooms${qs(params)}`);
    return { items: data.data || [], total: data.meta?.total || 0 };
  },

  async getReservationsByUser(userId, params) {
    const data: any = await http.get("/api/bookings", { params: { user_id: userId, ...params } } as any);
    return { items: data.data || [], total: data.meta?.total || 0 };
  },

  async getReservationsByHotel(hotelId, params) {
    const data: any = await http.get("/api/bookings", { params: { hotel_id: hotelId, ...params } } as any);
    return { items: data.data || [], total: data.meta?.total || 0 };
  },

  async getAvailableRooms(hotelId, checkIn, checkOut) {
    const data: any = await http.get(`/api/hotels/${hotelId}/rooms`, { params: { check_in: checkIn, check_out: checkOut } } as any);
    return data.data || [];
  },
};
