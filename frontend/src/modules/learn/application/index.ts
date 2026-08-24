/**
 * Learn Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/Learn/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { LearnPost, LearnPostComment, LearnDirectMessage } from "../domain";

// ── DTOs ─────────────────────────────────────────────────────────

export interface CreatePostDTO {
  userId: string;
  title: string;
  content: string;
  category: string;
  mediaType?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  durationMinutes?: number;
}

export interface UpdatePostDTO {
  title?: string;
  content?: string;
  category?: string;
  mediaType?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  durationMinutes?: number;
}

export interface SendDirectMessageDTO {
  senderId: string;
  receiverId: string;
  message: string;
  postId?: string;
}

// ── Commands ─────────────────────────────────────────────────────

export interface CreatePostCommand {
  type: "CreatePost";
  payload: CreatePostDTO;
}

export interface UpdatePostCommand {
  type: "UpdatePost";
  payload: {
    postId: string;
    data: UpdatePostDTO;
  };
}

export interface DeletePostCommand {
  type: "DeletePost";
  payload: { postId: string };
}

export interface LikePostCommand {
  type: "LikePost";
  payload: {
    postId: string;
    userId: string;
  };
}

export interface UnlikePostCommand {
  type: "UnlikePost";
  payload: {
    postId: string;
    userId: string;
  };
}

export interface AddCommentCommand {
  type: "AddComment";
  payload: {
    postId: string;
    userId: string;
    content: string;
  };
}

export interface SendDirectMessageCommand {
  type: "SendDirectMessage";
  payload: SendDirectMessageDTO;
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetPostQuery {
  type: "GetPost";
  payload: { postId: string };
}

export interface GetUserPostsQuery {
  type: "GetUserPosts";
  payload: {
    userId: string;
    params?: QueryParams;
  };
}

export interface GetCategoryPostsQuery {
  type: "GetCategoryPosts";
  payload: {
    category: string;
    params?: QueryParams;
  };
}

export interface GetFeaturedPostsQuery {
  type: "GetFeaturedPosts";
  payload: {
    params?: QueryParams;
  };
}

export interface SearchPostsQuery {
  type: "SearchPosts";
  payload: {
    query: string;
    params?: QueryParams;
  };
}

export interface GetCommentsQuery {
  type: "GetComments";
  payload: {
    postId: string;
    params?: QueryParams;
  };
}

export interface GetDirectMessagesQuery {
  type: "GetDirectMessages";
  payload: {
    userId: string;
    otherUserId: string;
    params?: QueryParams;
  };
}

// ── Application Services ─────────────────────────────────────────

export interface LearnApplicationService {
  createPost(command: CreatePostCommand): Promise<LearnPost>;
  updatePost(command: UpdatePostCommand): Promise<LearnPost>;
  deletePost(command: DeletePostCommand): Promise<void>;
  likePost(command: LikePostCommand): Promise<void>;
  unlikePost(command: UnlikePostCommand): Promise<void>;
  addComment(command: AddCommentCommand): Promise<LearnPostComment>;
  sendDirectMessage(command: SendDirectMessageCommand): Promise<LearnDirectMessage>;

  getPost(query: GetPostQuery): Promise<LearnPost | null>;
  getUserPosts(query: GetUserPostsQuery): Promise<PaginatedResult<LearnPost>>;
  getCategoryPosts(query: GetCategoryPostsQuery): Promise<PaginatedResult<LearnPost>>;
  getFeaturedPosts(query: GetFeaturedPostsQuery): Promise<PaginatedResult<LearnPost>>;
  searchPosts(query: SearchPostsQuery): Promise<PaginatedResult<LearnPost>>;
  getComments(query: GetCommentsQuery): Promise<PaginatedResult<LearnPostComment>>;
  getDirectMessages(query: GetDirectMessagesQuery): Promise<PaginatedResult<LearnDirectMessage>>;
}
