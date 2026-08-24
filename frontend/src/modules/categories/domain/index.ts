/**
 * Categories Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/Categories/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface CategoryId {
  value: string;
}

export interface CategorySlug {
  value: string;
}

export interface CategoryPath {
  value: string;
}

export interface SortOrder {
  value: number;
}

// ── Entities ─────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  parentId?: string;
  path: string;
  depth: number;
  sortOrder: number;
  isActive: boolean;
  productsCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryTree {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  children: CategoryTree[];
}

// ── Domain Events ────────────────────────────────────────────────

export interface CategoryCreatedEvent {
  type: "CategoryCreated";
  categoryId: string;
  name: string;
  parentId?: string;
  timestamp: Date;
}

export interface CategoryUpdatedEvent {
  type: "CategoryUpdated";
  categoryId: string;
  changes: Partial<Category>;
  timestamp: Date;
}

export interface CategoryDeletedEvent {
  type: "CategoryDeleted";
  categoryId: string;
  timestamp: Date;
}

export interface CategoryReorderedEvent {
  type: "CategoryReordered";
  categoryId: string;
  newSortOrder: number;
  previousSortOrder: number;
  timestamp: Date;
}

export interface CategoryToggledEvent {
  type: "CategoryToggled";
  categoryId: string;
  isActive: boolean;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface CategoryService {
  create(data: {
    name: string;
    description?: string;
    icon?: string;
    imageUrl?: string;
    parentId?: string;
  }): Promise<Category>;

  update(categoryId: string, data: Partial<Category>): Promise<Category>;
  delete(categoryId: string): Promise<void>;
  reorder(categoryId: string, newSortOrder: number): Promise<void>;
  toggleActive(categoryId: string): Promise<void>;

  getById(categoryId: string): Promise<Category | null>;
  getBySlug(slug: string): Promise<Category | null>;
  getChildren(parentId: string): Promise<Category[]>;
  getRootCategories(): Promise<Category[]>;
  getTree(): Promise<CategoryTree[]>;
  getPath(categoryId: string): Promise<Category[]>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class CategoryNotFoundError extends DomainError {
  constructor(categoryId: string) {
    super(`Category ${categoryId} not found`, "CATEGORY_NOT_FOUND");
    this.name = "CategoryNotFoundError";
  }
}

export class CategorySlugAlreadyExistsError extends DomainError {
  constructor(slug: string) {
    super(`Category with slug "${slug}" already exists`, "CATEGORY_SLUG_ALREADY_EXISTS");
    this.name = "CategorySlugAlreadyExistsError";
  }
}

export class CategoryHasChildrenError extends DomainError {
  constructor(categoryId: string) {
    super(`Category ${categoryId} has children and cannot be deleted`, "CATEGORY_HAS_CHILDREN");
    this.name = "CategoryHasChildrenError";
  }
}

export class CategoryCircularReferenceError extends DomainError {
  constructor(categoryId: string, parentId: string) {
    super(`Cannot set parent of ${categoryId} to ${parentId}: circular reference`, "CATEGORY_CIRCULAR_REFERENCE");
    this.name = "CategoryCircularReferenceError";
  }
}

export class RootCategoryCannotBeDeletedError extends DomainError {
  constructor(categoryId: string) {
    super(`Root category ${categoryId} cannot be deleted`, "ROOT_CATEGORY_CANNOT_BE_DELETED");
    this.name = "RootCategoryCannotBeDeletedError";
  }
}
