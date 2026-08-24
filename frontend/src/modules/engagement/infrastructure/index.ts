/**
 * Engagement Infrastructure - Concrete Repository Implementations
 *
 * Laravel mapping: app/Modules/Engagement/Infrastructure/Repositories/*
 */

import type { DataClient } from "@core/contracts";
import { BaseRepository } from "@core/infrastructure";
import type { QueryParams, PaginatedResult } from "@core/domain";
import type {
  Wishlist,
  WishlistInsert,
} from "@core/api/types";
import type { WishlistRepository } from "@core/repositories";

// ── Wishlist Repository ──────────────────────────────────────────

export class WishlistRepositoryImpl
  extends BaseRepository<Wishlist, WishlistInsert, Partial<Wishlist>>
  implements WishlistRepository
{
  get TableName(): string {
    return "wishlists";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByUserId(userId: string, params?: QueryParams): Promise<PaginatedResult<Wishlist>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "user_id", operator: "=", value: userId },
      ],
    });
  }

  async findByUserAndProduct(userId: string, productId: string): Promise<Wishlist | null> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("user_id", "=", userId)
      .where("product_id", "=", productId)
      .single();
    return (result as Wishlist) || null;
  }
}
