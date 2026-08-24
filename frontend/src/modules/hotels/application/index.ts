/**
 * Hotels Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/Hotels/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { Hotel, HotelRoom, HotelReservation } from "../domain";

// ── DTOs ─────────────────────────────────────────────────────────

export interface CreateReservationDTO {
  hotelId: string;
  roomId: string;
  userId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  specialRequests?: string;
}

export interface CancelReservationDTO {
  reservationId: string;
  reason?: string;
}

// ── Commands ─────────────────────────────────────────────────────

export interface CreateReservationCommand {
  type: "CreateReservation";
  payload: CreateReservationDTO;
}

export interface CancelReservationCommand {
  type: "CancelReservation";
  payload: CancelReservationDTO;
}

export interface ConfirmReservationCommand {
  type: "ConfirmReservation";
  payload: { reservationId: string };
}

export interface CheckInCommand {
  type: "CheckIn";
  payload: { reservationId: string };
}

export interface CheckOutCommand {
  type: "CheckOut";
  payload: { reservationId: string };
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetHotelQuery {
  type: "GetHotel";
  payload: { hotelId: string };
}

export interface GetRoomsQuery {
  type: "GetRooms";
  payload: {
    hotelId: string;
    params?: QueryParams;
  };
}

export interface GetAvailableRoomsQuery {
  type: "GetAvailableRooms";
  payload: {
    hotelId: string;
    checkIn: string;
    checkOut: string;
  };
}

export interface GetReservationsQuery {
  type: "GetReservations";
  payload: {
    userId: string;
    params?: QueryParams;
  };
}

export interface GetHotelReservationsQuery {
  type: "GetHotelReservations";
  payload: {
    hotelId: string;
    params?: QueryParams;
  };
}

// ── Application Services ─────────────────────────────────────────

export interface HotelApplicationService {
  createReservation(command: CreateReservationCommand): Promise<HotelReservation>;
  cancelReservation(command: CancelReservationCommand): Promise<void>;
  confirmReservation(command: ConfirmReservationCommand): Promise<void>;
  checkIn(command: CheckInCommand): Promise<void>;
  checkOut(command: CheckOutCommand): Promise<void>;

  getHotel(query: GetHotelQuery): Promise<Hotel | null>;
  getRooms(query: GetRoomsQuery): Promise<PaginatedResult<HotelRoom>>;
  getAvailableRooms(query: GetAvailableRoomsQuery): Promise<HotelRoom[]>;
  getReservations(query: GetReservationsQuery): Promise<PaginatedResult<HotelReservation>>;
  getHotelReservations(query: GetHotelReservationsQuery): Promise<PaginatedResult<HotelReservation>>;
}
