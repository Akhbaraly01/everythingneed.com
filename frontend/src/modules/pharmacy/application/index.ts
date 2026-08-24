/**
 * Pharmacy Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/Pharmacy/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { Medicine, MedicineOrder } from "@core/api/types";

// ── DTOs ─────────────────────────────────────────────────────────

export interface CreateMedicineDTO {
  name: string;
  genericName?: string;
  category: string;
  description?: string;
  price: number;
  imageUrl?: string;
  requiresPrescription: boolean;
  stockQuantity: number;
}

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

// ── Commands ─────────────────────────────────────────────────────

export interface CreateMedicineCommand {
  type: "CreateMedicine";
  payload: CreateMedicineDTO;
}

export interface UpdateMedicineCommand {
  type: "UpdateMedicine";
  payload: {
    medicineId: string;
    data: Partial<Medicine>;
  };
}

export interface DeleteMedicineCommand {
  type: "DeleteMedicine";
  payload: { medicineId: string };
}

export interface UpdateMedicineStockCommand {
  type: "UpdateMedicineStock";
  payload: {
    medicineId: string;
    quantityChange: number;
  };
}

export interface CreateMedicineOrderCommand {
  type: "CreateMedicineOrder";
  payload: CreateMedicineOrderDTO;
}

export interface UpdateMedicineOrderStatusCommand {
  type: "UpdateMedicineOrderStatus";
  payload: {
    orderId: string;
    status: string;
  };
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetMedicineQuery {
  type: "GetMedicine";
  payload: { medicineId: string };
}

export interface GetMedicinesByCategoryQuery {
  type: "GetMedicinesByCategory";
  payload: {
    category: string;
    params?: QueryParams;
  };
}

export interface SearchMedicinesQuery {
  type: "SearchMedicines";
  payload: {
    query: string;
    params?: QueryParams;
  };
}

export interface GetRequiresPrescriptionQuery {
  type: "GetRequiresPrescription";
  payload: {
    params?: QueryParams;
  };
}

export interface GetMedicineOrderQuery {
  type: "GetMedicineOrder";
  payload: { orderId: string };
}

export interface GetUserMedicineOrdersQuery {
  type: "GetUserMedicineOrders";
  payload: {
    userId: string;
    params?: QueryParams;
  };
}

// ── Application Services ─────────────────────────────────────────

export interface PharmacyApplicationService {
  createMedicine(command: CreateMedicineCommand): Promise<Medicine>;
  updateMedicine(command: UpdateMedicineCommand): Promise<Medicine>;
  deleteMedicine(command: DeleteMedicineCommand): Promise<void>;
  updateMedicineStock(command: UpdateMedicineStockCommand): Promise<Medicine>;
  createOrder(command: CreateMedicineOrderCommand): Promise<MedicineOrder>;
  updateOrderStatus(command: UpdateMedicineOrderStatusCommand): Promise<MedicineOrder>;

  getMedicine(query: GetMedicineQuery): Promise<Medicine | null>;
  getMedicinesByCategory(query: GetMedicinesByCategoryQuery): Promise<PaginatedResult<Medicine>>;
  searchMedicines(query: SearchMedicinesQuery): Promise<PaginatedResult<Medicine>>;
  getRequiresPrescription(query: GetRequiresPrescriptionQuery): Promise<PaginatedResult<Medicine>>;
  getOrder(query: GetMedicineOrderQuery): Promise<MedicineOrder | null>;
  getUserOrders(query: GetUserMedicineOrdersQuery): Promise<PaginatedResult<MedicineOrder>>;
}
