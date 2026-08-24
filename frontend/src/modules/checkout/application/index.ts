/**
 * Checkout Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/Checkout/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { Cart, CartItem, Coupon } from "../domain";

// ── DTOs ─────────────────────────────────────────────────────────

export interface AddToCartDTO {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  options?: Record<string, string>;
}

export interface RemoveFromCartDTO {
  cartId: string;
  productId: string;
}

export interface UpdateCartItemDTO {
  cartId: string;
  productId: string;
  quantity: number;
}

export interface ApplyCouponDTO {
  cartId: string;
  couponCode: string;
}

// ── Commands ─────────────────────────────────────────────────────

export interface AddToCartCommand {
  type: "AddToCart";
  payload: {
    userId: string;
    data: AddToCartDTO;
  };
}

export interface RemoveFromCartCommand {
  type: "RemoveFromCart";
  payload: RemoveFromCartDTO;
}

export interface UpdateCartItemQuantityCommand {
  type: "UpdateCartItemQuantity";
  payload: UpdateCartItemDTO;
}

export interface ClearCartCommand {
  type: "ClearCart";
  payload: { cartId: string };
}

export interface ApplyCouponCommand {
  type: "ApplyCoupon";
  payload: ApplyCouponDTO;
}

export interface RemoveCouponCommand {
  type: "RemoveCoupon";
  payload: { cartId: string };
}

export interface BeginCheckoutCommand {
  type: "BeginCheckout";
  payload: { cartId: string };
}

export interface CompleteCheckoutCommand {
  type: "CompleteCheckout";
  payload: { cartId: string };
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetCartQuery {
  type: "GetCart";
  payload: { userId: string };
}

export interface GetCartByIdQuery {
  type: "GetCartById";
  payload: { cartId: string };
}

export interface GetCartItemsQuery {
  type: "GetCartItems";
  payload: { cartId: string };
}

export interface ValidateCouponQuery {
  type: "ValidateCoupon";
  payload: {
    couponCode: string;
    cartTotal: number;
  };
}

// ── Application Services ─────────────────────────────────────────

export interface CheckoutApplicationService {
  addToCart(command: AddToCartCommand): Promise<CartItem>;
  removeFromCart(command: RemoveFromCartCommand): Promise<void>;
  updateCartItemQuantity(command: UpdateCartItemQuantityCommand): Promise<CartItem>;
  clearCart(command: ClearCartCommand): Promise<void>;
  applyCoupon(command: ApplyCouponCommand): Promise<Cart>;
  removeCoupon(command: RemoveCouponCommand): Promise<Cart>;
  beginCheckout(command: BeginCheckoutCommand): Promise<Cart>;
  completeCheckout(command: CompleteCheckoutCommand): Promise<Cart>;

  getCart(query: GetCartQuery): Promise<Cart | null>;
  getCartById(query: GetCartByIdQuery): Promise<Cart | null>;
  getCartItems(query: GetCartItemsQuery): Promise<CartItem[]>;
  validateCoupon(query: ValidateCouponQuery): Promise<Coupon>;
}
