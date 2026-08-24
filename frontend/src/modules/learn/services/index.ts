import { resolve, TOKENS } from "@core/di/container";
import { eventBus } from "@core/events/EventBus";
import type {
  LearnPostRepository,
  LearnPostCommentRepository,
  LearnPostLikeRepository,
  LearnDirectMessageRepository,
} from "@core/repositories";
import type { LearnService } from "../domain";

export const learnService: LearnService = {
  async createPost(data) {
    const post = { id: crypto.randomUUID(), ...data, likesCount: 0, commentsCount: 0, sharesCount: 0, status: "published", createdAt: new Date(), updatedAt: new Date() } as any;
    eventBus.emit("PostCreated", { postId: post.id, userId: data.userId, title: data.title, category: data.category });
    return post;
  },

  async updatePost(postId, data) {
    return { id: postId, ...data } as any;
  },

  async deletePost(postId) {
    return;
  },

  async getPostById(postId) {
    const repo = resolve<LearnPostRepository>(TOKENS.LearnPostRepository);
    return (await repo.findById(postId)) as any;
  },

  async getPostsByUserId(userId, params) {
    const repo = resolve<LearnPostRepository>(TOKENS.LearnPostRepository);
    return (await repo.findByUserId(userId, params)) as any;
  },

  async getPostsByCategory(category, params) {
    const repo = resolve<LearnPostRepository>(TOKENS.LearnPostRepository);
    return (await repo.findByCategory(category, params)) as any;
  },

  async getFeaturedPosts(params) {
    const repo = resolve<LearnPostRepository>(TOKENS.LearnPostRepository);
    return (await repo.findFeatured(params)) as any;
  },

  async searchPosts(query, params) {
    const repo = resolve<LearnPostRepository>(TOKENS.LearnPostRepository);
    return (await repo.search(query, params)) as any;
  },

  async likePost(postId, userId) {
    const repo = resolve<LearnPostLikeRepository>(TOKENS.LearnPostLikeRepository);
    const existing = await repo.findByUserAndPost(userId, postId);
    if (!existing) {
      await repo.create({ post_id: postId, user_id: userId });
    }
    eventBus.emit("PostLiked", { postId, userId });
  },

  async unlikePost(postId, userId) {
    const repo = resolve<LearnPostLikeRepository>(TOKENS.LearnPostLikeRepository);
    const existing = await repo.findByUserAndPost(userId, postId);
    if (existing) {
      await repo.delete(existing.id);
    }
  },

  async addComment(postId, userId, content) {
    const repo = resolve<LearnPostCommentRepository>(TOKENS.LearnPostCommentRepository);
    const comment = (await repo.create({ post_id: postId, user_id: userId, content } as any)) as any;
    eventBus.emit("PostCommented", { postId, commentId: comment.id, userId });
    return comment;
  },

  async getComments(postId, params) {
    const repo = resolve<LearnPostCommentRepository>(TOKENS.LearnPostCommentRepository);
    return (await repo.findByPostId(postId, params)) as any;
  },

  async sendDirectMessage(data) {
    const repo = resolve<LearnDirectMessageRepository>(TOKENS.LearnDirectMessageRepository);
    const message = (await repo.create({ ...data, is_read: false } as any)) as any;
    return message;
  },

  async getDirectMessages(userId, otherUserId, params) {
    const repo = resolve<LearnDirectMessageRepository>(TOKENS.LearnDirectMessageRepository);
    return (await repo.findByUserPair(userId, otherUserId, params)) as any;
  },
};
