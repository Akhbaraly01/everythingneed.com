/**
 * Products Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/Products/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";
import type { Money, Address, PaginationParams } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface ProductId {
  value: string;
}

export interface ProductName {
  value: string;
}

export interface ProductDescription {
  value: string;
}

export interface ProductPrice {
  amount: number;
  currency: string;
}

export interface StockQuantity {
  value: number;
}

export interface ProductImage {
  url: string;
  alt?: string;
  isPrimary: boolean;
}

export interface ProductCategory {
  name: string;
  slug: string;
}

export interface ProductFilter {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  vendorId?: string;
  search?: string;
}

// ── Entities ─────────────────────────────────────────────────────

export interface Product {
  id: string;
  vendorId: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  price: number;
  comparePrice?: number;
  imageUrl?: string;
  images?: string[];
  videoUrl?: string;
  productionVideoUrl?: string;
  stockQuantity: number;
  isActive: boolean;
  rating?: number;
  reviewsCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  comment?: string;
  isVerifiedPurchase?: boolean;
  helpfulCount?: number;
  createdAt: Date;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
  attributes: Record<string, string>;
}

// ── Domain Events ────────────────────────────────────────────────

export interface ProductCreatedEvent {
  type: "ProductCreated";
  productId: string;
  vendorId: string;
  name: string;
  price: number;
  timestamp: Date;
}

export interface ProductUpdatedEvent {
  type: "ProductUpdated";
  productId: string;
  changes: Partial<Product>;
  timestamp: Date;
}

export interface ProductDeletedEvent {
  type: "ProductDeleted";
  productId: string;
  timestamp: Date;
}

export interface ProductStockChangedEvent {
  type: "ProductStockChanged";
  productId: string;
  previousQuantity: number;
  newQuantity: number;
  timestamp: Date;
}

export interface ProductReviewedEvent {
  type: "ProductReviewed";
  productId: string;
  reviewId: string;
  userId: string;
  rating: number;
  timestamp: Date;
}

export interface ProductActivatedEvent {
  type: "ProductActivated";
  productId: string;
  timestamp: Date;
}

export interface ProductDeactivatedEvent {
  type: "ProductDeactivated";
  productId: string;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface ProductService {
  create(data: {
    vendorId: string;
    name: string;
    description?: string;
    category: string;
    subcategory?: string;
    price: number;
    comparePrice?: number;
    imageUrl?: string;
    images?: string[];
    stockQuantity: number;
  }): Promise<Product>;

  update(productId: string, data: Partial<Product>): Promise<Product>;
  delete(productId: string): Promise<void>;
  getById(productId: string): Promise<Product | null>;
  getByVendorId(vendorId: string, params?: PaginationParams): Promise<{ items: Product[]; total: number }>;
  getByCategory(category: string, params?: PaginationParams): Promise<{ items: Product[]; total: number }>;
  getActive(params?: PaginationParams): Promise<{ items: Product[]; total: number }>;
  search(query: string, params?: PaginationParams): Promise<{ items: Product[]; total: number }>;
  updateStock(productId: string, quantityChange: number): Promise<Product>;
  activate(productId: string): Promise<void>;
  deactivate(productId: string): Promise<void>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class ProductNotFoundError extends DomainError {
  constructor(productId: string) {
    super(`Product ${productId} not found`, "PRODUCT_NOT_FOUND");
    this.name = "ProductNotFoundError";
  }
}

export class InsufficientStockError extends DomainError {
  constructor(productId: string, requested: number, available: number) {
    super(`Insufficient stock for product ${productId}: requested ${requested}, available ${available}`, "INSUFFICIENT_STOCK");
    this.name = "InsufficientStockError";
  }
}

export class InvalidProductPriceError extends DomainError {
  constructor(price: number) {
    super(`Invalid product price: ${price}`, "INVALID_PRODUCT_PRICE");
    this.name = "InvalidProductPriceError";
  }
}

export class ProductInactiveError extends DomainError {
  constructor(productId: string) {
    super(`Product ${productId} is inactive`, "PRODUCT_INACTIVE");
    this.name = "ProductInactiveError";
  }
}
