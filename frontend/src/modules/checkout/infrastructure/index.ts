/**
 * Checkout Infrastructure - Concrete Repository Implementations
 *
 * Laravel mapping: app/Modules/Checkout/Infrastructure/Repositories/*
 */

import type { DataClient } from "@core/contracts";
import { BaseRepository } from "@core/infrastructure";
import type { QueryParams, PaginatedResult } from "@core/domain";
import type {
  CartItem,
  CartItemInsert,
  CartItemUpdate,
} from "@core/api/types";
import type { CartItemRepository } from "@core/repositories";

// ── Cart Item Repository ─────────────────────────────────────────

export class CartItemRepositoryImpl
  extends BaseRepository<CartItem, CartItemInsert, CartItemUpdate>
  implements CartItemRepository
{
  get TableName(): string {
    return "cart_items";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByUserId(userId: string): Promise<CartItem[]> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("user_id", "=", userId);
    return (result as CartItem[]) || [];
  }

  async findByMedicineId(medicineId: string): Promise<CartItem | null> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("medicine_id", "=", medicineId)
      .single();
    return (result as CartItem) || null;
  }

  async clearByUserId(userId: string): Promise<boolean> {
    const items = await this.findByUserId(userId);
    for (const item of items) {
      await this.delete(item.id);
    }
    return true;
  }

  async countByUserId(userId: string): Promise<number> {
    return this.count([{ field: "user_id", operator: "=", value: userId }]);
  }
}
