/**
 * Needs Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/Needs/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { NeedCategory, NeedItem } from "../domain";

// ── DTOs ─────────────────────────────────────────────────────────

export interface CreateNeedCategoryDTO {
  name: string;
  slug: string;
  description?: string;
  icon: string;
  color: string;
  sortOrder: number;
}

export interface CreateNeedItemDTO {
  categoryId: string;
  name: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  isAvailable?: boolean;
  vendorId?: string;
}

// ── Commands ─────────────────────────────────────────────────────

export interface CreateNeedCategoryCommand {
  type: "CreateNeedCategory";
  payload: CreateNeedCategoryDTO;
}

export interface UpdateNeedCategoryCommand {
  type: "UpdateNeedCategory";
  payload: {
    categoryId: string;
    data: Partial<NeedCategory>;
  };
}

export interface DeleteNeedCategoryCommand {
  type: "DeleteNeedCategory";
  payload: { categoryId: string };
}

export interface CreateNeedItemCommand {
  type: "CreateNeedItem";
  payload: CreateNeedItemDTO;
}

export interface UpdateNeedItemCommand {
  type: "UpdateNeedItem";
  payload: {
    itemId: string;
    data: Partial<NeedItem>;
  };
}

export interface DeleteNeedItemCommand {
  type: "DeleteNeedItem";
  payload: { itemId: string };
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetNeedCategoryQuery {
  type: "GetNeedCategory";
  payload: { categoryId: string };
}

export interface GetNeedCategoryBySlugQuery {
  type: "GetNeedCategoryBySlug";
  payload: { slug: string };
}

export interface GetAllNeedCategoriesQuery {
  type: "GetAllNeedCategories";
  payload: {};
}

export interface GetCategoriesWithItemsQuery {
  type: "GetCategoriesWithItems";
  payload: {};
}

export interface GetNeedItemQuery {
  type: "GetNeedItem";
  payload: { itemId: string };
}

export interface GetNeedItemsByCategoryQuery {
  type: "GetNeedItemsByCategory";
  payload: {
    categoryId: string;
    params?: QueryParams;
  };
}

export interface GetAvailableNeedItemsQuery {
  type: "GetAvailableNeedItems";
  payload: {
    params?: QueryParams;
  };
}

// ── Application Services ─────────────────────────────────────────

export interface NeedsApplicationService {
  createCategory(command: CreateNeedCategoryCommand): Promise<NeedCategory>;
  updateCategory(command: UpdateNeedCategoryCommand): Promise<NeedCategory>;
  deleteCategory(command: DeleteNeedCategoryCommand): Promise<void>;
  createItem(command: CreateNeedItemCommand): Promise<NeedItem>;
  updateItem(command: UpdateNeedItemCommand): Promise<NeedItem>;
  deleteItem(command: DeleteNeedItemCommand): Promise<void>;

  getCategory(query: GetNeedCategoryQuery): Promise<NeedCategory | null>;
  getCategoryBySlug(query: GetNeedCategoryBySlugQuery): Promise<NeedCategory | null>;
  getAllCategories(query: GetAllNeedCategoriesQuery): Promise<NeedCategory[]>;
  getCategoriesWithItems(query: GetCategoriesWithItemsQuery): Promise<(NeedCategory & { items: NeedItem[] })[]>;
  getItem(query: GetNeedItemQuery): Promise<NeedItem | null>;
  getItemsByCategory(query: GetNeedItemsByCategoryQuery): Promise<PaginatedResult<NeedItem>>;
  getAvailableItems(query: GetAvailableNeedItemsQuery): Promise<PaginatedResult<NeedItem>>;
}
