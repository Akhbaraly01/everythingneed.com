/**
 * Needs Infrastructure - Concrete Repository Implementations
 *
 * Laravel mapping: app/Modules/Needs/Infrastructure/Repositories/*
 */

import type { DataClient } from "@core/contracts";
import { BaseRepository } from "@core/infrastructure";
import type { QueryParams, PaginatedResult } from "@core/domain";
import type {
  NeedCategory,
  NeedCategoryInsert,
  NeedCategoryUpdate,
  NeedItem,
  NeedItemInsert,
  NeedItemUpdate,
} from "@core/api/types";
import type { NeedCategoryRepository, NeedItemRepository } from "@core/repositories";

// ── Need Category Repository ─────────────────────────────────────

export class NeedCategoryRepositoryImpl
  extends BaseRepository<NeedCategory, NeedCategoryInsert, NeedCategoryUpdate>
  implements NeedCategoryRepository
{
  get TableName(): string {
    return "need_categories";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findBySlug(slug: string): Promise<NeedCategory | null> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("slug", "=", slug)
      .single();
    return (result as NeedCategory) || null;
  }

  async findWithItems(): Promise<NeedCategory[]> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .orderBy("name", true);
    return (result as NeedCategory[]) || [];
  }
}

// ── Need Item Repository ─────────────────────────────────────────

export class NeedItemRepositoryImpl
  extends BaseRepository<NeedItem, NeedItemInsert, NeedItemUpdate>
  implements NeedItemRepository
{
  get TableName(): string {
    return "need_items";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByCategoryId(categoryId: string, params?: QueryParams): Promise<PaginatedResult<NeedItem>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "category_id", operator: "=", value: categoryId },
      ],
    });
  }

  async findAvailable(params?: QueryParams): Promise<PaginatedResult<NeedItem>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "is_available", operator: "=", value: true },
      ],
    });
  }

  async findByVendorId(vendorId: string): Promise<NeedItem[]> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("vendor_id", "=", vendorId);
    return (result as NeedItem[]) || [];
  }
}
