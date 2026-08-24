/**
 * Reviews Infrastructure - Concrete Repository Implementations
 *
 * Laravel mapping: app/Modules/Reviews/Infrastructure/Repositories/*
 */

import type { DataClient } from "@core/contracts";
import { BaseRepository } from "@core/infrastructure";
import type { QueryParams, PaginatedResult } from "@core/domain";
import type {
  ExpertReview,
  ExpertReviewInsert,
} from "@core/api/types";
import type { ExpertReviewRepository } from "@core/repositories";

// ── Expert Review Repository ─────────────────────────────────────

export class ExpertReviewRepositoryImpl
  extends BaseRepository<ExpertReview, ExpertReviewInsert, Partial<ExpertReview>>
  implements ExpertReviewRepository
{
  get TableName(): string {
    return "expert_reviews";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByExpertId(expertId: string, params?: QueryParams): Promise<PaginatedResult<ExpertReview>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "expert_id", operator: "=", value: expertId },
      ],
    });
  }

  async findByUserId(userId: string, params?: QueryParams): Promise<PaginatedResult<ExpertReview>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "user_id", operator: "=", value: userId },
      ],
    });
  }

  async findByUserAndExpert(userId: string, expertId: string): Promise<ExpertReview | null> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("user_id", "=", userId)
      .where("expert_id", "=", expertId)
      .single();
    return (result as ExpertReview) || null;
  }

  async getAverageRating(expertId: string): Promise<number> {
    const reviews = await this.findByExpertId(expertId, { pagination: { page: 1, perPage: 1000 } });
    if (reviews.items.length === 0) return 0;
    const sum = reviews.items.reduce((acc, r) => acc + r.rating, 0);
    return sum / reviews.items.length;
  }
}
