/**
 * Rides Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/Rides/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";
import type { Money, Address } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface RideId {
  value: string;
}

export interface DriverId {
  value: string;
}

export interface VehicleId {
  value: string;
}

export interface RideStatus {
  value: "requested" | "accepted" | "in_progress" | "completed" | "cancelled";
}

export interface RideType {
  value: "economy" | "comfort" | "premium" | "pool";
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface RideFare {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  totalFare: number;
  currency: string;
}

export interface DriverRating {
  rating: number;
  count: number;
}

// ── Entities ─────────────────────────────────────────────────────

export interface Ride {
  id: string;
  riderId: string;
  driverId?: string;
  vehicleId?: string;
  status: string;
  rideType: string;
  pickupLocation: Location;
  dropoffLocation: Location;
  pickupAddress?: string;
  dropoffAddress?: string;
  distanceKm?: number;
  estimatedDuration?: number;
  fare?: RideFare;
  actualFare?: number;
  rating?: number;
  tip?: number;
  cancelledBy?: string;
  cancelReason?: string;
  requestedAt: Date;
  acceptedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Driver {
  id: string;
  userId: string;
  licenseNumber?: string;
  vehicleId?: string;
  isAvailable: boolean;
  isApproved: boolean;
  currentLatitude?: number;
  currentLongitude?: number;
  rating?: number;
  totalRides: number;
  earnings: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vehicle {
  id: string;
  driverId: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  vehicleType: string;
  imageUrl?: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── Domain Events ────────────────────────────────────────────────

export interface RideRequestedEvent {
  type: "RideRequested";
  rideId: string;
  riderId: string;
  rideType: string;
  pickupLocation: Location;
  dropoffLocation: Location;
  timestamp: Date;
}

export interface RideAcceptedEvent {
  type: "RideAccepted";
  rideId: string;
  driverId: string;
  timestamp: Date;
}

export interface RideStartedEvent {
  type: "RideStarted";
  rideId: string;
  driverId: string;
  timestamp: Date;
}

export interface RideCompletedEvent {
  type: "RideCompleted";
  rideId: string;
  driverId: string;
  riderId: string;
  fare: number;
  rating?: number;
  timestamp: Date;
}

export interface RideCancelledEvent {
  type: "RideCancelled";
  rideId: string;
  cancelledBy: string;
  reason?: string;
  timestamp: Date;
}

export interface DriverLocationUpdatedEvent {
  type: "DriverLocationUpdated";
  driverId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface RideService {
  requestRide(data: {
    riderId: string;
    rideType: string;
    pickupLocation: Location;
    dropoffLocation: Location;
    pickupAddress?: string;
    dropoffLocationAddress?: string;
  }): Promise<Ride>;

  acceptRide(rideId: string, driverId: string): Promise<Ride>;
  startRide(rideId: string): Promise<Ride>;
  completeRide(rideId: string, data?: { fare?: number; rating?: number; tip?: number }): Promise<Ride>;
  cancelRide(rideId: string, cancelledBy: string, reason?: string): Promise<Ride>;

  getRideById(rideId: string): Promise<Ride | null>;
  getRiderRides(riderId: string, params?: any): Promise<{ items: Ride[]; total: number }>;
  getDriverRides(driverId: string, params?: any): Promise<{ items: Ride[]; total: number }>;

  getDriverById(driverId: string): Promise<Driver | null>;
  getAvailableDrivers(latitude?: number, longitude?: number): Promise<Driver[]>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class RideNotFoundError extends DomainError {
  constructor(rideId: string) {
    super(`Ride ${rideId} not found`, "RIDE_NOT_FOUND");
    this.name = "RideNotFoundError";
  }
}

export class DriverNotFoundError extends DomainError {
  constructor(driverId: string) {
    super(`Driver ${driverId} not found`, "DRIVER_NOT_FOUND");
    this.name = "DriverNotFoundError";
  }
}

export class DriverNotAvailableError extends DomainError {
  constructor(driverId: string) {
    super(`Driver ${driverId} is not available`, "DRIVER_NOT_AVAILABLE");
    this.name = "DriverNotAvailableError";
  }
}

export class RideAlreadyAcceptedError extends DomainError {
  constructor(rideId: string) {
    super(`Ride ${rideId} has already been accepted`, "RIDE_ALREADY_ACCEPTED");
    this.name = "RideAlreadyAcceptedError";
  }
}

export class RideNotActiveError extends DomainError {
  constructor(rideId: string) {
    super(`Ride ${rideId} is not in an active state`, "RIDE_NOT_ACTIVE");
    this.name = "RideNotActiveError";
  }
}
