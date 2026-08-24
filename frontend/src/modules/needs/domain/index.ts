/**
 * Needs Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/Needs/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface NeedCategoryId {
  value: string;
}

export interface NeedItemId {
  value: string;
}

export interface NeedCategorySlug {
  value: string;
}

// ── Entities ─────────────────────────────────────────────────────

export interface NeedCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon: string;
  color: string;
  sortOrder: number;
  createdAt: Date;
}

export interface NeedItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  isAvailable: boolean;
  vendorId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Domain Events ────────────────────────────────────────────────

export interface NeedCategoryCreatedEvent {
  type: "NeedCategoryCreated";
  categoryId: string;
  name: string;
  slug: string;
  timestamp: Date;
}

export interface NeedItemCreatedEvent {
  type: "NeedItemCreated";
  itemId: string;
  categoryId: string;
  name: string;
  timestamp: Date;
}

export interface NeedItemAvailabilityChangedEvent {
  type: "NeedItemAvailabilityChanged";
  itemId: string;
  isAvailable: boolean;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface NeedsService {
  createCategory(data: {
    name: string;
    slug: string;
    description?: string;
    icon: string;
    color: string;
    sortOrder: number;
  }): Promise<NeedCategory>;

  updateCategory(categoryId: string, data: Partial<NeedCategory>): Promise<NeedCategory>;
  deleteCategory(categoryId: string): Promise<void>;
  getCategoryById(categoryId: string): Promise<NeedCategory | null>;
  getCategoryBySlug(slug: string): Promise<NeedCategory | null>;
  getAllCategories(): Promise<NeedCategory[]>;
  getCategoriesWithItems(): Promise<(NeedCategory & { items: NeedItem[] })[]>;

  createItem(data: {
    categoryId: string;
    name: string;
    description?: string;
    price?: number;
    imageUrl?: string;
    isAvailable?: boolean;
    vendorId?: string;
  }): Promise<NeedItem>;

  updateItem(itemId: string, data: Partial<NeedItem>): Promise<NeedItem>;
  deleteItem(itemId: string): Promise<void>;
  getItemById(itemId: string): Promise<NeedItem | null>;
  getItemsByCategoryId(categoryId: string, params?: any): Promise<{ items: NeedItem[]; total: number }>;
  getAvailableItems(params?: any): Promise<{ items: NeedItem[]; total: number }>;
  getItemsByVendorId(vendorId: string): Promise<NeedItem[]>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class NeedCategoryNotFoundError extends DomainError {
  constructor(categoryId: string) {
    super(`Need category ${categoryId} not found`, "NEED_CATEGORY_NOT_FOUND");
    this.name = "NeedCategoryNotFoundError";
  }
}

export class NeedItemNotFoundError extends DomainError {
  constructor(itemId: string) {
    super(`Need item ${itemId} not found`, "NEED_ITEM_NOT_FOUND");
    this.name = "NeedItemNotFoundError";
  }
}

export class DuplicateCategorySlugError extends DomainError {
  constructor(slug: string) {
    super(`Category slug ${slug} already exists`, "DUPLICATE_CATEGORY_SLUG");
    this.name = "DuplicateCategorySlugError";
  }
}
