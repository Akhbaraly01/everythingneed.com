/**
 * Food Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/Food/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { Restaurant, MenuItem, FoodOrder, FoodOrderItem } from "../domain";

// ── DTOs ─────────────────────────────────────────────────────────

export interface CreateRestaurantDTO {
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
}

export interface UpdateRestaurantDTO {
  name?: string;
  description?: string;
  cuisineType?: string;
  logoUrl?: string;
  bannerUrl?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  deliveryFee?: number;
  minimumOrder?: number;
  estimatedDeliveryTime?: number;
  isActive?: boolean;
}

export interface CreateMenuItemDTO {
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
}

export interface PlaceFoodOrderDTO {
  restaurantId: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    options?: Record<string, string>;
    specialInstructions?: string;
  }>;
  deliveryAddress?: string;
  specialInstructions?: string;
}

// ── Commands ─────────────────────────────────────────────────────

export interface CreateRestaurantCommand {
  type: "CreateRestaurant";
  payload: CreateRestaurantDTO;
}

export interface UpdateRestaurantCommand {
  type: "UpdateRestaurant";
  payload: {
    restaurantId: string;
    data: UpdateRestaurantDTO;
  };
}

export interface CreateMenuItemCommand {
  type: "CreateMenuItem";
  payload: {
    restaurantId: string;
    data: CreateMenuItemDTO;
  };
}

export interface UpdateMenuItemCommand {
  type: "UpdateMenuItem";
  payload: {
    menuItemId: string;
    data: Partial<MenuItem>;
  };
}

export interface ToggleMenuItemAvailabilityCommand {
  type: "ToggleMenuItemAvailability";
  payload: { menuItemId: string };
}

export interface PlaceFoodOrderCommand {
  type: "PlaceFoodOrder";
  payload: {
    userId: string;
    data: PlaceFoodOrderDTO;
  };
}

export interface UpdateFoodOrderStatusCommand {
  type: "UpdateFoodOrderStatus";
  payload: {
    orderId: string;
    status: string;
  };
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetRestaurantQuery {
  type: "GetRestaurant";
  payload: { restaurantId: string };
}

export interface GetRestaurantBySlugQuery {
  type: "GetRestaurantBySlug";
  payload: { slug: string };
}

export interface GetRestaurantsByOwnerQuery {
  type: "GetRestaurantsByOwner";
  payload: { ownerId: string };
}

export interface GetActiveRestaurantsQuery {
  type: "GetActiveRestaurants";
  payload: { params?: QueryParams };
}

export interface GetFeaturedRestaurantsQuery {
  type: "GetFeaturedRestaurants";
  payload: { params?: QueryParams };
}

export interface GetMenuItemsQuery {
  type: "GetMenuItems";
  payload: { restaurantId: string };
}

export interface GetMenuItemsByCategoryQuery {
  type: "GetMenuItemsByCategory";
  payload: {
    restaurantId: string;
    category: string;
  };
}

export interface GetFoodOrderQuery {
  type: "GetFoodOrder";
  payload: { orderId: string };
}

export interface GetFoodOrdersByUserQuery {
  type: "GetFoodOrdersByUser";
  payload: {
    userId: string;
    params?: QueryParams;
  };
}

export interface GetFoodOrdersByRestaurantQuery {
  type: "GetFoodOrdersByRestaurant";
  payload: {
    restaurantId: string;
    params?: QueryParams;
  };
}

// ── Application Services ─────────────────────────────────────────

export interface FoodApplicationService {
  createRestaurant(command: CreateRestaurantCommand): Promise<Restaurant>;
  updateRestaurant(command: UpdateRestaurantCommand): Promise<Restaurant>;
  createMenuItem(command: CreateMenuItemCommand): Promise<MenuItem>;
  updateMenuItem(command: UpdateMenuItemCommand): Promise<MenuItem>;
  toggleMenuItemAvailability(command: ToggleMenuItemAvailabilityCommand): Promise<void>;
  placeFoodOrder(command: PlaceFoodOrderCommand): Promise<FoodOrder>;
  updateFoodOrderStatus(command: UpdateFoodOrderStatusCommand): Promise<void>;

  getRestaurant(query: GetRestaurantQuery): Promise<Restaurant | null>;
  getRestaurantBySlug(query: GetRestaurantBySlugQuery): Promise<Restaurant | null>;
  getRestaurantsByOwner(query: GetRestaurantsByOwnerQuery): Promise<Restaurant[]>;
  getActiveRestaurants(query: GetActiveRestaurantsQuery): Promise<PaginatedResult<Restaurant>>;
  getFeaturedRestaurants(query: GetFeaturedRestaurantsQuery): Promise<PaginatedResult<Restaurant>>;
  getMenuItems(query: GetMenuItemsQuery): Promise<MenuItem[]>;
  getMenuItemsByCategory(query: GetMenuItemsByCategoryQuery): Promise<MenuItem[]>;
  getFoodOrder(query: GetFoodOrderQuery): Promise<FoodOrder | null>;
  getFoodOrdersByUser(query: GetFoodOrdersByUserQuery): Promise<PaginatedResult<FoodOrder>>;
  getFoodOrdersByRestaurant(query: GetFoodOrdersByRestaurantQuery): Promise<PaginatedResult<FoodOrder>>;
}
