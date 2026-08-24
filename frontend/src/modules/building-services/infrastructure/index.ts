/**
 * Building Services Infrastructure - Concrete Repository Implementations
 *
 * Laravel mapping: app/Modules/BuildingServices/Infrastructure/Repositories/*
 */

import type { DataClient } from "@core/contracts";
import { BaseRepository } from "@core/infrastructure";
import type { QueryParams, PaginatedResult } from "@core/domain";
import type {
  ServiceWorker,
  ServiceWorkerInsert,
  ServiceWorkerUpdate,
} from "@core/api/types";
import type { ServiceWorkerRepository } from "@core/repositories";

// ── Service Worker Repository ────────────────────────────────────

export class ServiceWorkerRepositoryImpl
  extends BaseRepository<ServiceWorker, ServiceWorkerInsert, ServiceWorkerUpdate>
  implements ServiceWorkerRepository
{
  get TableName(): string {
    return "service_workers";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByUserId(userId: string): Promise<ServiceWorker | null> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("user_id", "=", userId)
      .single();
    return (result as ServiceWorker) || null;
  }

  async findByWorkerType(workerType: string, params?: QueryParams): Promise<PaginatedResult<ServiceWorker>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "worker_type", operator: "=", value: workerType },
      ],
    });
  }

  async findAvailable(params?: QueryParams): Promise<PaginatedResult<ServiceWorker>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "is_available", operator: "=", value: true },
      ],
    });
  }

  async updateAvailability(id: string, isAvailable: boolean): Promise<ServiceWorker> {
    return this.update(id, { is_available: isAvailable });
  }
}
