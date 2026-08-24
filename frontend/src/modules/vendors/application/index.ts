/**
 * Vendors Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/Vendors/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { Vendor } from "../domain";

// ── DTOs ─────────────────────────────────────────────────────────

export interface RegisterVendorDTO {
  userId: string;
  storeName: string;
  category: string;
  description?: string;
}

export interface UpdateVendorProfileDTO {
  storeName?: string;
  description?: string;
  category?: string;
}

export interface UpdateVendorSettingsDTO {
  commissionRate?: number;
  minPayoutAmount?: number;
  payoutFrequency?: string;
  autoPayoutEnabled?: boolean;
}

// ── Commands ─────────────────────────────────────────────────────

export interface RegisterVendorCommand {
  type: "RegisterVendor";
  payload: RegisterVendorDTO;
}

export interface VerifyVendorCommand {
  type: "VerifyVendor";
  payload: { vendorId: string };
}

export interface SuspendVendorCommand {
  type: "SuspendVendor";
  payload: {
    vendorId: string;
    reason?: string;
  };
}

export interface UpdateVendorProfileCommand {
  type: "UpdateVendorProfile";
  payload: {
    vendorId: string;
    data: UpdateVendorProfileDTO;
  };
}

export interface UpdateVendorSettingsCommand {
  type: "UpdateVendorSettings";
  payload: {
    vendorId: string;
    data: UpdateVendorSettingsDTO;
  };
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetVendorQuery {
  type: "GetVendor";
  payload: { vendorId: string };
}

export interface GetVendorByUserQuery {
  type: "GetVendorByUser";
  payload: { userId: string };
}

export interface GetVendorsByCategoryQuery {
  type: "GetVendorsByCategory";
  payload: {
    category: string;
    params?: QueryParams;
  };
}

export interface GetVerifiedVendorsQuery {
  type: "GetVerifiedVendors";
  payload: {
    params?: QueryParams;
  };
}

export interface SearchVendorsQuery {
  type: "SearchVendors";
  payload: { query: string };
}

// ── Application Services ─────────────────────────────────────────

export interface VendorApplicationService {
  registerVendor(command: RegisterVendorCommand): Promise<Vendor>;
  verifyVendor(command: VerifyVendorCommand): Promise<void>;
  suspendVendor(command: SuspendVendorCommand): Promise<void>;
  updateProfile(command: UpdateVendorProfileCommand): Promise<Vendor>;
  updateSettings(command: UpdateVendorSettingsCommand): Promise<Vendor>;

  getVendor(query: GetVendorQuery): Promise<Vendor | null>;
  getVendorByUser(query: GetVendorByUserQuery): Promise<Vendor | null>;
  getVendorsByCategory(query: GetVendorsByCategoryQuery): Promise<PaginatedResult<Vendor>>;
  getVerifiedVendors(query: GetVerifiedVendorsQuery): Promise<PaginatedResult<Vendor>>;
  searchVendors(query: SearchVendorsQuery): Promise<Vendor[]>;
}
