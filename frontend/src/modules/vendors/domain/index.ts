/**
 * Vendors Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/Vendors/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";
import type { Address, Money } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface VendorId {
  value: string;
}

export interface StoreName {
  value: string;
}

export interface VendorStatus {
  value: "pending" | "verified" | "suspended";
}

export interface CommissionRate {
  value: number;
}

// ── Entities ─────────────────────────────────────────────────────

export interface Vendor {
  id: string;
  userId: string;
  storeName: string;
  category: string;
  description?: string;
  isVerified: boolean;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface VendorProfile {
  vendorId: string;
  businessName: string;
  businessType: string;
  taxId?: string;
  address?: Address;
  phone: string;
  email: string;
  website?: string;
  logoUrl?: string;
  bannerUrl?: string;
}

export interface VendorSettings {
  vendorId: string;
  commissionRate: number;
  minPayoutAmount: number;
  payoutFrequency: "weekly" | "biweekly" | "monthly";
  autoPayoutEnabled: boolean;
}

// ── Domain Events ────────────────────────────────────────────────

export interface VendorRegisteredEvent {
  type: "VendorRegistered";
  vendorId: string;
  userId: string;
  storeName: string;
  timestamp: Date;
}

export interface VendorVerifiedEvent {
  type: "VendorVerified";
  vendorId: string;
  timestamp: Date;
}

export interface VendorSuspendedEvent {
  type: "VendorSuspended";
  vendorId: string;
  reason?: string;
  timestamp: Date;
}

export interface VendorRatingChangedEvent {
  type: "VendorRatingChanged";
  vendorId: string;
  oldRating: number;
  newRating: number;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface VendorService {
  register(data: {
    userId: string;
    storeName: string;
    category: string;
    description?: string;
  }): Promise<Vendor>;

  verify(vendorId: string): Promise<void>;
  suspend(vendorId: string, reason?: string): Promise<void>;
  updateProfile(vendorId: string, data: Partial<VendorProfile>): Promise<VendorProfile>;
  updateSettings(vendorId: string, data: Partial<VendorSettings>): Promise<VendorSettings>;

  getById(vendorId: string): Promise<Vendor | null>;
  getByUserId(userId: string): Promise<Vendor | null>;
  getByCategory(category: string, params?: any): Promise<{ items: Vendor[]; total: number }>;
  getVerified(params?: any): Promise<{ items: Vendor[]; total: number }>;
  search(query: string): Promise<Vendor[]>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class VendorNotFoundError extends DomainError {
  constructor(vendorId: string) {
    super(`Vendor ${vendorId} not found`, "VENDOR_NOT_FOUND");
    this.name = "VendorNotFoundError";
  }
}

export class VendorNotVerifiedError extends DomainError {
  constructor(vendorId: string) {
    super(`Vendor ${vendorId} is not verified`, "VENDOR_NOT_VERIFIED");
    this.name = "VendorNotVerifiedError";
  }
}

export class VendorAlreadyRegisteredError extends DomainError {
  constructor(userId: string) {
    super(`User ${userId} is already registered as a vendor`, "VENDOR_ALREADY_REGISTERED");
    this.name = "VendorAlreadyRegisteredError";
  }
}

export class InvalidCommissionRateError extends DomainError {
  constructor(rate: number) {
    super(`Invalid commission rate: ${rate}`, "INVALID_COMMISSION_RATE");
    this.name = "InvalidCommissionRateError";
  }
}
