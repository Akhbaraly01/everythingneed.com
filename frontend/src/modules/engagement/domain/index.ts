/**
 * Engagement Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/Engagement/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface FavoriteId {
  value: string;
}

export interface RecentlyViewedId {
  value: string;
}

export interface WishlistId {
  value: string;
}

export interface WishlistItem {
  value: string;
}

export interface TargetType {
  value: "product" | "service" | "vendor" | "hotel" | "listing" | "course" | "expert";
}

// ── Entities ─────────────────────────────────────────────────────

export interface Favorite {
  id: string;
  userId: string;
  targetType: string;
  targetId: string;
  createdAt: Date;
}

export interface RecentlyViewed {
  id: string;
  userId: string;
  targetType: string;
  targetId: string;
  viewedAt: Date;
}

export interface Wishlist {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  items: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ── Domain Events ────────────────────────────────────────────────

export interface FavoritedEvent {
  type: "Favorited";
  userId: string;
  targetType: string;
  targetId: string;
  timestamp: Date;
}

export interface UnfavoritedEvent {
  type: "Unfavorited";
  userId: string;
  targetType: string;
  targetId: string;
  timestamp: Date;
}

export interface ViewedEvent {
  type: "Viewed";
  userId: string;
  targetType: string;
  targetId: string;
  timestamp: Date;
}

export interface AddedToWishlistEvent {
  type: "AddedToWishlist";
  wishlistId: string;
  userId: string;
  targetId: string;
  timestamp: Date;
}

export interface RemovedFromWishlistEvent {
  type: "RemovedFromWishlist";
  wishlistId: string;
  userId: string;
  targetId: string;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface EngagementService {
  favorite(data: {
    userId: string;
    targetType: string;
    targetId: string;
  }): Promise<Favorite>;

  unfavorite(userId: string, targetType: string, targetId: string): Promise<void>;
  isFavorited(userId: string, targetType: string, targetId: string): Promise<boolean>;

  recordView(data: {
    userId: string;
    targetType: string;
    targetId: string;
  }): Promise<RecentlyViewed>;

  addToWishlist(data: {
    userId: string;
    wishlistId: string;
    targetId: string;
  }): Promise<Wishlist>;

  removeFromWishlist(wishlistId: string, targetId: string): Promise<void>;

  getFavorites(userId: string, targetType?: string, params?: any): Promise<{ items: Favorite[]; total: number }>;
  getRecentlyViewed(userId: string, targetType?: string, params?: any): Promise<{ items: RecentlyViewed[]; total: number }>;
  getWishlist(wishlistId: string): Promise<Wishlist | null>;
  getUserWishlists(userId: string): Promise<Wishlist[]>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class FavoriteNotFoundError extends DomainError {
  constructor(userId: string, targetType: string, targetId: string) {
    super(`Favorite not found for user ${userId} on ${targetType} ${targetId}`, "FAVORITE_NOT_FOUND");
    this.name = "FavoriteNotFoundError";
  }
}

export class AlreadyFavoritedError extends DomainError {
  constructor(userId: string, targetType: string, targetId: string) {
    super(`User ${userId} has already favorited ${targetType} ${targetId}`, "ALREADY_FAVORITED");
    this.name = "AlreadyFavoritedError";
  }
}

export class WishlistNotFoundError extends DomainError {
  constructor(wishlistId: string) {
    super(`Wishlist ${wishlistId} not found`, "WISHLIST_NOT_FOUND");
    this.name = "WishlistNotFoundError";
  }
}

export class ItemAlreadyInWishlistError extends DomainError {
  constructor(wishlistId: string, targetId: string) {
    super(`Item ${targetId} is already in wishlist ${wishlistId}`, "ITEM_ALREADY_IN_WISHLIST");
    this.name = "ItemAlreadyInWishlistError";
  }
}
