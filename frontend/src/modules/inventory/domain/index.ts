/**
 * Inventory Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/Inventory/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface StockLevelId {
  value: string;
}

export interface MovementType {
  value: "in" | "out" | "adjustment" | "reservation" | "release";
}

export interface StockStatus {
  value: "available" | "reserved" | "damaged" | "expired";
}

// ── Entities ─────────────────────────────────────────────────────

export interface StockLevel {
  id: string;
  productId: string;
  warehouseId?: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  status: string;
  lastRestockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockMovement {
  id: string;
  stockLevelId: string;
  productId: string;
  type: string;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  performedBy?: string;
  createdAt: Date;
}

// ── Domain Events ────────────────────────────────────────────────

export interface StockAdjustedEvent {
  type: "StockAdjusted";
  stockLevelId: string;
  productId: string;
  previousQuantity: number;
  newQuantity: number;
  adjustmentType: string;
  timestamp: Date;
}

export interface StockReservedEvent {
  type: "StockReserved";
  stockLevelId: string;
  productId: string;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  timestamp: Date;
}

export interface StockReleasedEvent {
  type: "StockReleased";
  stockLevelId: string;
  productId: string;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  timestamp: Date;
}

export interface StockDepletedEvent {
  type: "StockDepleted";
  stockLevelId: string;
  productId: string;
  timestamp: Date;
}

export interface LowStockAlertEvent {
  type: "LowStockAlert";
  stockLevelId: string;
  productId: string;
  currentQuantity: number;
  reorderPoint: number;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface InventoryService {
  adjustStock(productId: string, data: {
    quantity: number;
    type: "in" | "out" | "adjustment";
    warehouseId?: string;
    referenceType?: string;
    referenceId?: string;
    notes?: string;
    performedBy?: string;
  }): Promise<StockLevel>;

  reserveStock(productId: string, data: {
    quantity: number;
    referenceType?: string;
    referenceId?: string;
  }): Promise<StockLevel>;

  releaseStock(productId: string, data: {
    quantity: number;
    referenceType?: string;
    referenceId?: string;
  }): Promise<StockLevel>;

  getStockLevel(productId: string, warehouseId?: string): Promise<StockLevel | null>;
  getStockMovements(productId: string, params?: any): Promise<{ items: StockMovement[]; total: number }>;
  getLowStockProducts(): Promise<StockLevel[]>;
  getOutOfStockProducts(): Promise<StockLevel[]>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class StockLevelNotFoundError extends DomainError {
  constructor(productId: string, warehouseId?: string) {
    super(`Stock level not found for product ${productId}${warehouseId ? ` in warehouse ${warehouseId}` : ""}`, "STOCK_LEVEL_NOT_FOUND");
    this.name = "StockLevelNotFoundError";
  }
}

export class InsufficientStockError extends DomainError {
  constructor(productId: string, requested: number, available: number) {
    super(`Insufficient stock for product ${productId}: requested ${requested}, available ${available}`, "INSUFFICIENT_STOCK");
    this.name = "InsufficientStockError";
  }
}

export class InvalidStockAdjustmentError extends DomainError {
  constructor(reason: string) {
    super(`Invalid stock adjustment: ${reason}`, "INVALID_STOCK_ADJUSTMENT");
    this.name = "InvalidStockAdjustmentError";
  }
}

export class StockAlreadyDepletedError extends DomainError {
  constructor(productId: string) {
    super(`Stock for product ${productId} is already depleted`, "STOCK_ALREADY_DEPLETED");
    this.name = "StockAlreadyDepletedError";
  }
}

export class ReservationExceedsAvailableError extends DomainError {
  constructor(productId: string, requested: number, available: number) {
    super(`Reservation of ${requested} exceeds available ${available} for product ${productId}`, "RESERVATION_EXCEEDS_AVAILABLE");
    this.name = "ReservationExceedsAvailableError";
  }
}
