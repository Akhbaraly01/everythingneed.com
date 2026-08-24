/**
 * Checkout Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/Checkout/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface CartId {
  value: string;
}

export interface CartItemId {
  value: string;
}

export interface CouponCode {
  value: string;
}

export interface CouponType {
  value: "percentage" | "fixed" | "free_shipping";
}

export interface CartStatus {
  value: "active" | "checkout" | "completed" | "abandoned";
}

// ── Entities ─────────────────────────────────────────────────────

export interface Cart {
  id: string;
  userId: string;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
  couponCode?: string;
  couponDiscount?: number;
  notes?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  options?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  startsAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ── Domain Events ────────────────────────────────────────────────

export interface CartCreatedEvent {
  type: "CartCreated";
  cartId: string;
  userId: string;
  timestamp: Date;
}

export interface ItemAddedEvent {
  type: "ItemAdded";
  cartId: string;
  productId: string;
  quantity: number;
  timestamp: Date;
}

export interface ItemRemovedEvent {
  type: "ItemRemoved";
  cartId: string;
  productId: string;
  timestamp: Date;
}

export interface CouponAppliedEvent {
  type: "CouponApplied";
  cartId: string;
  couponCode: string;
  discount: number;
  timestamp: Date;
}

export interface CouponRemovedEvent {
  type: "CouponRemoved";
  cartId: string;
  couponCode: string;
  timestamp: Date;
}

export interface CheckoutStartedEvent {
  type: "CheckoutStarted";
  cartId: string;
  userId: string;
  total: number;
  timestamp: Date;
}

export interface CheckoutCompletedEvent {
  type: "CheckoutCompleted";
  cartId: string;
  userId: string;
  orderId?: string;
  total: number;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface CheckoutService {
  getCart(userId: string): Promise<Cart | null>;
  getCartById(cartId: string): Promise<Cart | null>;
  getCartItems(cartId: string): Promise<CartItem[]>;

  addToCart(userId: string, data: {
    productId: string;
    productName: string;
    productImage?: string;
    quantity: number;
    unitPrice: number;
    options?: Record<string, string>;
  }): Promise<CartItem>;

  removeFromCart(cartId: string, productId: string): Promise<void>;
  updateCartItemQuantity(cartId: string, productId: string, quantity: number): Promise<CartItem>;
  clearCart(cartId: string): Promise<void>;

  applyCoupon(cartId: string, couponCode: string): Promise<Cart>;
  removeCoupon(cartId: string): Promise<Cart>;

  beginCheckout(cartId: string): Promise<Cart>;
  completeCheckout(cartId: string): Promise<Cart>;

  validateCoupon(couponCode: string, cartTotal: number): Promise<Coupon>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class CartNotFoundError extends DomainError {
  constructor(cartId: string) {
    super(`Cart ${cartId} not found`, "CART_NOT_FOUND");
    this.name = "CartNotFoundError";
  }
}

export class CartItemNotFoundError extends DomainError {
  constructor(cartId: string, productId: string) {
    super(`Product ${productId} not found in cart ${cartId}`, "CART_ITEM_NOT_FOUND");
    this.name = "CartItemNotFoundError";
  }
}

export class CouponNotFoundError extends DomainError {
  constructor(code: string) {
    super(`Coupon "${code}" not found`, "COUPON_NOT_FOUND");
    this.name = "CouponNotFoundError";
  }
}

export class CouponExpiredError extends DomainError {
  constructor(code: string) {
    super(`Coupon "${code}" has expired`, "COUPON_EXPIRED");
    this.name = "CouponExpiredError";
  }
}

export class CouponUsageLimitExceededError extends DomainError {
  constructor(code: string) {
    super(`Coupon "${code}" usage limit exceeded`, "COUPON_USAGE_LIMIT_EXCEEDED");
    this.name = "CouponUsageLimitExceededError";
  }
}

export class CouponMinPurchaseNotMetError extends DomainError {
  constructor(code: string, minPurchase: number) {
    super(`Coupon "${code}" requires minimum purchase of ${minPurchase}`, "COUPON_MIN_PURCHASE_NOT_MET");
    this.name = "CouponMinPurchaseNotMetError";
  }
}

export class CartAlreadyCheckedOutError extends DomainError {
  constructor(cartId: string) {
    super(`Cart ${cartId} has already been checked out`, "CART_ALREADY_CHECKED_OUT");
    this.name = "CartAlreadyCheckedOutError";
  }
}

export class EmptyCartError extends DomainError {
  constructor(cartId: string) {
    super(`Cart ${cartId} is empty`, "EMPTY_CART");
    this.name = "EmptyCartError";
  }
}
