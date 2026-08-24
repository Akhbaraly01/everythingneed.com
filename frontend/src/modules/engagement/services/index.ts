import { resolve, TOKENS } from "@core/di/container";
import { eventBus } from "@core/events/EventBus";
import type { EngagementService } from "../domain";

export const engagementService: EngagementService = {
  async favorite(data) {
    const repo = resolve<any>(TOKENS.WishlistRepository);
    const favorite = await repo.addFavorite(data.userId, data.targetType, data.targetId);
    eventBus.emit("Favorited", { userId: data.userId, targetType: data.targetType, targetId: data.targetId, timestamp: new Date() });
    return favorite;
  },

  async unfavorite(userId, targetType, targetId) {
    const repo = resolve<any>(TOKENS.WishlistRepository);
    await repo.removeFavorite(userId, targetType, targetId);
    eventBus.emit("Unfavorited", { userId, targetType, targetId, timestamp: new Date() });
  },

  async isFavorited(userId, targetType, targetId) {
    const repo = resolve<any>(TOKENS.WishlistRepository);
    return repo.isFavorited(userId, targetType, targetId);
  },

  async recordView(data) {
    const repo = resolve<any>(TOKENS.WishlistRepository);
    const view = await repo.addRecentlyViewed(data.userId, data.targetType, data.targetId);
    eventBus.emit("Viewed", { userId: data.userId, targetType: data.targetType, targetId: data.targetId, timestamp: new Date() });
    return view;
  },

  async addToWishlist(data) {
    const repo = resolve<any>(TOKENS.WishlistRepository);
    const wishlist = await repo.addItem(data.wishlistId, data.targetId);
    eventBus.emit("AddedToWishlist", { wishlistId: data.wishlistId, userId: data.userId, targetId: data.targetId, timestamp: new Date() });
    return wishlist;
  },

  async removeFromWishlist(wishlistId, targetId) {
    const repo = resolve<any>(TOKENS.WishlistRepository);
    await repo.removeItem(wishlistId, targetId);
    eventBus.emit("RemovedFromWishlist", { wishlistId, userId: "", targetId, timestamp: new Date() });
  },

  async getFavorites(userId, targetType, params) {
    const repo = resolve<any>(TOKENS.WishlistRepository);
    return repo.getFavorites(userId, targetType, params);
  },

  async getRecentlyViewed(userId, targetType, params) {
    const repo = resolve<any>(TOKENS.WishlistRepository);
    return repo.getRecentlyViewed(userId, targetType, params);
  },

  async getWishlist(wishlistId) {
    const repo = resolve<any>(TOKENS.WishlistRepository);
    return repo.findById(wishlistId);
  },

  async getUserWishlists(userId) {
    const repo = resolve<any>(TOKENS.WishlistRepository);
    return repo.findByUserId(userId);
  },
};
