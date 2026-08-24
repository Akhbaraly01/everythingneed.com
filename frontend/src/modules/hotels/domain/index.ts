/**
 * Hotels Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/Hotels/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";
import type { Money, Address, DateRange } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface HotelId {
  value: string;
}

export interface HotelRoomId {
  value: string;
}

export interface ReservationId {
  value: string;
}

export interface RoomType {
  value: "single" | "double" | "suite" | "family" | "presidential";
}

export interface ReservationStatus {
  value: "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled";
}

export interface Amenity {
  name: string;
  icon?: string;
}

export interface RoomRate {
  nightlyRate: number;
  currency: string;
  includesBreakfast: boolean;
}

// ── Entities ─────────────────────────────────────────────────────

export interface Hotel {
  id: string;
  ownerId?: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  starRating?: number;
  imageUrl?: string;
  amenities?: string[];
  checkInTime?: string;
  checkOutTime?: string;
  isActive: boolean;
  rating?: number;
  reviewsCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface HotelRoom {
  id: string;
  hotelId: string;
  roomType: string;
  name: string;
  description?: string;
  nightlyRate: number;
  maxGuests: number;
  bedCount: number;
  bedType?: string;
  imageUrl?: string;
  amenities?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface HotelReservation {
  id: string;
  hotelId: string;
  roomId: string;
  userId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  guests: number;
  totalAmount: number;
  currency: string;
  status: string;
  specialRequests?: string;
  confirmedAt?: Date;
  checkedInAt?: Date;
  checkedOutAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Domain Events ────────────────────────────────────────────────

export interface ReservationCreatedEvent {
  type: "ReservationCreated";
  reservationId: string;
  hotelId: string;
  roomId: string;
  userId: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  timestamp: Date;
}

export interface ReservationConfirmedEvent {
  type: "ReservationConfirmed";
  reservationId: string;
  timestamp: Date;
}

export interface ReservationCancelledEvent {
  type: "ReservationCancelled";
  reservationId: string;
  hotelId: string;
  userId: string;
  reason?: string;
  timestamp: Date;
}

export interface GuestCheckedInEvent {
  type: "GuestCheckedIn";
  reservationId: string;
  hotelId: string;
  userId: string;
  timestamp: Date;
}

export interface GuestCheckedOutEvent {
  type: "GuestCheckedOut";
  reservationId: string;
  hotelId: string;
  userId: string;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface HotelService {
  createReservation(data: {
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
  }): Promise<HotelReservation>;

  cancelReservation(reservationId: string, reason?: string): Promise<void>;
  confirmReservation(reservationId: string): Promise<void>;
  checkIn(reservationId: string): Promise<void>;
  checkOut(reservationId: string): Promise<void>;

  getHotelById(hotelId: string): Promise<Hotel | null>;
  getHotelRooms(hotelId: string, params?: any): Promise<{ items: HotelRoom[]; total: number }>;
  getReservationsByUser(userId: string, params?: any): Promise<{ items: HotelReservation[]; total: number }>;
  getReservationsByHotel(hotelId: string, params?: any): Promise<{ items: HotelReservation[]; total: number }>;
  getAvailableRooms(hotelId: string, checkIn: string, checkOut: string): Promise<HotelRoom[]>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class HotelNotFoundError extends DomainError {
  constructor(hotelId: string) {
    super(`Hotel ${hotelId} not found`, "HOTEL_NOT_FOUND");
    this.name = "HotelNotFoundError";
  }
}

export class RoomNotAvailableError extends DomainError {
  constructor(roomId: string, checkIn: string, checkOut: string) {
    super(`Room ${roomId} is not available from ${checkIn} to ${checkOut}`, "ROOM_NOT_AVAILABLE");
    this.name = "RoomNotAvailableError";
  }
}

export class ReservationNotFoundError extends DomainError {
  constructor(reservationId: string) {
    super(`Reservation ${reservationId} not found`, "RESERVATION_NOT_FOUND");
    this.name = "ReservationNotFoundError";
  }
}

export class ReservationCancellationError extends DomainError {
  constructor(reservationId: string) {
    super(`Reservation ${reservationId} cannot be cancelled`, "RESERVATION_CANCELLATION_ERROR");
    this.name = "ReservationCancellationError";
  }
}
