/**
 * Experts Infrastructure - Concrete Repository Implementations
 *
 * Laravel mapping: app/Modules/Experts/Infrastructure/Repositories/*
 */

import type { DataClient } from "@core/contracts";
import { BaseRepository } from "@core/infrastructure";
import type { QueryParams, PaginatedResult } from "@core/domain";
import type {
  ExpertAvailability,
  ExpertAvailabilityInsert,
  ExpertAvailabilityUpdate,
  ExpertWishlist,
  ExpertWishlistInsert,
  ExpertWishlistUpdate,
} from "@core/api/types";
import type {
  ExpertAvailabilityRepository,
  ExpertWishlistRepository,
} from "@core/repositories";

// ── Expert Availability Repository ───────────────────────────────

export class ExpertAvailabilityRepositoryImpl
  extends BaseRepository<ExpertAvailability, ExpertAvailabilityInsert, ExpertAvailabilityUpdate>
  implements ExpertAvailabilityRepository
{
  get TableName(): string {
    return "expert_availability";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByExpertId(expertId: string, expertType: string): Promise<ExpertAvailability | null> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("expert_id", "=", expertId)
      .where("expert_type", "=", expertType)
      .single();
    return (result as ExpertAvailability) || null;
  }

  async findAvailable(expertType: string, params?: QueryParams): Promise<PaginatedResult<ExpertAvailability>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "expert_type", operator: "=", value: expertType },
        { field: "is_available", operator: "=", value: true },
      ],
    });
  }

  async updateStatus(
    expertId: string,
    expertType: string,
    status: string,
    isAvailable: boolean
  ): Promise<ExpertAvailability> {
    const existing = await this.findByExpertId(expertId, expertType);
    if (existing) {
      return this.update(existing.id, { current_status: status, is_available: isAvailable });
    }
    return this.create({
      expert_id: expertId,
      expert_type: expertType,
      current_status: status,
      is_available: isAvailable,
    } as any);
  }
}

// ── Expert Wishlist Repository ───────────────────────────────────

export class ExpertWishlistRepositoryImpl
  extends BaseRepository<ExpertWishlist, ExpertWishlistInsert, ExpertWishlistUpdate>
  implements ExpertWishlistRepository
{
  get TableName(): string {
    return "expert_wishlists";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByUserId(userId: string): Promise<ExpertWishlist[]> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("user_id", "=", userId);
    return (result as ExpertWishlist[]) || [];
  }

  async findByUserAndExpert(userId: string, expertId: string): Promise<ExpertWishlist | null> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("user_id", "=", userId)
      .where("expert_id", "=", expertId)
      .single();
    return (result as ExpertWishlist) || null;
  }
}
