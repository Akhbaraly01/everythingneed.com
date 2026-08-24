/**
 * Engagement Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/Engagement/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { Favorite, RecentlyViewed, Wishlist } from "../domain";

// ── DTOs ─────────────────────────────────────────────────────────

export interface FavoriteDTO {
  userId: string;
  targetType: string;
  targetId: string;
}

export interface RecordViewDTO {
  userId: string;
  targetType: string;
  targetId: string;
}

export interface AddToWishlistDTO {
  userId: string;
  wishlistId: string;
  targetId: string;
}

// ── Commands ─────────────────────────────────────────────────────

export interface FavoriteCommand {
  type: "Favorite";
  payload: FavoriteDTO;
}

export interface UnfavoriteCommand {
  type: "Unfavorite";
  payload: {
    userId: string;
    targetType: string;
    targetId: string;
  };
}

export interface RecordViewCommand {
  type: "RecordView";
  payload: RecordViewDTO;
}

export interface AddToWishlistCommand {
  type: "AddToWishlist";
  payload: AddToWishlistDTO;
}

export interface RemoveFromWishlistCommand {
  type: "RemoveFromWishlist";
  payload: {
    wishlistId: string;
    targetId: string;
  };
}

export interface CreateWishlistCommand {
  type: "CreateWishlist";
  payload: {
    userId: string;
    name: string;
    description?: string;
    isPublic?: boolean;
  };
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetFavoritesQuery {
  type: "GetFavorites";
  payload: {
    userId: string;
    targetType?: string;
    params?: QueryParams;
  };
}

export interface GetRecentlyViewedQuery {
  type: "GetRecentlyViewed";
  payload: {
    userId: string;
    targetType?: string;
    params?: QueryParams;
  };
}

export interface GetWishlistQuery {
  type: "GetWishlist";
  payload: { wishlistId: string };
}

export interface GetUserWishlistsQuery {
  type: "GetUserWishlists";
  payload: { userId: string };
}

export interface IsFavoritedQuery {
  type: "IsFavorited";
  payload: {
    userId: string;
    targetType: string;
    targetId: string;
  };
}

// ── Application Services ─────────────────────────────────────────

export interface EngagementApplicationService {
  favorite(command: FavoriteCommand): Promise<Favorite>;
  unfavorite(command: UnfavoriteCommand): Promise<void>;
  recordView(command: RecordViewCommand): Promise<RecentlyViewed>;
  addToWishlist(command: AddToWishlistCommand): Promise<Wishlist>;
  removeFromWishlist(command: RemoveFromWishlistCommand): Promise<void>;
  createWishlist(command: CreateWishlistCommand): Promise<Wishlist>;

  getFavorites(query: GetFavoritesQuery): Promise<PaginatedResult<Favorite>>;
  getRecentlyViewed(query: GetRecentlyViewedQuery): Promise<PaginatedResult<RecentlyViewed>>;
  getWishlist(query: GetWishlistQuery): Promise<Wishlist | null>;
  getUserWishlists(query: GetUserWishlistsQuery): Promise<Wishlist[]>;
  isFavorited(query: IsFavoritedQuery): Promise<boolean>;
}
