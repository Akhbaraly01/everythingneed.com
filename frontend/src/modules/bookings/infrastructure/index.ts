/**
 * Bookings Infrastructure - Concrete Repository Implementations
 *
 * Laravel mapping: app/Modules/Bookings/Infrastructure/Repositories/*
 */

import type { DataClient } from "@core/contracts";
import { BaseRepository } from "@core/infrastructure";
import type { QueryParams, PaginatedResult } from "@core/domain";
import type {
  Booking,
  BookingInsert,
  BookingUpdate,
  BuildingServiceBooking,
  BuildingServiceBookingInsert,
  BuildingServiceBookingUpdate,
} from "@core/api/types";
import type {
  BookingRepository,
  BuildingServiceBookingRepository,
} from "@core/repositories";

// ── Booking Repository ───────────────────────────────────────────

export class BookingRepositoryImpl
  extends BaseRepository<Booking, BookingInsert, BookingUpdate>
  implements BookingRepository
{
  get TableName(): string {
    return "bookings";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByUserId(userId: string, params?: QueryParams): Promise<PaginatedResult<Booking>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "user_id", operator: "=", value: userId },
      ],
    });
  }

  async findByServiceType(serviceType: string, params?: QueryParams): Promise<PaginatedResult<Booking>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "service_type", operator: "=", value: serviceType },
      ],
    });
  }

  async updateStatus(id: string, status: string): Promise<Booking> {
    return this.update(id, { status });
  }
}

// ── Building Service Booking Repository ──────────────────────────

export class BuildingServiceBookingRepositoryImpl
  extends BaseRepository<BuildingServiceBooking, BuildingServiceBookingInsert, BuildingServiceBookingUpdate>
  implements BuildingServiceBookingRepository
{
  get TableName(): string {
    return "building_service_bookings";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByUserId(userId: string, params?: QueryParams): Promise<PaginatedResult<BuildingServiceBooking>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "user_id", operator: "=", value: userId },
      ],
    });
  }

  async findByWorkerType(workerType: string, params?: QueryParams): Promise<PaginatedResult<BuildingServiceBooking>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "worker_type", operator: "=", value: workerType },
      ],
    });
  }

  async updateStatus(id: string, status: string): Promise<BuildingServiceBooking> {
    return this.update(id, { status });
  }
}
