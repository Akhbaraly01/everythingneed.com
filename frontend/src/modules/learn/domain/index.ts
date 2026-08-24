/**
 * Learn Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/Learn/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface PostId {
  value: string;
}

export interface PostCategory {
  value: string;
}

export interface MediaType {
  value: "text" | "image" | "video" | "audio" | "document";
}

// ── Entities ─────────────────────────────────────────────────────

export interface LearnPost {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: string;
  mediaType?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  durationMinutes?: number;
  authorName?: string;
  authorAvatar?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isFeatured?: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LearnPostComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LearnPostLike {
  id: string;
  postId: string;
  userId: string;
  createdAt: Date;
}

export interface LearnDirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  postId?: string;
  isRead: boolean;
  createdAt: Date;
}

// ── Domain Events ────────────────────────────────────────────────

export interface PostCreatedEvent {
  type: "PostCreated";
  postId: string;
  userId: string;
  title: string;
  category: string;
  timestamp: Date;
}

export interface PostLikedEvent {
  type: "PostLiked";
  postId: string;
  userId: string;
  timestamp: Date;
}

export interface PostCommentedEvent {
  type: "PostCommented";
  postId: string;
  commentId: string;
  userId: string;
  timestamp: Date;
}

export interface PostSharedEvent {
  type: "PostShared";
  postId: string;
  userId: string;
  timestamp: Date;
}

export interface PostFeaturedEvent {
  type: "PostFeatured";
  postId: string;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface LearnService {
  createPost(data: {
    userId: string;
    title: string;
    content: string;
    category: string;
    mediaType?: string;
    mediaUrl?: string;
    thumbnailUrl?: string;
    videoUrl?: string;
    durationMinutes?: number;
  }): Promise<LearnPost>;

  updatePost(postId: string, data: Partial<LearnPost>): Promise<LearnPost>;
  deletePost(postId: string): Promise<void>;
  getPostById(postId: string): Promise<LearnPost | null>;
  getPostsByUserId(userId: string, params?: any): Promise<{ items: LearnPost[]; total: number }>;
  getPostsByCategory(category: string, params?: any): Promise<{ items: LearnPost[]; total: number }>;
  getFeaturedPosts(params?: any): Promise<{ items: LearnPost[]; total: number }>;
  searchPosts(query: string, params?: any): Promise<{ items: LearnPost[]; total: number }>;

  likePost(postId: string, userId: string): Promise<void>;
  unlikePost(postId: string, userId: string): Promise<void>;
  addComment(postId: string, userId: string, content: string): Promise<LearnPostComment>;
  getComments(postId: string, params?: any): Promise<{ items: LearnPostComment[]; total: number }>;

  sendDirectMessage(data: {
    senderId: string;
    receiverId: string;
    message: string;
    postId?: string;
  }): Promise<LearnDirectMessage>;
  getDirectMessages(userId: string, otherUserId: string, params?: any): Promise<{ items: LearnDirectMessage[]; total: number }>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class PostNotFoundError extends DomainError {
  constructor(postId: string) {
    super(`Post ${postId} not found`, "POST_NOT_FOUND");
    this.name = "PostNotFoundError";
  }
}

export class UnauthorizedPostEditError extends DomainError {
  constructor(userId: string, postId: string) {
    super(`User ${userId} is not authorized to edit post ${postId}`, "UNAUTHORIZED_POST_EDIT");
    this.name = "UnauthorizedPostEditError";
  }
}

export class DuplicateLikeError extends DomainError {
  constructor(userId: string, postId: string) {
    super(`User ${userId} already liked post ${postId}`, "DUPLICATE_LIKE");
    this.name = "DuplicateLikeError";
  }
}

export class PostNotPublishedError extends DomainError {
  constructor(postId: string) {
    super(`Post ${postId} is not published`, "POST_NOT_PUBLISHED");
    this.name = "PostNotPublishedError";
  }
}
