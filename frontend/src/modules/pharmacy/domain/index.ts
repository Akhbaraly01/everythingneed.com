/**
 * Pharmacy Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/Pharmacy/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";
import type { Money, StockQuantity } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface MedicineId {
  value: string;
}

export interface MedicineName {
  value: string;
}

export interface MedicineCategory {
  value: string;
}

export interface PrescriptionRequired {
  value: boolean;
}

// ── Entities ─────────────────────────────────────────────────────

export interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  category: string;
  description?: string;
  price: number;
  imageUrl?: string;
  requiresPrescription: boolean;
  stockQuantity: number;
  createdAt: Date;
  updatedAt: Date;
}

// ── Domain Events ────────────────────────────────────────────────

export interface MedicineCreatedEvent {
  type: "MedicineCreated";
  medicineId: string;
  name: string;
  category: string;
  timestamp: Date;
}

export interface MedicineStockChangedEvent {
  type: "MedicineStockChanged";
  medicineId: string;
  previousQuantity: number;
  newQuantity: number;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface PharmacyService {
  createMedicine(data: {
    name: string;
    genericName?: string;
    category: string;
    description?: string;
    price: number;
    imageUrl?: string;
    requiresPrescription: boolean;
    stockQuantity: number;
  }): Promise<Medicine>;

  updateMedicine(medicineId: string, data: Partial<Medicine>): Promise<Medicine>;
  deleteMedicine(medicineId: string): Promise<void>;
  getMedicineById(medicineId: string): Promise<Medicine | null>;
  getMedicinesByCategory(category: string, params?: any): Promise<{ items: Medicine[]; total: number }>;
  searchMedicines(query: string, params?: any): Promise<{ items: Medicine[]; total: number }>;
  getRequiresPrescription(params?: any): Promise<{ items: Medicine[]; total: number }>;
  updateStock(medicineId: string, quantityChange: number): Promise<Medicine>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class MedicineNotFoundError extends DomainError {
  constructor(medicineId: string) {
    super(`Medicine ${medicineId} not found`, "MEDICINE_NOT_FOUND");
    this.name = "MedicineNotFoundError";
  }
}

export class InsufficientMedicineStockError extends DomainError {
  constructor(medicineId: string, requested: number, available: number) {
    super(`Insufficient stock for medicine ${medicineId}: requested ${requested}, available ${available}`, "INSUFFICIENT_MEDICINE_STOCK");
    this.name = "InsufficientMedicineStockError";
  }
}

export class InvalidMedicinePriceError extends DomainError {
  constructor(price: number) {
    super(`Invalid medicine price: ${price}`, "INVALID_MEDICINE_PRICE");
    this.name = "InvalidMedicinePriceError";
  }
}
