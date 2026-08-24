/**
 * Stores Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/Stores/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface StoreId {
  value: string;
}

export interface StoreSlug {
  value: string;
}

export interface StoreStatus {
  value: "active" | "inactive" | "suspended" | "closed";
}

export interface BusinessHours {
  day: string;
  open: string;
  close: string;
  isClosed: boolean;
}

// ── Entities ─────────────────────────────────────────────────────

export interface Store {
  id: string;
  vendorId: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  categoryId?: string;
  status: string;
  businessHours?: BusinessHours[];
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  rating?: number;
  reviewsCount?: number;
  productsCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// ── Domain Events ────────────────────────────────────────────────

export interface StoreCreatedEvent {
  type: "StoreCreated";
  storeId: string;
  vendorId: string;
  name: string;
  timestamp: Date;
}

export interface StoreUpdatedEvent {
  type: "StoreUpdated";
  storeId: string;
  changes: Partial<Store>;
  timestamp: Date;
}

export interface StoreClosedEvent {
  type: "StoreClosed";
  storeId: string;
  reason?: string;
  timestamp: Date;
}

export interface StoreReopenedEvent {
  type: "StoreReopened";
  storeId: string;
  timestamp: Date;
}

export interface StoreCategoryCreatedEvent {
  type: "StoreCategoryCreated";
  categoryId: string;
  name: string;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface StoreService {
  createStore(data: {
    vendorId: string;
    name: string;
    description?: string;
    categoryId?: string;
    contactPhone?: string;
    contactEmail?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  }): Promise<Store>;

  updateStore(storeId: string, data: Partial<Store>): Promise<Store>;
  closeStore(storeId: string, reason?: string): Promise<void>;
  reopenStore(storeId: string): Promise<void>;
  getStoreById(storeId: string): Promise<Store | null>;
  getStoreBySlug(slug: string): Promise<Store | null>;
  getStoresByVendor(vendorId: string): Promise<Store[]>;
  getStoresByCategory(categoryId: string): Promise<Store[]>;
  getActiveStores(): Promise<Store[]>;

  createCategory(data: {
    name: string;
    description?: string;
    parentId?: string;
  }): Promise<StoreCategory>;
  getCategoryById(categoryId: string): Promise<StoreCategory | null>;
  getAllCategories(): Promise<StoreCategory[]>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class StoreNotFoundError extends DomainError {
  constructor(storeId: string) {
    super(`Store ${storeId} not found`, "STORE_NOT_FOUND");
    this.name = "StoreNotFoundError";
  }
}

export class StoreSlugAlreadyExistsError extends DomainError {
  constructor(slug: string) {
    super(`Store with slug "${slug}" already exists`, "STORE_SLUG_ALREADY_EXISTS");
    this.name = "StoreSlugAlreadyExistsError";
  }
}

export class StoreAlreadyClosedError extends DomainError {
  constructor(storeId: string) {
    super(`Store ${storeId} is already closed`, "STORE_ALREADY_CLOSED");
    this.name = "StoreAlreadyClosedError";
  }
}

export class StoreNotClosedError extends DomainError {
  constructor(storeId: string) {
    super(`Store ${storeId} is not closed`, "STORE_NOT_CLOSED");
    this.name = "StoreNotClosedError";
  }
}
