/**
 * Rides Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/Rides/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { Ride, Driver, Vehicle, Location, RideFare } from "../domain";

// ── DTOs ─────────────────────────────────────────────────────────

export interface RequestRideDTO {
  riderId: string;
  rideType: string;
  pickupLocation: Location;
  dropoffLocation: Location;
  pickupAddress?: string;
  dropoffAddress?: string;
}

export interface AcceptRideDTO {
  rideId: string;
  driverId: string;
}

export interface CompleteRideDTO {
  rideId: string;
  fare?: number;
  rating?: number;
  tip?: number;
}

export interface CancelRideDTO {
  rideId: string;
  cancelledBy: string;
  reason?: string;
}

// ── Commands ─────────────────────────────────────────────────────

export interface RequestRideCommand {
  type: "RequestRide";
  payload: RequestRideDTO;
}

export interface AcceptRideCommand {
  type: "AcceptRide";
  payload: AcceptRideDTO;
}

export interface StartRideCommand {
  type: "StartRide";
  payload: { rideId: string };
}

export interface CompleteRideCommand {
  type: "CompleteRide";
  payload: CompleteRideDTO;
}

export interface CancelRideCommand {
  type: "CancelRide";
  payload: CancelRideDTO;
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetRideQuery {
  type: "GetRide";
  payload: { rideId: string };
}

export interface GetRiderRidesQuery {
  type: "GetRiderRides";
  payload: {
    riderId: string;
    params?: QueryParams;
  };
}

export interface GetDriverRidesQuery {
  type: "GetDriverRides";
  payload: {
    driverId: string;
    params?: QueryParams;
  };
}

export interface GetAvailableDriversQuery {
  type: "GetAvailableDrivers";
  payload: {
    latitude?: number;
    longitude?: number;
  };
}

export interface GetDriverQuery {
  type: "GetDriver";
  payload: { driverId: string };
}

// ── Application Services ─────────────────────────────────────────

export interface RideApplicationService {
  requestRide(command: RequestRideCommand): Promise<Ride>;
  acceptRide(command: AcceptRideCommand): Promise<Ride>;
  startRide(command: StartRideCommand): Promise<Ride>;
  completeRide(command: CompleteRideCommand): Promise<Ride>;
  cancelRide(command: CancelRideCommand): Promise<Ride>;

  getRide(query: GetRideQuery): Promise<Ride | null>;
  getRiderRides(query: GetRiderRidesQuery): Promise<PaginatedResult<Ride>>;
  getDriverRides(query: GetDriverRidesQuery): Promise<PaginatedResult<Ride>>;
  getAvailableDrivers(query: GetAvailableDriversQuery): Promise<Driver[]>;
  getDriver(query: GetDriverQuery): Promise<Driver | null>;
}
