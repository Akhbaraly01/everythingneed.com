/**
 * Orders Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/Orders/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { MedicineOrder, VendorOrder, OrderTracking } from "../domain";

// ── DTOs ─────────────────────────────────────────────────────────

export interface CreateMedicineOrderDTO {
  userId: string;
  deliveryAddress: string;
  prescriptionUrl?: string;
  items: Array<{
    medicineId: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface CreateVendorOrderDTO {
  vendorId: string;
  customerId: string;
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  shippingAddress?: string;
  notes?: string;
}

export interface UpdateOrderStatusDTO {
  orderId: string;
  status: string;
  estimatedDelivery?: string;
  location?: { lat: number; lng: number };
}

// ── Commands ─────────────────────────────────────────────────────

export interface CreateMedicineOrderCommand {
  type: "CreateMedicineOrder";
  payload: CreateMedicineOrderDTO;
}

export interface CreateVendorOrderCommand {
  type: "CreateVendorOrder";
  payload: CreateVendorOrderDTO;
}

export interface ConfirmOrderCommand {
  type: "ConfirmOrder";
  payload: { orderId: string };
}

export interface ShipOrderCommand {
  type: "ShipOrder";
  payload: {
    orderId: string;
    estimatedDelivery?: string;
  };
}

export interface DeliverOrderCommand {
  type: "DeliverOrder";
  payload: { orderId: string };
}

export interface CancelOrderCommand {
  type: "CancelOrder";
  payload: {
    orderId: string;
    reason?: string;
  };
}

export interface AddTrackingCommand {
  type: "AddTracking";
  payload: {
    orderId: string;
    status: string;
    statusMessage?: string;
    estimatedDelivery?: string;
    location?: { lat: number; lng: number };
  };
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetOrderQuery {
  type: "GetOrder";
  payload: { orderId: string };
}

export interface GetUserOrdersQuery {
  type: "GetUserOrders";
  payload: {
    userId: string;
    params?: QueryParams;
  };
}

export interface GetVendorOrdersQuery {
  type: "GetVendorOrders";
  payload: {
    vendorId: string;
    params?: QueryParams;
  };
}

export interface GetOrderTrackingQuery {
  type: "GetOrderTracking";
  payload: { orderId: string };
}

// ── Application Services ─────────────────────────────────────────

export interface OrderApplicationService {
  createMedicineOrder(command: CreateMedicineOrderCommand): Promise<MedicineOrder>;
  createVendorOrder(command: CreateVendorOrderCommand): Promise<VendorOrder>;
  confirmOrder(command: ConfirmOrderCommand): Promise<void>;
  shipOrder(command: ShipOrderCommand): Promise<void>;
  deliverOrder(command: DeliverOrderCommand): Promise<void>;
  cancelOrder(command: CancelOrderCommand): Promise<void>;

  addTracking(command: AddTrackingCommand): Promise<OrderTracking>;

  getOrder(query: GetOrderQuery): Promise<MedicineOrder | null>;
  getUserOrders(query: GetUserOrdersQuery): Promise<PaginatedResult<MedicineOrder>>;
  getVendorOrders(query: GetVendorOrdersQuery): Promise<PaginatedResult<VendorOrder>>;
  getOrderTracking(query: GetOrderTrackingQuery): Promise<OrderTracking[]>;
}
