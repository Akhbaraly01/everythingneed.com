/**
 * Food Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/Food/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface RestaurantId {
  value: string;
}

export interface MenuItemId {
  value: string;
}

export interface FoodOrderId {
  value: string;
}

export interface OrderStatus {
  value: "pending" | "confirmed" | "preparing" | "ready" | "picked_up" | "delivered" | "cancelled";
}

export interface CuisineType {
  value: string;
}

// ── Entities ─────────────────────────────────────────────────────

export interface Restaurant {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  cuisineType?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  openingHours?: Record<string, { open: string; close: string; isClosed: boolean }>;
  deliveryFee?: number;
  minimumOrder?: number;
  estimatedDeliveryTime?: number;
  rating?: number;
  reviewsCount?: number;
  isActive: boolean;
  isFeatured?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  price: number;
  comparePrice?: number;
  imageUrl?: string;
  category: string;
  isAvailable: boolean;
  isFeatured?: boolean;
  spicyLevel?: number;
  preparationTime?: number;
  calories?: number;
  allergens?: string[];
  tags?: string[];
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FoodOrder {
  id: string;
  userId: string;
  restaurantId: string;
  status: string;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  currency: string;
  deliveryAddress?: string;
  specialInstructions?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  rating?: number;
  review?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FoodOrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
  options?: Record<string, string>;
  specialInstructions?: string;
}

// ── Domain Events ────────────────────────────────────────────────

export interface RestaurantCreatedEvent {
  type: "RestaurantCreated";
  restaurantId: string;
  ownerId: string;
  name: string;
  timestamp: Date;
}

export interface MenuItemCreatedEvent {
  type: "MenuItemCreated";
  menuItemId: string;
  restaurantId: string;
  name: string;
  price: number;
  timestamp: Date;
}

export interface MenuItemUpdatedEvent {
  type: "MenuItemUpdated";
  menuItemId: string;
  changes: Partial<MenuItem>;
  timestamp: Date;
}

export interface FoodOrderPlacedEvent {
  type: "FoodOrderPlaced";
  orderId: string;
  userId: string;
  restaurantId: string;
  total: number;
  timestamp: Date;
}

export interface FoodOrderStatusChangedEvent {
  type: "FoodOrderStatusChanged";
  orderId: string;
  previousStatus: string;
  newStatus: string;
  timestamp: Date;
}

export interface FoodOrderDeliveredEvent {
  type: "FoodOrderDelivered";
  orderId: string;
  deliveredAt: Date;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface FoodService {
  createRestaurant(data: {
    ownerId: string;
    name: string;
    description?: string;
    cuisineType?: string;
    address?: string;
    city?: string;
    phone?: string;
    email?: string;
    deliveryFee?: number;
    minimumOrder?: number;
    estimatedDeliveryTime?: number;
  }): Promise<Restaurant>;

  updateRestaurant(restaurantId: string, data: Partial<Restaurant>): Promise<Restaurant>;
  getRestaurantById(restaurantId: string): Promise<Restaurant | null>;
  getRestaurantBySlug(slug: string): Promise<Restaurant | null>;
  getRestaurantsByOwner(ownerId: string): Promise<Restaurant[]>;
  getActiveRestaurants(): Promise<Restaurant[]>;
  getFeaturedRestaurants(): Promise<Restaurant[]>;

  createMenuItem(restaurantId: string, data: {
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
    category: string;
    spicyLevel?: number;
    preparationTime?: number;
    calories?: number;
    allergens?: string[];
    tags?: string[];
  }): Promise<MenuItem>;

  updateMenuItem(menuItemId: string, data: Partial<MenuItem>): Promise<MenuItem>;
  toggleMenuItemAvailability(menuItemId: string): Promise<void>;
  getMenuItemsByRestaurant(restaurantId: string): Promise<MenuItem[]>;
  getMenuItemsByCategory(restaurantId: string, category: string): Promise<MenuItem[]>;

  placeFoodOrder(userId: string, data: {
    restaurantId: string;
    items: Array<{
      menuItemId: string;
      quantity: number;
      options?: Record<string, string>;
      specialInstructions?: string;
    }>;
    deliveryAddress?: string;
    specialInstructions?: string;
  }): Promise<FoodOrder>;

  updateFoodOrderStatus(orderId: string, status: string): Promise<void>;
  getFoodOrderById(orderId: string): Promise<FoodOrder | null>;
  getFoodOrdersByUser(userId: string): Promise<FoodOrder[]>;
  getFoodOrdersByRestaurant(restaurantId: string): Promise<FoodOrder[]>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class RestaurantNotFoundError extends DomainError {
  constructor(restaurantId: string) {
    super(`Restaurant ${restaurantId} not found`, "RESTAURANT_NOT_FOUND");
    this.name = "RestaurantNotFoundError";
  }
}

export class MenuItemNotFoundError extends DomainError {
  constructor(menuItemId: string) {
    super(`Menu item ${menuItemId} not found`, "MENU_ITEM_NOT_FOUND");
    this.name = "MenuItemNotFoundError";
  }
}

export class FoodOrderNotFoundError extends DomainError {
  constructor(orderId: string) {
    super(`Food order ${orderId} not found`, "FOOD_ORDER_NOT_FOUND");
    this.name = "FoodOrderNotFoundError";
  }
}

export class MenuItemNotAvailableError extends DomainError {
  constructor(menuItemId: string) {
    super(`Menu item ${menuItemId} is not available`, "MENU_ITEM_NOT_AVAILABLE");
    this.name = "MenuItemNotAvailableError";
  }
}

export class RestaurantClosedError extends DomainError {
  constructor(restaurantId: string) {
    super(`Restaurant ${restaurantId} is currently closed`, "RESTAURANT_CLOSED");
    this.name = "RestaurantClosedError";
  }
}

export class MinimumOrderNotMetError extends DomainError {
  constructor(restaurantId: string, minimum: number, current: number) {
    super(`Minimum order of ${minimum} not met for restaurant ${restaurantId}: current ${current}`, "MINIMUM_ORDER_NOT_MET");
    this.name = "MinimumOrderNotMetError";
  }
}

export class InvalidOrderStatusTransitionError extends DomainError {
  constructor(orderId: string, from: string, to: string) {
    super(`Cannot transition order ${orderId} from ${from} to ${to}`, "INVALID_ORDER_STATUS_TRANSITION");
    this.name = "InvalidOrderStatusTransitionError";
  }
}
