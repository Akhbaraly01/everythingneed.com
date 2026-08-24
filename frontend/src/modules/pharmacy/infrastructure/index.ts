/**
 * Pharmacy Infrastructure - Concrete Repository Implementations
 *
 * Laravel mapping: app/Modules/Pharmacy/Infrastructure/Repositories/*
 */

import type { DataClient } from "@core/contracts";
import { BaseRepository } from "@core/infrastructure";
import type { QueryParams, PaginatedResult } from "@core/domain";
import type {
  Medicine,
  MedicineInsert,
  MedicineUpdate,
} from "@core/api/types";
import type { MedicineRepository } from "@core/repositories";

// ── Medicine Repository ──────────────────────────────────────────

export class MedicineRepositoryImpl
  extends BaseRepository<Medicine, MedicineInsert, MedicineUpdate>
  implements MedicineRepository
{
  get TableName(): string {
    return "medicines";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByCategory(category: string, params?: QueryParams): Promise<PaginatedResult<Medicine>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "category", operator: "=", value: category },
      ],
    });
  }

  async search(query: string, params?: QueryParams): Promise<PaginatedResult<Medicine>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "name", operator: "ilike", value: `%${query}%` },
      ],
    });
  }

  async findRequiresPrescription(params?: QueryParams): Promise<PaginatedResult<Medicine>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "requires_prescription", operator: "=", value: true },
      ],
    });
  }

  async updateStock(id: string, quantity: number): Promise<Medicine> {
    return this.update(id, { stock_quantity: quantity });
  }
}
