/**
 * Deliveries Infrastructure - Concrete Repository Implementations
 *
 * Laravel mapping: app/Modules/Deliveries/Infrastructure/Repositories/*
 */

import type { DataClient } from "@core/contracts";
import { BaseRepository } from "@core/infrastructure";
import type { QueryParams, PaginatedResult } from "@core/domain";
import type {
  DeliveryManager,
  DeliveryManagerInsert,
  DeliveryManagerUpdate,
} from "@core/api/types";
import type { DeliveryManagerRepository } from "@core/repositories";

// ── Delivery Manager Repository ──────────────────────────────────

export class DeliveryManagerRepositoryImpl
  extends BaseRepository<DeliveryManager, DeliveryManagerInsert, DeliveryManagerUpdate>
  implements DeliveryManagerRepository
{
  get TableName(): string {
    return "delivery_managers";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByUserId(userId: string): Promise<DeliveryManager | null> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("user_id", "=", userId)
      .single();
    return (result as DeliveryManager) || null;
  }

  async findAvailable(params?: QueryParams): Promise<PaginatedResult<DeliveryManager>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "is_available", operator: "=", value: true },
      ],
    });
  }

  async updateAvailability(id: string, isAvailable: boolean): Promise<DeliveryManager> {
    return this.update(id, { is_available: isAvailable });
  }
}
