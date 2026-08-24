/**
 * Stores Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/Stores/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { Store, StoreCategory } from "../domain";

// ── DTOs ─────────────────────────────────────────────────────────

export interface CreateStoreDTO {
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
}

export interface UpdateStoreDTO {
  name?: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  categoryId?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface CreateStoreCategoryDTO {
  name: string;
  description?: string;
  parentId?: string;
}

// ── Commands ─────────────────────────────────────────────────────

export interface CreateStoreCommand {
  type: "CreateStore";
  payload: CreateStoreDTO;
}

export interface UpdateStoreCommand {
  type: "UpdateStore";
  payload: {
    storeId: string;
    data: UpdateStoreDTO;
  };
}

export interface CloseStoreCommand {
  type: "CloseStore";
  payload: {
    storeId: string;
    reason?: string;
  };
}

export interface ReopenStoreCommand {
  type: "ReopenStore";
  payload: { storeId: string };
}

export interface CreateStoreCategoryCommand {
  type: "CreateStoreCategory";
  payload: CreateStoreCategoryDTO;
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetStoreQuery {
  type: "GetStore";
  payload: { storeId: string };
}

export interface GetStoreBySlugQuery {
  type: "GetStoreBySlug";
  payload: { slug: string };
}

export interface GetStoresByVendorQuery {
  type: "GetStoresByVendor";
  payload: { vendorId: string };
}

export interface GetStoresByCategoryQuery {
  type: "GetStoresByCategory";
  payload: {
    categoryId: string;
    params?: QueryParams;
  };
}

export interface GetActiveStoresQuery {
  type: "GetActiveStores";
  payload: { params?: QueryParams };
}

export interface GetStoreCategoriesQuery {
  type: "GetStoreCategories";
  payload: { params?: QueryParams };
}

// ── Application Services ─────────────────────────────────────────

export interface StoreApplicationService {
  createStore(command: CreateStoreCommand): Promise<Store>;
  updateStore(command: UpdateStoreCommand): Promise<Store>;
  closeStore(command: CloseStoreCommand): Promise<void>;
  reopenStore(command: ReopenStoreCommand): Promise<void>;
  createCategory(command: CreateStoreCategoryCommand): Promise<StoreCategory>;

  getStore(query: GetStoreQuery): Promise<Store | null>;
  getStoreBySlug(query: GetStoreBySlugQuery): Promise<Store | null>;
  getStoresByVendor(query: GetStoresByVendorQuery): Promise<Store[]>;
  getStoresByCategory(query: GetStoresByCategoryQuery): Promise<PaginatedResult<Store>>;
  getActiveStores(query: GetActiveStoresQuery): Promise<PaginatedResult<Store>>;
  getStoreCategories(query: GetStoreCategoriesQuery): Promise<PaginatedResult<StoreCategory>>;
}
