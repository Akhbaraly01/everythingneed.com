/**
 * Building Services Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/BuildingServices/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { ServiceWorker, BuildingServiceBooking, DeliveryManager } from "../domain";

// ── DTOs ─────────────────────────────────────────────────────────

export interface RegisterServiceWorkerDTO {
  userId: string;
  fullName: string;
  phone: string;
  workerType: string;
  bio?: string;
  avatarUrl?: string;
  hourlyRate?: number;
  experienceYears?: number;
}

export interface CreateServiceBookingDTO {
  userId: string;
  workerType: string;
  serviceCategory: string;
  description: string;
  address: string;
  scheduledDate: string;
  scheduledTime?: string;
  estimatedCost?: number;
  notes?: string;
}

export interface RegisterDeliveryManagerDTO {
  userId: string;
  fullName: string;
  phone: string;
  vehicleType?: string;
}

// ── Commands ─────────────────────────────────────────────────────

export interface RegisterServiceWorkerCommand {
  type: "RegisterServiceWorker";
  payload: RegisterServiceWorkerDTO;
}

export interface UpdateServiceWorkerCommand {
  type: "UpdateServiceWorker";
  payload: {
    workerId: string;
    data: Partial<ServiceWorker>;
  };
}

export interface UpdateWorkerAvailabilityCommand {
  type: "UpdateWorkerAvailability";
  payload: {
    workerId: string;
    isAvailable: boolean;
  };
}

export interface CreateServiceBookingCommand {
  type: "CreateServiceBooking";
  payload: CreateServiceBookingDTO;
}

export interface UpdateServiceBookingCommand {
  type: "UpdateServiceBooking";
  payload: {
    bookingId: string;
    data: Partial<BuildingServiceBooking>;
  };
}

export interface CancelServiceBookingCommand {
  type: "CancelServiceBooking";
  payload: { bookingId: string };
}

export interface RegisterDeliveryManagerCommand {
  type: "RegisterDeliveryManager";
  payload: RegisterDeliveryManagerDTO;
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetServiceWorkerQuery {
  type: "GetServiceWorker";
  payload: { workerId: string };
}

export interface GetServiceWorkerByUserQuery {
  type: "GetServiceWorkerByUser";
  payload: { userId: string };
}

export interface GetServiceWorkersByTypeQuery {
  type: "GetServiceWorkersByType";
  payload: {
    workerType: string;
    params?: QueryParams;
  };
}

export interface GetAvailableServiceWorkersQuery {
  type: "GetAvailableServiceWorkers";
  payload: {
    params?: QueryParams;
  };
}

export interface GetServiceBookingQuery {
  type: "GetServiceBooking";
  payload: { bookingId: string };
}

export interface GetUserServiceBookingsQuery {
  type: "GetUserServiceBookings";
  payload: {
    userId: string;
    params?: QueryParams;
  };
}

export interface GetServiceBookingsByWorkerTypeQuery {
  type: "GetServiceBookingsByWorkerType";
  payload: {
    workerType: string;
    params?: QueryParams;
  };
}

export interface GetDeliveryManagerQuery {
  type: "GetDeliveryManager";
  payload: { managerId: string };
}

export interface GetAvailableDeliveryManagersQuery {
  type: "GetAvailableDeliveryManagers";
  payload: {
    params?: QueryParams;
  };
}

// ── Application Services ─────────────────────────────────────────

export interface BuildingServicesApplicationService {
  registerWorker(command: RegisterServiceWorkerCommand): Promise<ServiceWorker>;
  updateWorker(command: UpdateServiceWorkerCommand): Promise<ServiceWorker>;
  updateWorkerAvailability(command: UpdateWorkerAvailabilityCommand): Promise<void>;
  createBooking(command: CreateServiceBookingCommand): Promise<BuildingServiceBooking>;
  updateBooking(command: UpdateServiceBookingCommand): Promise<BuildingServiceBooking>;
  cancelBooking(command: CancelServiceBookingCommand): Promise<void>;
  registerDeliveryManager(command: RegisterDeliveryManagerCommand): Promise<DeliveryManager>;

  getWorker(query: GetServiceWorkerQuery): Promise<ServiceWorker | null>;
  getWorkerByUser(query: GetServiceWorkerByUserQuery): Promise<ServiceWorker | null>;
  getWorkersByType(query: GetServiceWorkersByTypeQuery): Promise<PaginatedResult<ServiceWorker>>;
  getAvailableWorkers(query: GetAvailableServiceWorkersQuery): Promise<PaginatedResult<ServiceWorker>>;
  getBooking(query: GetServiceBookingQuery): Promise<BuildingServiceBooking | null>;
  getUserBookings(query: GetUserServiceBookingsQuery): Promise<PaginatedResult<BuildingServiceBooking>>;
  getBookingsByWorkerType(query: GetServiceBookingsByWorkerTypeQuery): Promise<PaginatedResult<BuildingServiceBooking>>;
  getDeliveryManager(query: GetDeliveryManagerQuery): Promise<DeliveryManager | null>;
  getAvailableDeliveryManagers(query: GetAvailableDeliveryManagersQuery): Promise<PaginatedResult<DeliveryManager>>;
}
