/**
 * Experts Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/Experts/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface ExpertId {
  value: string;
}

export interface ExpertType {
  value: string;
}

export interface AvailabilityStatus {
  value: "available" | "busy" | "offline";
}

// ── Entities ─────────────────────────────────────────────────────

export interface Expert {
  id: string;
  userId: string;
  fullName: string;
  specialization: string;
  expertise: string[];
  bio?: string;
  avatarUrl?: string;
  hourlyRate?: number;
  isAvailable: boolean;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpertAvailability {
  id: string;
  expertId: string;
  expertType: string;
  currentStatus?: string;
  isAvailable?: boolean;
  statusMessage?: string;
  nextAvailableAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ExpertReview {
  id: string;
  expertId: string;
  userId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpertWishlist {
  id: string;
  userId: string;
  expertId: string;
  createdAt: Date;
}

// ── Domain Events ────────────────────────────────────────────────

export interface ExpertRegisteredEvent {
  type: "ExpertRegistered";
  expertId: string;
  userId: string;
  specialization: string;
  timestamp: Date;
}

export interface ExpertAvailabilityChangedEvent {
  type: "ExpertAvailabilityChanged";
  expertId: string;
  isAvailable: boolean;
  timestamp: Date;
}

export interface ExpertReviewedEvent {
  type: "ExpertReviewed";
  expertId: string;
  reviewId: string;
  userId: string;
  rating: number;
  timestamp: Date;
}

export interface ExpertAddedToWishlistEvent {
  type: "ExpertAddedToWishlist";
  expertId: string;
  userId: string;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface ExpertService {
  register(data: {
    userId: string;
    fullName: string;
    specialization: string;
    expertise: string[];
    bio?: string;
    avatarUrl?: string;
    hourlyRate?: number;
  }): Promise<Expert>;

  updateProfile(expertId: string, data: Partial<Expert>): Promise<Expert>;
  getAvailability(expertId: string): Promise<ExpertAvailability>;
  updateAvailability(expertId: string, data: Partial<ExpertAvailability>): Promise<ExpertAvailability>;

  getById(expertId: string): Promise<Expert | null>;
  getByUserId(userId: string): Promise<Expert | null>;
  getBySpecialization(specialization: string, params?: any): Promise<{ items: Expert[]; total: number }>;
  search(query: string): Promise<Expert[]>;

  addReview(data: {
    expertId: string;
    userId: string;
    rating: number;
    comment?: string;
  }): Promise<ExpertReview>;

  getReviews(expertId: string, params?: any): Promise<{ items: ExpertReview[]; total: number }>;
  getAverageRating(expertId: string): Promise<number>;

  addToWishlist(userId: string, expertId: string): Promise<void>;
  removeFromWishlist(userId: string, expertId: string): Promise<void>;
  getWishlist(userId: string): Promise<ExpertWishlist[]>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class ExpertNotFoundError extends DomainError {
  constructor(expertId: string) {
    super(`Expert ${expertId} not found`, "EXPERT_NOT_FOUND");
    this.name = "ExpertNotFoundError";
  }
}

export class ExpertNotAvailableError extends DomainError {
  constructor(expertId: string) {
    super(`Expert ${expertId} is not available`, "EXPERT_NOT_AVAILABLE");
    this.name = "ExpertNotAvailableError";
  }
}

export class DuplicateReviewError extends DomainError {
  constructor(userId: string, expertId: string) {
    super(`User ${userId} already reviewed expert ${expertId}`, "DUPLICATE_REVIEW");
    this.name = "DuplicateReviewError";
  }
}
