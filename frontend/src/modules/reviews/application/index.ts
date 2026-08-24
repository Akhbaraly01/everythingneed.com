/**
 * Reviews Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/Reviews/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { Review, ReviewVote } from "../domain";

// ── DTOs ─────────────────────────────────────────────────────────

export interface LeaveReviewDTO {
  userId: string;
  targetType: string;
  targetId: string;
  orderId?: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
}

export interface EditReviewDTO {
  rating?: number;
  title?: string;
  comment?: string;
  images?: string[];
}

// ── Commands ─────────────────────────────────────────────────────

export interface LeaveReviewCommand {
  type: "LeaveReview";
  payload: LeaveReviewDTO;
}

export interface EditReviewCommand {
  type: "EditReview";
  payload: {
    reviewId: string;
    userId: string;
    data: EditReviewDTO;
  };
}

export interface FlagReviewCommand {
  type: "FlagReview";
  payload: {
    reviewId: string;
    reportedBy: string;
    reason?: string;
  };
}

export interface ReplyToReviewCommand {
  type: "ReplyToReview";
  payload: {
    reviewId: string;
    vendorId: string;
    reply: string;
  };
}

export interface VoteReviewCommand {
  type: "VoteReview";
  payload: {
    reviewId: string;
    userId: string;
    voteType: string;
  };
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetReviewQuery {
  type: "GetReview";
  payload: { reviewId: string };
}

export interface GetProductReviewsQuery {
  type: "GetProductReviews";
  payload: {
    targetType: string;
    targetId: string;
    params?: QueryParams;
  };
}

export interface GetUserReviewsQuery {
  type: "GetUserReviews";
  payload: {
    userId: string;
    params?: QueryParams;
  };
}

export interface GetAverageRatingQuery {
  type: "GetAverageRating";
  payload: {
    targetType: string;
    targetId: string;
  };
}

// ── Application Services ─────────────────────────────────────────

export interface ReviewApplicationService {
  leaveReview(command: LeaveReviewCommand): Promise<Review>;
  editReview(command: EditReviewCommand): Promise<Review>;
  flagReview(command: FlagReviewCommand): Promise<void>;
  replyToReview(command: ReplyToReviewCommand): Promise<void>;
  voteReview(command: VoteReviewCommand): Promise<void>;

  getReview(query: GetReviewQuery): Promise<Review | null>;
  getProductReviews(query: GetProductReviewsQuery): Promise<PaginatedResult<Review>>;
  getUserReviews(query: GetUserReviewsQuery): Promise<PaginatedResult<Review>>;
  getAverageRating(query: GetAverageRatingQuery): Promise<number>;
}
