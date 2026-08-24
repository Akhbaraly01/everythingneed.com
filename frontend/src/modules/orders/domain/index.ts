/**
 * Orders Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/Orders/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";
import type { Money, Address } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface OrderId {
  value: string;
}

export interface OrderNumber {
  value: string;
}

export interface OrderStatus {
  value: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderTotal {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
}

// ── Entities ─────────────────────────────────────────────────────

export interface MedicineOrder {
  id: string;
  userId: string;
  orderNumber: string;
  deliveryAddress: string;
  prescriptionUrl?: string;
  totalAmount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicineOrderItem {
  id: string;
  orderId: string;
  medicineId: string;
  quantity: number;
  unitPrice: number;
  createdAt: Date;
}

export interface VendorOrder {
  id: string;
  vendorId: string;
  customerId: string;
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  orderNumber: string;
  shippingAddress?: string;
  notes?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderTracking {
  id: string;
  orderId: string;
  orderType: string;
  userId: string;
  vendorId?: string;
  status: string;
  statusMessage?: string;
  estimatedDelivery?: string;
  locationLat?: number;
  locationLng?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ── Domain Events ────────────────────────────────────────────────

export interface OrderCreatedEvent {
  type: "OrderCreated";
  orderId: string;
  userId: string;
  total: number;
  currency: string;
  timestamp: Date;
}

export interface OrderConfirmedEvent {
  type: "OrderConfirmed";
  orderId: string;
  timestamp: Date;
}

export interface OrderShippedEvent {
  type: "OrderShipped";
  orderId: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  timestamp: Date;
}

export interface OrderDeliveredEvent {
  type: "OrderDelivered";
  orderId: string;
  timestamp: Date;
}

export interface OrderCancelledEvent {
  type: "OrderCancelled";
  orderId: string;
  reason?: string;
  timestamp: Date;
}

export interface OrderTrackingUpdatedEvent {
  type: "OrderTrackingUpdated";
  orderId: string;
  status: string;
  location?: { lat: number; lng: number };
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface OrderService {
  createMedicineOrder(data: {
    userId: string;
    deliveryAddress: string;
    prescriptionUrl?: string;
    items: Array<{
      medicineId: string;
      quantity: number;
      unitPrice: number;
    }>;
  }): Promise<MedicineOrder>;

  createVendorOrder(data: {
    vendorId: string;
    customerId: string;
    productId?: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    shippingAddress?: string;
    notes?: string;
  }): Promise<VendorOrder>;

  confirmOrder(orderId: string): Promise<void>;
  shipOrder(orderId: string, trackingData?: { estimatedDelivery?: string }): Promise<void>;
  deliverOrder(orderId: string): Promise<void>;
  cancelOrder(orderId: string, reason?: string): Promise<void>;

  getOrderById(orderId: string): Promise<MedicineOrder | null>;
  getOrdersByUserId(userId: string, params?: any): Promise<{ items: MedicineOrder[]; total: number }>;
  getVendorOrdersByVendorId(vendorId: string, params?: any): Promise<{ items: VendorOrder[]; total: number }>;
  getVendorOrdersByCustomerId(customerId: string, params?: any): Promise<{ items: VendorOrder[]; total: number }>;

  addTracking(orderId: string, data: {
    status: string;
    statusMessage?: string;
    estimatedDelivery?: string;
    location?: { lat: number; lng: number };
  }): Promise<OrderTracking>;

  getTrackingHistory(orderId: string): Promise<OrderTracking[]>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class OrderNotFoundError extends DomainError {
  constructor(orderId: string) {
    super(`Order ${orderId} not found`, "ORDER_NOT_FOUND");
    this.name = "OrderNotFoundError";
  }
}

export class InvalidOrderStatusError extends DomainError {
  constructor(currentStatus: string, attemptedAction: string) {
    super(`Cannot ${attemptedAction} order with status ${currentStatus}`, "INVALID_ORDER_STATUS");
    this.name = "InvalidOrderStatusError";
  }
}

export class OrderAlreadyCancelledError extends DomainError {
  constructor(orderId: string) {
    super(`Order ${orderId} is already cancelled`, "ORDER_ALREADY_CANCELLED");
    this.name = "OrderAlreadyCancelledError";
  }
}

export class OrderItemValidationError extends DomainError {
  constructor(message: string) {
    super(message, "ORDER_ITEM_VALIDATION_ERROR");
    this.name = "OrderItemValidationError";
  }
}
