/**
 * Products Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/Products/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { Product, ProductReview } from "../domain";

// ── DTOs ─────────────────────────────────────────────────────────

export interface CreateProductDTO {
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
}

export interface UpdateProductDTO {
  name?: string;
  description?: string;
  price?: number;
  comparePrice?: number;
  imageUrl?: string;
  images?: string[];
  stockQuantity?: number;
  isActive?: boolean;
}

export interface CreateProductReviewDTO {
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  comment?: string;
}

// ── Commands ─────────────────────────────────────────────────────

export interface CreateProductCommand {
  type: "CreateProduct";
  payload: CreateProductDTO;
}

export interface UpdateProductCommand {
  type: "UpdateProduct";
  payload: {
    productId: string;
    data: UpdateProductDTO;
  };
}

export interface DeleteProductCommand {
  type: "DeleteProduct";
  payload: { productId: string };
}

export interface UpdateProductStockCommand {
  type: "UpdateProductStock";
  payload: {
    productId: string;
    quantityChange: number;
  };
}

export interface ActivateProductCommand {
  type: "ActivateProduct";
  payload: { productId: string };
}

export interface DeactivateProductCommand {
  type: "DeactivateProduct";
  payload: { productId: string };
}

export interface CreateProductReviewCommand {
  type: "CreateProductReview";
  payload: CreateProductReviewDTO;
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetProductQuery {
  type: "GetProduct";
  payload: { productId: string };
}

export interface GetProductsByVendorQuery {
  type: "GetProductsByVendor";
  payload: {
    vendorId: string;
    params?: QueryParams;
  };
}

export interface GetProductsByCategoryQuery {
  type: "GetProductsByCategory";
  payload: {
    category: string;
    params?: QueryParams;
  };
}

export interface GetActiveProductsQuery {
  type: "GetActiveProducts";
  payload: {
    params?: QueryParams;
  };
}

export interface SearchProductsQuery {
  type: "SearchProducts";
  payload: {
    query: string;
    params?: QueryParams;
  };
}

export interface GetProductReviewsQuery {
  type: "GetProductReviews";
  payload: {
    productId: string;
    params?: QueryParams;
  };
}

export interface GetProductAverageRatingQuery {
  type: "GetProductAverageRating";
  payload: { productId: string };
}

// ── Application Services ─────────────────────────────────────────

export interface ProductApplicationService {
  createProduct(command: CreateProductCommand): Promise<Product>;
  updateProduct(command: UpdateProductCommand): Promise<Product>;
  deleteProduct(command: DeleteProductCommand): Promise<void>;
  updateProductStock(command: UpdateProductStockCommand): Promise<Product>;
  activateProduct(command: ActivateProductCommand): Promise<void>;
  deactivateProduct(command: DeactivateProductCommand): Promise<void>;
  createReview(command: CreateProductReviewCommand): Promise<ProductReview>;

  getProduct(query: GetProductQuery): Promise<Product | null>;
  getProductsByVendor(query: GetProductsByVendorQuery): Promise<PaginatedResult<Product>>;
  getProductsByCategory(query: GetProductsByCategoryQuery): Promise<PaginatedResult<Product>>;
  getActiveProducts(query: GetActiveProductsQuery): Promise<PaginatedResult<Product>>;
  searchProducts(query: SearchProductsQuery): Promise<PaginatedResult<Product>>;
  getReviews(query: GetProductReviewsQuery): Promise<PaginatedResult<ProductReview>>;
  getAverageRating(query: GetProductAverageRatingQuery): Promise<number>;
}
