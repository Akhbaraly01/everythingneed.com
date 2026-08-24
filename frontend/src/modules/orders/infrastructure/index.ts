/**
 * Orders Infrastructure - Concrete Repository Implementations
 *
 * Laravel mapping: app/Modules/Orders/Infrastructure/Repositories/*
 */

import type { DataClient } from "@core/contracts";
import { BaseRepository } from "@core/infrastructure";
import type { QueryParams, PaginatedResult } from "@core/domain";
import type {
  MedicineOrder,
  MedicineOrderInsert,
  MedicineOrderUpdate,
  VendorOrder,
  VendorOrderInsert,
  VendorOrderUpdate,
  OrderTracking,
  OrderTrackingInsert,
  OrderTrackingUpdate,
  MedicineOrderItem,
  MedicineOrderItemInsert,
  MedicineOrderItemUpdate,
} from "@core/api/types";
import type {
  MedicineOrderRepository,
  VendorOrderRepository,
  OrderTrackingRepository,
  MedicineOrderItemRepository,
} from "@core/repositories";

// ── Medicine Order Repository ────────────────────────────────────

export class MedicineOrderRepositoryImpl
  extends BaseRepository<MedicineOrder, MedicineOrderInsert, MedicineOrderUpdate>
  implements MedicineOrderRepository
{
  get TableName(): string {
    return "medicine_orders";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByUserId(userId: string, params?: QueryParams): Promise<PaginatedResult<MedicineOrder>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "user_id", operator: "=", value: userId },
      ],
    });
  }

  async findByOrderNumber(orderNumber: string): Promise<MedicineOrder | null> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("order_number", "=", orderNumber)
      .single();
    return (result as MedicineOrder) || null;
  }

  async updateStatus(id: string, status: string): Promise<MedicineOrder> {
    return this.update(id, { status: status as any });
  }
}

// ── Vendor Order Repository ──────────────────────────────────────

export class VendorOrderRepositoryImpl
  extends BaseRepository<VendorOrder, VendorOrderInsert, VendorOrderUpdate>
  implements VendorOrderRepository
{
  get TableName(): string {
    return "vendor_orders";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByVendorId(vendorId: string, params?: QueryParams): Promise<PaginatedResult<VendorOrder>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "vendor_id", operator: "=", value: vendorId },
      ],
    });
  }

  async findByCustomerId(customerId: string, params?: QueryParams): Promise<PaginatedResult<VendorOrder>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "customer_id", operator: "=", value: customerId },
      ],
    });
  }

  async findByOrderNumber(orderNumber: string): Promise<VendorOrder | null> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("order_number", "=", orderNumber)
      .single();
    return (result as VendorOrder) || null;
  }

  async updateStatus(id: string, status: string): Promise<VendorOrder> {
    return this.update(id, { status });
  }
}

// ── Order Tracking Repository ────────────────────────────────────

export class OrderTrackingRepositoryImpl
  extends BaseRepository<OrderTracking, OrderTrackingInsert, OrderTrackingUpdate>
  implements OrderTrackingRepository
{
  get TableName(): string {
    return "order_tracking";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByOrderId(orderId: string): Promise<OrderTracking[]> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("order_id", "=", orderId)
      .orderBy("created_at", false);
    return (result as OrderTracking[]) || [];
  }

  async findLatestByOrderId(orderId: string): Promise<OrderTracking | null> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("order_id", "=", orderId)
      .orderBy("created_at", false)
      .limit(1)
      .single();
    return (result as OrderTracking) || null;
  }

  async updateStatus(
    id: string,
    status: string,
    location?: { lat: number; lng: number }
  ): Promise<OrderTracking> {
    const updateData: Partial<OrderTrackingUpdate> = { status, status_message: status };
    if (location) {
      updateData.location_lat = location.lat;
      updateData.location_lng = location.lng;
    }
    return this.update(id, updateData);
  }
}

// ── Medicine Order Item Repository ───────────────────────────────

export class MedicineOrderItemRepositoryImpl
  extends BaseRepository<MedicineOrderItem, MedicineOrderItemInsert, MedicineOrderItemUpdate>
  implements MedicineOrderItemRepository
{
  get TableName(): string {
    return "medicine_order_items";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByOrderId(orderId: string): Promise<MedicineOrderItem[]> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("order_id", "=", orderId);
    return (result as MedicineOrderItem[]) || [];
  }

  async findByMedicineId(medicineId: string): Promise<MedicineOrderItem[]> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("medicine_id", "=", medicineId);
    return (result as MedicineOrderItem[]) || [];
  }

  async deleteByOrderId(orderId: string): Promise<boolean> {
    const items = await this.findByOrderId(orderId);
    for (const item of items) {
      await this.delete(item.id);
    }
    return true;
  }
}
