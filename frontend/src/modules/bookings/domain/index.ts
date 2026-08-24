/**
 * Bookings Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/Bookings/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";
import type { DateRange, TimeSlot } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface BookingId {
  value: string;
}

export interface ServiceType {
  value: string;
}

export interface BookingStatus {
  value: "pending" | "confirmed" | "completed" | "cancelled";
}

// ── Entities ─────────────────────────────────────────────────────

export interface Booking {
  id: string;
  userId: string;
  serviceType: string;
  serviceId?: string;
  details: Record<string, unknown>;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Domain Events ────────────────────────────────────────────────

export interface BookingCreatedEvent {
  type: "BookingCreated";
  bookingId: string;
  userId: string;
  serviceType: string;
  timestamp: Date;
}

export interface BookingConfirmedEvent {
  type: "BookingConfirmed";
  bookingId: string;
  timestamp: Date;
}

export interface BookingCompletedEvent {
  type: "BookingCompleted";
  bookingId: string;
  timestamp: Date;
}

export interface BookingCancelledEvent {
  type: "BookingCancelled";
  bookingId: string;
  reason?: string;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface BookingService {
  create(data: {
    userId: string;
    serviceType: string;
    serviceId?: string;
    details: Record<string, unknown>;
  }): Promise<Booking>;

  confirm(bookingId: string): Promise<void>;
  complete(bookingId: string): Promise<void>;
  cancel(bookingId: string, reason?: string): Promise<void>;

  getById(bookingId: string): Promise<Booking | null>;
  getByUserId(userId: string, params?: any): Promise<{ items: Booking[]; total: number }>;
  getByServiceType(serviceType: string, params?: any): Promise<{ items: Booking[]; total: number }>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class BookingNotFoundError extends DomainError {
  constructor(bookingId: string) {
    super(`Booking ${bookingId} not found`, "BOOKING_NOT_FOUND");
    this.name = "BookingNotFoundError";
  }
}

export class InvalidBookingStatusError extends DomainError {
  constructor(currentStatus: string, attemptedAction: string) {
    super(`Cannot ${attemptedAction} booking with status ${currentStatus}`, "INVALID_BOOKING_STATUS");
    this.name = "InvalidBookingStatusError";
  }
}

export class BookingAlreadyCancelledError extends DomainError {
  constructor(bookingId: string) {
    super(`Booking ${bookingId} is already cancelled`, "BOOKING_ALREADY_CANCELLED");
    this.name = "BookingAlreadyCancelledError";
  }
}
