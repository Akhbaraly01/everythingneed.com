/**
 * Reviews Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/Reviews/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface ReviewId {
  value: string;
}

export interface ReviewVoteId {
  value: string;
}

export interface ReviewStatus {
  value: "published" | "pending" | "flagged" | "removed";
}

export interface VoteType {
  value: "helpful" | "unhelpful" | "report";
}

export interface ReviewTargetType {
  value: "product" | "service" | "vendor" | "hotel" | "restaurant" | "expert";
}

// ── Entities ─────────────────────────────────────────────────────

export interface Review {
  id: string;
  userId: string;
  targetType: string;
  targetId: string;
  orderId?: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  status: string;
  helpfulCount: number;
  unhelpfulCount: number;
  reportCount: number;
  vendorReply?: string;
  vendorRepliedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewVote {
  id: string;
  reviewId: string;
  userId: string;
  voteType: string;
  createdAt: Date;
}

// ── Domain Events ────────────────────────────────────────────────

export interface ReviewLeftEvent {
  type: "ReviewLeft";
  reviewId: string;
  userId: string;
  targetType: string;
  targetId: string;
  rating: number;
  timestamp: Date;
}

export interface ReviewEditedEvent {
  type: "ReviewEdited";
  reviewId: string;
  userId: string;
  timestamp: Date;
}

export interface ReviewFlaggedEvent {
  type: "ReviewFlagged";
  reviewId: string;
  reportedBy: string;
  reason?: string;
  timestamp: Date;
}

export interface ReviewRepliedEvent {
  type: "ReviewReplied";
  reviewId: string;
  vendorId: string;
  reply: string;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface ReviewService {
  leaveReview(data: {
    userId: string;
    targetType: string;
    targetId: string;
    orderId?: string;
    rating: number;
    title?: string;
    comment?: string;
    images?: string[];
  }): Promise<Review>;

  editReview(reviewId: string, userId: string, data: {
    rating?: number;
    title?: string;
    comment?: string;
    images?: string[];
  }): Promise<Review>;

  flagReview(reviewId: string, reportedBy: string, reason?: string): Promise<void>;
  replyToReview(reviewId: string, vendorId: string, reply: string): Promise<void>;
  voteReview(reviewId: string, userId: string, voteType: string): Promise<void>;

  getReviewById(reviewId: string): Promise<Review | null>;
  getReviewsByTarget(targetType: string, targetId: string, params?: any): Promise<{ items: Review[]; total: number }>;
  getReviewsByUser(userId: string, params?: any): Promise<{ items: Review[]; total: number }>;
  getAverageRating(targetType: string, targetId: string): Promise<number>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class ReviewNotFoundError extends DomainError {
  constructor(reviewId: string) {
    super(`Review ${reviewId} not found`, "REVIEW_NOT_FOUND");
    this.name = "ReviewNotFoundError";
  }
}

export class DuplicateReviewError extends DomainError {
  constructor(userId: string, targetType: string, targetId: string) {
    super(`User ${userId} has already reviewed ${targetType} ${targetId}`, "DUPLICATE_REVIEW");
    this.name = "DuplicateReviewError";
  }
}

export class ReviewNotEditableError extends DomainError {
  constructor(reviewId: string) {
    super(`Review ${reviewId} is no longer editable`, "REVIEW_NOT_EDITABLE");
    this.name = "ReviewNotEditableError";
  }
}

export class InvalidRatingError extends DomainError {
  constructor(rating: number) {
    super(`Invalid rating: ${rating}. Must be between 1 and 5`, "INVALID_RATING");
    this.name = "InvalidRatingError";
  }
}
