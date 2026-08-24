import { resolve, TOKENS } from "@core/di/container";
import { eventBus } from "@core/events/EventBus";
import type { ExpertService } from "../domain";

export const expertService: ExpertService = {
  async register(data) {
    const expert = { id: crypto.randomUUID(), ...data, isAvailable: true, createdAt: new Date(), updatedAt: new Date() } as any;
    eventBus.emit("ExpertRegistered", { expertId: expert.id, userId: data.userId, specialization: data.specialization });
    return expert;
  },

  async updateProfile(expertId, data) {
    return { id: expertId, ...data } as any;
  },

  async getAvailability(expertId) {
    return { id: "", expertId, isAvailable: true } as any;
  },

  async updateAvailability(expertId, data) {
    eventBus.emit("ExpertAvailabilityChanged", { expertId, isAvailable: data.isAvailable || true, timestamp: new Date() });
    return { id: "", expertId, ...data } as any;
  },

  async getById(expertId) {
    return null;
  },

  async getByUserId(userId) {
    return null;
  },

  async getBySpecialization(specialization, params) {
    return { items: [], total: 0 };
  },

  async search(query) {
    return [];
  },

  async addReview(data) {
    const review = { id: crypto.randomUUID(), ...data, createdAt: new Date(), updatedAt: new Date() } as any;
    eventBus.emit("ExpertReviewed", { expertId: data.expertId, reviewId: review.id, userId: data.userId, rating: data.rating });
    return review;
  },

  async getReviews(expertId, params) {
    const repo = resolve<any>(TOKENS.ExpertReviewRepository);
    return repo.findByExpertId(expertId, params);
  },

  async getAverageRating(expertId) {
    const repo = resolve<any>(TOKENS.ExpertReviewRepository);
    return repo.getAverageRating(expertId);
  },

  async addToWishlist(userId, expertId) {
    const repo = resolve<any>(TOKENS.ExpertWishlistRepository);
    await repo.add(userId, expertId);
    eventBus.emit("ExpertAddedToWishlist", { expertId, userId, timestamp: new Date() });
  },

  async removeFromWishlist(userId, expertId) {
    const repo = resolve<any>(TOKENS.ExpertWishlistRepository);
    await repo.remove(userId, expertId);
  },

  async getWishlist(userId) {
    const repo = resolve<any>(TOKENS.ExpertWishlistRepository);
    return repo.findByUserId(userId);
  },
};
