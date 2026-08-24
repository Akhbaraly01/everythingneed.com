/**
 * Vendors Infrastructure - Concrete Repository Implementations
 *
 * Laravel mapping: app/Modules/Vendors/Infrastructure/Repositories/*
 */

import type { DataClient } from "@core/contracts";
import { BaseRepository } from "@core/infrastructure";
import type { QueryParams, PaginatedResult } from "@core/domain";
import type {
  Vendor,
  VendorInsert,
  VendorUpdate,
} from "@core/api/types";
import type { VendorRepository } from "@core/repositories";

// ── Vendor Repository ────────────────────────────────────────────

export class VendorRepositoryImpl
  extends BaseRepository<Vendor, VendorInsert, VendorUpdate>
  implements VendorRepository
{
  get TableName(): string {
    return "vendors";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByUserId(userId: string): Promise<Vendor | null> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("user_id", "=", userId)
      .single();
    return (result as Vendor) || null;
  }

  async findByCategory(category: string, params?: QueryParams): Promise<PaginatedResult<Vendor>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "category", operator: "=", value: category },
      ],
    });
  }

  async findVerified(params?: QueryParams): Promise<PaginatedResult<Vendor>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "is_verified", operator: "=", value: true },
      ],
    });
  }

  async search(query: string): Promise<Vendor[]> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("business_name", "ilike", `%${query}%`);
    return (result as Vendor[]) || [];
  }
}
