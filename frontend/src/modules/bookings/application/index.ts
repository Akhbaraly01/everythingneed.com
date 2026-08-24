/**
 * Bookings Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/Bookings/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { Booking } from "../domain";

// ── DTOs ─────────────────────────────────────────────────────────

export interface CreateBookingDTO {
  userId: string;
  serviceType: string;
  serviceId?: string;
  details: Record<string, unknown>;
}

// ── Commands ─────────────────────────────────────────────────────

export interface CreateBookingCommand {
  type: "CreateBooking";
  payload: CreateBookingDTO;
}

export interface ConfirmBookingCommand {
  type: "ConfirmBooking";
  payload: { bookingId: string };
}

export interface CompleteBookingCommand {
  type: "CompleteBooking";
  payload: { bookingId: string };
}

export interface CancelBookingCommand {
  type: "CancelBooking";
  payload: {
    bookingId: string;
    reason?: string;
  };
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetBookingQuery {
  type: "GetBooking";
  payload: { bookingId: string };
}

export interface GetUserBookingsQuery {
  type: "GetUserBookings";
  payload: {
    userId: string;
    params?: QueryParams;
  };
}

export interface GetBookingsByServiceTypeQuery {
  type: "GetBookingsByServiceType";
  payload: {
    serviceType: string;
    params?: QueryParams;
  };
}

// ── Application Services ─────────────────────────────────────────

export interface BookingApplicationService {
  createBooking(command: CreateBookingCommand): Promise<Booking>;
  confirmBooking(command: ConfirmBookingCommand): Promise<void>;
  completeBooking(command: CompleteBookingCommand): Promise<void>;
  cancelBooking(command: CancelBookingCommand): Promise<void>;

  getBooking(query: GetBookingQuery): Promise<Booking | null>;
  getUserBookings(query: GetUserBookingsQuery): Promise<PaginatedResult<Booking>>;
  getBookingsByServiceType(query: GetBookingsByServiceTypeQuery): Promise<PaginatedResult<Booking>>;
}
