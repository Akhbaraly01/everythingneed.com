import { http } from "@/core/api/client";
import { eventBus } from "@core/events/EventBus";
import type { ReviewService } from "../domain";

export const reviewService: ReviewService = {
  async leaveReview(data) {
    const result: any = await http.post("/api/reviews", data);
    const review = result.data;
    eventBus.emit("ReviewLeft", { reviewId: review.id, userId: data.userId, targetType: data.targetType, targetId: data.targetId, rating: data.rating, timestamp: new Date() });
    return review;
  },

  async editReview(reviewId, userId, data) {
    const result: any = await http.put(`/api/reviews/${reviewId}`, data);
    eventBus.emit("ReviewEdited", { reviewId, userId, timestamp: new Date() });
    return result.data;
  },

  async flagReview(reviewId, reportedBy, reason) {
    await http.post(`/api/reviews/${reviewId}/flag`, { reason });
    eventBus.emit("ReviewFlagged", { reviewId, reportedBy, reason, timestamp: new Date() });
  },

  async replyToReview(reviewId, vendorId, reply) {
    await http.post(`/api/reviews/${reviewId}/reply`, { reply });
    eventBus.emit("ReviewReplied", { reviewId, vendorId, reply, timestamp: new Date() });
  },

  async voteReview(reviewId, userId, voteType) {
    await http.post(`/api/reviews/${reviewId}/vote`, { vote_type: voteType });
  },

  async getReviewById(reviewId) {
    const data: any = await http.get(`/api/reviews/${reviewId}`);
    return data.data || null;
  },

  async getReviewsByTarget(targetType, targetId, params) {
    const data: any = await http.get("/api/reviews", { params: { target_type: targetType, target_id: targetId, ...params } } as any);
    return { items: data.data || [], total: data.meta?.total || 0 };
  },

  async getReviewsByUser(userId, params) {
    const data: any = await http.get("/api/reviews", { params: { user_id: userId, ...params } } as any);
    return { items: data.data || [], total: data.meta?.total || 0 };
  },

  async getAverageRating(targetType, targetId) {
    const data: any = await http.get("/api/reviews/average", { params: { target_type: targetType, target_id: targetId } } as any);
    return data.data?.average || 0;
  },
};
