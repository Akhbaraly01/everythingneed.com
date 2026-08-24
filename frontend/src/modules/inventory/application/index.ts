/**
 * Inventory Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/Inventory/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { StockLevel, StockMovement } from "../domain";

// ── DTOs ─────────────────────────────────────────────────────────

export interface AdjustStockDTO {
  productId: string;
  quantity: number;
  type: "in" | "out" | "adjustment";
  warehouseId?: string;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  performedBy?: string;
}

export interface ReserveStockDTO {
  productId: string;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
}

export interface ReleaseStockDTO {
  productId: string;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
}

// ── Commands ─────────────────────────────────────────────────────

export interface AdjustStockCommand {
  type: "AdjustStock";
  payload: AdjustStockDTO;
}

export interface ReserveStockCommand {
  type: "ReserveStock";
  payload: ReserveStockDTO;
}

export interface ReleaseStockCommand {
  type: "ReleaseStock";
  payload: ReleaseStockDTO;
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetStockLevelQuery {
  type: "GetStockLevel";
  payload: {
    productId: string;
    warehouseId?: string;
  };
}

export interface GetStockMovementsQuery {
  type: "GetStockMovements";
  payload: {
    productId: string;
    params?: QueryParams;
  };
}

export interface GetLowStockProductsQuery {
  type: "GetLowStockProducts";
  payload: { params?: QueryParams };
}

export interface GetOutOfStockProductsQuery {
  type: "GetOutOfStockProducts";
  payload: { params?: QueryParams };
}

// ── Application Services ─────────────────────────────────────────

export interface InventoryApplicationService {
  adjustStock(command: AdjustStockCommand): Promise<StockLevel>;
  reserveStock(command: ReserveStockCommand): Promise<StockLevel>;
  releaseStock(command: ReleaseStockCommand): Promise<StockLevel>;

  getStockLevel(query: GetStockLevelQuery): Promise<StockLevel | null>;
  getStockMovements(query: GetStockMovementsQuery): Promise<PaginatedResult<StockMovement>>;
  getLowStockProducts(query: GetLowStockProductsQuery): Promise<PaginatedResult<StockLevel>>;
  getOutOfStockProducts(query: GetOutOfStockProductsQuery): Promise<PaginatedResult<StockLevel>>;
}
