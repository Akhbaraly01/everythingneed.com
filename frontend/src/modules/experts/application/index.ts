/**
 * Experts Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/Experts/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { Expert, ExpertAvailability, ExpertReview, ExpertWishlist } from "../domain";

// ── DTOs ─────────────────────────────────────────────────────────

export interface RegisterExpertDTO {
  userId: string;
  fullName: string;
  specialization: string;
  expertise: string[];
  bio?: string;
  avatarUrl?: string;
  hourlyRate?: number;
}

export interface UpdateExpertProfileDTO {
  fullName?: string;
  specialization?: string;
  expertise?: string[];
  bio?: string;
  avatarUrl?: string;
  hourlyRate?: number;
}

export interface UpdateExpertAvailabilityDTO {
  currentStatus?: string;
  isAvailable?: boolean;
  statusMessage?: string;
  nextAvailableAt?: Date;
}

export interface AddExpertReviewDTO {
  expertId: string;
  userId: string;
  rating: number;
  comment?: string;
}

// ── Commands ─────────────────────────────────────────────────────

export interface RegisterExpertCommand {
  type: "RegisterExpert";
  payload: RegisterExpertDTO;
}

export interface UpdateExpertProfileCommand {
  type: "UpdateExpertProfile";
  payload: {
    expertId: string;
    data: UpdateExpertProfileDTO;
  };
}

export interface UpdateExpertAvailabilityCommand {
  type: "UpdateExpertAvailability";
  payload: {
    expertId: string;
    data: UpdateExpertAvailabilityDTO;
  };
}

export interface AddExpertReviewCommand {
  type: "AddExpertReview";
  payload: AddExpertReviewDTO;
}

export interface AddToWishlistCommand {
  type: "AddToWishlist";
  payload: {
    userId: string;
    expertId: string;
  };
}

export interface RemoveFromWishlistCommand {
  type: "RemoveFromWishlist";
  payload: {
    userId: string;
    expertId: string;
  };
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetExpertQuery {
  type: "GetExpert";
  payload: { expertId: string };
}

export interface GetExpertByUserQuery {
  type: "GetExpertByUser";
  payload: { userId: string };
}

export interface GetExpertsBySpecializationQuery {
  type: "GetExpertsBySpecialization";
  payload: {
    specialization: string;
    params?: QueryParams;
  };
}

export interface SearchExpertsQuery {
  type: "SearchExperts";
  payload: { query: string };
}

export interface GetExpertReviewsQuery {
  type: "GetExpertReviews";
  payload: {
    expertId: string;
    params?: QueryParams;
  };
}

export interface GetExpertAverageRatingQuery {
  type: "GetExpertAverageRating";
  payload: { expertId: string };
}

export interface GetWishlistQuery {
  type: "GetWishlist";
  payload: { userId: string };
}

// ── Application Services ─────────────────────────────────────────

export interface ExpertApplicationService {
  registerExpert(command: RegisterExpertCommand): Promise<Expert>;
  updateExpertProfile(command: UpdateExpertProfileCommand): Promise<Expert>;
  updateExpertAvailability(command: UpdateExpertAvailabilityCommand): Promise<ExpertAvailability>;
  addReview(command: AddExpertReviewCommand): Promise<ExpertReview>;
  addToWishlist(command: AddToWishlistCommand): Promise<void>;
  removeFromWishlist(command: RemoveFromWishlistCommand): Promise<void>;

  getExpert(query: GetExpertQuery): Promise<Expert | null>;
  getExpertByUser(query: GetExpertByUserQuery): Promise<Expert | null>;
  getExpertsBySpecialization(query: GetExpertsBySpecializationQuery): Promise<PaginatedResult<Expert>>;
  searchExperts(query: SearchExpertsQuery): Promise<Expert[]>;
  getReviews(query: GetExpertReviewsQuery): Promise<PaginatedResult<ExpertReview>>;
  getAverageRating(query: GetExpertAverageRatingQuery): Promise<number>;
  getWishlist(query: GetWishlistQuery): Promise<ExpertWishlist[]>;
}
