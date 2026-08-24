/**
 * Deals Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/Deals/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface DealId {
  value: string;
}

export interface CouponId {
  value: string;
}

export interface CampaignId {
  value: string;
}

export interface DealType {
  value: "percentage" | "fixed" | "bogo" | "free_shipping" | "bundle";
}

export interface DealStatus {
  value: "draft" | "active" | "paused" | "expired" | "cancelled";
}

export interface CouponType {
  value: "percentage" | "fixed" | "free_shipping";
}

export interface CouponStatus {
  value: "active" | "inactive" | "expired" | "exhausted";
}

// ── Entities ─────────────────────────────────────────────────────

export interface Deal {
  id: string;
  vendorId?: string;
  title: string;
  description?: string;
  dealType: string;
  discountValue: number;
  minimumPurchase?: number;
  maximumDiscount?: number;
  applicableCategories?: string[];
  applicableProducts?: string[];
  imageUrl?: string;
  termsAndConditions?: string;
  status: string;
  usageLimit?: number;
  usageCount: number;
  startsAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Coupon {
  id: string;
  code: string;
  dealId?: string;
  campaignId?: string;
  couponType: string;
  discountValue: number;
  minimumPurchase?: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  perUserLimit?: number;
  applicableCategories?: string[];
  status: string;
  startsAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  vendorId?: string;
  dealIds?: string[];
  couponIds?: string[];
  status: string;
  budget?: number;
  spent: number;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ── Domain Events ────────────────────────────────────────────────

export interface DealCreatedEvent {
  type: "DealCreated";
  dealId: string;
  vendorId?: string;
  dealType: string;
  discountValue: number;
  timestamp: Date;
}

export interface DealActivatedEvent {
  type: "DealActivated";
  dealId: string;
  timestamp: Date;
}

export interface DealExpiredEvent {
  type: "DealExpired";
  dealId: string;
  timestamp: Date;
}

export interface CouponAppliedEvent {
  type: "CouponApplied";
  couponId: string;
  code: string;
  userId: string;
  discountAmount: number;
  timestamp: Date;
}

export interface CampaignStartedEvent {
  type: "CampaignStarted";
  campaignId: string;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface DealService {
  createDeal(data: {
    vendorId?: string;
    title: string;
    description?: string;
    dealType: string;
    discountValue: number;
    minimumPurchase?: number;
    maximumDiscount?: number;
    applicableCategories?: string[];
    applicableProducts?: string[];
    usageLimit?: number;
    startsAt: Date;
    expiresAt: Date;
  }): Promise<Deal>;

  expireDeal(dealId: string): Promise<void>;
  activateDeal(dealId: string): Promise<void>;

  applyCoupon(data: {
    code: string;
    userId: string;
    purchaseAmount: number;
    categories?: string[];
  }): Promise<{ discountAmount: number; finalAmount: number }>;

  getDealById(dealId: string): Promise<Deal | null>;
  getActiveDeals(params?: any): Promise<{ items: Deal[]; total: number }>;
  getDealsByVendor(vendorId: string, params?: any): Promise<{ items: Deal[]; total: number }>;
  getCouponByCode(code: string): Promise<Coupon | null>;
  getCampaignById(campaignId: string): Promise<Campaign | null>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class DealNotFoundError extends DomainError {
  constructor(dealId: string) {
    super(`Deal ${dealId} not found`, "DEAL_NOT_FOUND");
    this.name = "DealNotFoundError";
  }
}

export class CouponNotFoundError extends DomainError {
  constructor(code: string) {
    super(`Coupon ${code} not found`, "COUPON_NOT_FOUND");
    this.name = "CouponNotFoundError";
  }
}

export class CouponExpiredError extends DomainError {
  constructor(code: string) {
    super(`Coupon ${code} has expired`, "COUPON_EXPIRED");
    this.name = "CouponExpiredError";
  }
}

export class CouponUsageLimitExceededError extends DomainError {
  constructor(code: string) {
    super(`Coupon ${code} usage limit exceeded`, "COUPON_USAGE_LIMIT_EXCEEDED");
    this.name = "CouponUsageLimitExceededError";
  }
}

export class MinimumPurchaseNotMetError extends DomainError {
  constructor(required: number, actual: number) {
    super(`Minimum purchase of ${required} not met (current: ${actual})`, "MINIMUM_PURCHASE_NOT_MET");
    this.name = "MinimumPurchaseNotMetError";
  }
}
