/**
 * Deals Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/Deals/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { Deal, Coupon, Campaign } from "../domain";

// ── DTOs ─────────────────────────────────────────────────────────

export interface CreateDealDTO {
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
}

export interface ApplyCouponDTO {
  code: string;
  userId: string;
  purchaseAmount: number;
  categories?: string[];
}

// ── Commands ─────────────────────────────────────────────────────

export interface CreateDealCommand {
  type: "CreateDeal";
  payload: CreateDealDTO;
}

export interface ActivateDealCommand {
  type: "ActivateDeal";
  payload: { dealId: string };
}

export interface ExpireDealCommand {
  type: "ExpireDeal";
  payload: { dealId: string };
}

export interface ApplyCouponCommand {
  type: "ApplyCoupon";
  payload: ApplyCouponDTO;
}

export interface CreateCouponCommand {
  type: "CreateCoupon";
  payload: {
    code: string;
    dealId?: string;
    campaignId?: string;
    couponType: string;
    discountValue: number;
    minimumPurchase?: number;
    maximumDiscount?: number;
    usageLimit?: number;
    perUserLimit?: number;
    startsAt: Date;
    expiresAt: Date;
  };
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetDealQuery {
  type: "GetDeal";
  payload: { dealId: string };
}

export interface GetActiveDealsQuery {
  type: "GetActiveDeals";
  payload: {
    params?: QueryParams;
  };
}

export interface GetDealsByVendorQuery {
  type: "GetDealsByVendor";
  payload: {
    vendorId: string;
    params?: QueryParams;
  };
}

export interface GetCouponsQuery {
  type: "GetCoupons";
  payload: {
    dealId?: string;
    params?: QueryParams;
  };
}

export interface GetCampaignQuery {
  type: "GetCampaign";
  payload: { campaignId: string };
}

// ── Application Services ─────────────────────────────────────────

export interface DealApplicationService {
  createDeal(command: CreateDealCommand): Promise<Deal>;
  activateDeal(command: ActivateDealCommand): Promise<void>;
  expireDeal(command: ExpireDealCommand): Promise<void>;
  applyCoupon(command: ApplyCouponCommand): Promise<{ discountAmount: number; finalAmount: number }>;
  createCoupon(command: CreateCouponCommand): Promise<Coupon>;

  getDeal(query: GetDealQuery): Promise<Deal | null>;
  getActiveDeals(query: GetActiveDealsQuery): Promise<PaginatedResult<Deal>>;
  getDealsByVendor(query: GetDealsByVendorQuery): Promise<PaginatedResult<Deal>>;
  getCoupons(query: GetCouponsQuery): Promise<PaginatedResult<Coupon>>;
  getCampaign(query: GetCampaignQuery): Promise<Campaign | null>;
}
