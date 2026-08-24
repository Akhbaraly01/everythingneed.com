/**
 * Building Services Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/BuildingServices/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";
import type { Address, Money, DateRange, TimeSlot } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface WorkerType {
  value: string;
}

export interface ServiceCategory {
  value: string;
}

export interface BookingStatus {
  value: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
}

export interface ScheduledDateTime {
  date: string;
  time?: string;
}

// ── Entities ─────────────────────────────────────────────────────

export interface ServiceWorker {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  workerType: string;
  bio?: string;
  avatarUrl?: string;
  hourlyRate?: number;
  experienceYears?: number;
  completedJobs?: number;
  isAvailable: boolean;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BuildingServiceBooking {
  id: string;
  userId: string;
  workerType: string;
  serviceCategory: string;
  description: string;
  address: string;
  scheduledDate: string;
  scheduledTime?: string;
  estimatedCost?: number;
  notes?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryManager {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  vehicleType?: string;
  isAvailable: boolean;
  completedDeliveries: number;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ── Domain Events ────────────────────────────────────────────────

export interface ServiceWorkerRegisteredEvent {
  type: "ServiceWorkerRegistered";
  workerId: string;
  userId: string;
  workerType: string;
  timestamp: Date;
}

export interface ServiceBookingCreatedEvent {
  type: "ServiceBookingCreated";
  bookingId: string;
  userId: string;
  workerType: string;
  scheduledDate: string;
  timestamp: Date;
}

export interface ServiceBookingCompletedEvent {
  type: "ServiceBookingCompleted";
  bookingId: string;
  workerId: string;
  timestamp: Date;
}

export interface WorkerAvailabilityChangedEvent {
  type: "WorkerAvailabilityChanged";
  workerId: string;
  isAvailable: boolean;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface BuildingServicesService {
  registerWorker(data: {
    userId: string;
    fullName: string;
    phone: string;
    workerType: string;
    bio?: string;
    avatarUrl?: string;
    hourlyRate?: number;
    experienceYears?: number;
  }): Promise<ServiceWorker>;

  updateWorker(workerId: string, data: Partial<ServiceWorker>): Promise<ServiceWorker>;
  getWorkerById(workerId: string): Promise<ServiceWorker | null>;
  getWorkerByUserId(userId: string): Promise<ServiceWorker | null>;
  getWorkersByType(workerType: string, params?: any): Promise<{ items: ServiceWorker[]; total: number }>;
  getAvailableWorkers(params?: any): Promise<{ items: ServiceWorker[]; total: number }>;
  updateWorkerAvailability(workerId: string, isAvailable: boolean): Promise<void>;

  createBooking(data: {
    userId: string;
    workerType: string;
    serviceCategory: string;
    description: string;
    address: string;
    scheduledDate: string;
    scheduledTime?: string;
    estimatedCost?: number;
    notes?: string;
  }): Promise<BuildingServiceBooking>;

  updateBooking(bookingId: string, data: Partial<BuildingServiceBooking>): Promise<BuildingServiceBooking>;
  cancelBooking(bookingId: string): Promise<void>;
  getBookingById(bookingId: string): Promise<BuildingServiceBooking | null>;
  getBookingsByUserId(userId: string, params?: any): Promise<{ items: BuildingServiceBooking[]; total: number }>;
  getBookingsByWorkerType(workerType: string, params?: any): Promise<{ items: BuildingServiceBooking[]; total: number }>;

  registerDeliveryManager(data: {
    userId: string;
    fullName: string;
    phone: string;
    vehicleType?: string;
  }): Promise<DeliveryManager>;

  getDeliveryManagerById(managerId: string): Promise<DeliveryManager | null>;
  getAvailableDeliveryManagers(params?: any): Promise<{ items: DeliveryManager[]; total: number }>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class ServiceWorkerNotFoundError extends DomainError {
  constructor(workerId: string) {
    super(`Service worker ${workerId} not found`, "SERVICE_WORKER_NOT_FOUND");
    this.name = "ServiceWorkerNotFoundError";
  }
}

export class ServiceBookingNotFoundError extends DomainError {
  constructor(bookingId: string) {
    super(`Service booking ${bookingId} not found`, "SERVICE_BOOKING_NOT_FOUND");
    this.name = "ServiceBookingNotFoundError";
  }
}

export class WorkerNotAvailableError extends DomainError {
  constructor(workerId: string) {
    super(`Worker ${workerId} is not available`, "WORKER_NOT_AVAILABLE");
    this.name = "WorkerNotAvailableError";
  }
}

export class InvalidScheduledDateError extends DomainError {
  constructor(date: string) {
    super(`Invalid scheduled date: ${date}`, "INVALID_SCHEDULED_DATE");
    this.name = "InvalidScheduledDateError";
  }
}
