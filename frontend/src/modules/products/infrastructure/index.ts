/**
 * Products Infrastructure - Concrete Repository Implementations
 *
 * Laravel mapping: app/Modules/Products/Infrastructure/Repositories/*
 */

import type { DataClient } from "@core/contracts";
import { BaseRepository } from "@core/infrastructure";
import type { QueryParams, PaginatedResult } from "@core/domain";
import type {
  Product,
  ProductInsert,
  ProductUpdate,
  ProductReview,
  ProductReviewInsert,
  ProductReviewUpdate,
} from "@core/api/types";
import type { ProductRepository, ProductReviewRepository } from "@core/repositories";

// ── Product Repository ───────────────────────────────────────────

export class ProductRepositoryImpl
  extends BaseRepository<Product, ProductInsert, ProductUpdate>
  implements ProductRepository
{
  get TableName(): string {
    return "products";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByVendorId(vendorId: string, params?: QueryParams): Promise<PaginatedResult<Product>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "vendor_id", operator: "=", value: vendorId },
      ],
    });
  }

  async findByCategory(category: string, params?: QueryParams): Promise<PaginatedResult<Product>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "category", operator: "=", value: category },
      ],
    });
  }

  async findActive(params?: QueryParams): Promise<PaginatedResult<Product>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "is_active", operator: "=", value: true },
      ],
    });
  }

  async search(query: string, params?: QueryParams): Promise<PaginatedResult<Product>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "name", operator: "ilike", value: `%${query}%` },
      ],
    });
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    return this.update(id, { stock_quantity: quantity });
  }
}

// ── Product Review Repository ────────────────────────────────────

export class ProductReviewRepositoryImpl
  extends BaseRepository<ProductReview, ProductReviewInsert, Partial<ProductReview>>
  implements ProductReviewRepository
{
  get TableName(): string {
    return "product_reviews";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByProductId(productId: string, params?: QueryParams): Promise<PaginatedResult<ProductReview>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "product_id", operator: "=", value: productId },
      ],
    });
  }

  async findByUserId(userId: string, params?: QueryParams): Promise<PaginatedResult<ProductReview>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "user_id", operator: "=", value: userId },
      ],
    });
  }

  async findByUserAndProduct(userId: string, productId: string): Promise<ProductReview | null> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("user_id", "=", userId)
      .where("product_id", "=", productId)
      .single();
    return (result as ProductReview) || null;
  }

  async getAverageRating(productId: string): Promise<number> {
    const reviews = await this.findByProductId(productId, { pagination: { page: 1, perPage: 1000 } });
    if (reviews.items.length === 0) return 0;
    const sum = reviews.items.reduce((acc, r) => acc + r.rating, 0);
    return sum / reviews.items.length;
  }
}
