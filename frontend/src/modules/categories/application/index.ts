/**
 * Categories Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/Categories/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { Category, CategoryTree } from "../domain";

// ── DTOs ─────────────────────────────────────────────────────────

export interface CreateCategoryDTO {
  name: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  parentId?: string;
}

export interface UpdateCategoryDTO {
  name?: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  parentId?: string;
  isActive?: boolean;
}

export interface ReorderCategoryDTO {
  categoryId: string;
  newSortOrder: number;
}

// ── Commands ─────────────────────────────────────────────────────

export interface CreateCategoryCommand {
  type: "CreateCategory";
  payload: CreateCategoryDTO;
}

export interface UpdateCategoryCommand {
  type: "UpdateCategory";
  payload: {
    categoryId: string;
    data: UpdateCategoryDTO;
  };
}

export interface DeleteCategoryCommand {
  type: "DeleteCategory";
  payload: { categoryId: string };
}

export interface ReorderCategoryCommand {
  type: "ReorderCategory";
  payload: ReorderCategoryDTO;
}

export interface ToggleCategoryActiveCommand {
  type: "ToggleCategoryActive";
  payload: { categoryId: string };
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetCategoryQuery {
  type: "GetCategory";
  payload: { categoryId: string };
}

export interface GetCategoryBySlugQuery {
  type: "GetCategoryBySlug";
  payload: { slug: string };
}

export interface GetCategoryChildrenQuery {
  type: "GetCategoryChildren";
  payload: { parentId: string };
}

export interface GetRootCategoriesQuery {
  type: "GetRootCategories";
  payload: { params?: QueryParams };
}

export interface GetCategoryTreeQuery {
  type: "GetCategoryTree";
  payload: {};
}

export interface GetCategoryPathQuery {
  type: "GetCategoryPath";
  payload: { categoryId: string };
}

// ── Application Services ─────────────────────────────────────────

export interface CategoryApplicationService {
  createCategory(command: CreateCategoryCommand): Promise<Category>;
  updateCategory(command: UpdateCategoryCommand): Promise<Category>;
  deleteCategory(command: DeleteCategoryCommand): Promise<void>;
  reorderCategory(command: ReorderCategoryCommand): Promise<void>;
  toggleCategoryActive(command: ToggleCategoryActiveCommand): Promise<void>;

  getCategory(query: GetCategoryQuery): Promise<Category | null>;
  getCategoryBySlug(query: GetCategoryBySlugQuery): Promise<Category | null>;
  getCategoryChildren(query: GetCategoryChildrenQuery): Promise<Category[]>;
  getRootCategories(query: GetRootCategoriesQuery): Promise<PaginatedResult<Category>>;
  getCategoryTree(query: GetCategoryTreeQuery): Promise<CategoryTree[]>;
  getCategoryPath(query: GetCategoryPathQuery): Promise<Category[]>;
}
