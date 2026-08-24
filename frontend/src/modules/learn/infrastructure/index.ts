/**
 * Learn Infrastructure - Concrete Repository Implementations
 *
 * Laravel mapping: app/Modules/Learn/Infrastructure/Repositories/*
 */

import type { DataClient } from "@core/contracts";
import { BaseRepository } from "@core/infrastructure";
import type { QueryParams, PaginatedResult } from "@core/domain";
import type {
  LearnPost,
  LearnPostInsert,
  LearnPostUpdate,
  LearnPostComment,
  LearnPostCommentInsert,
  LearnPostCommentUpdate,
  LearnPostLike,
  LearnPostLikeInsert,
  LearnPostLikeUpdate,
  LearnDirectMessage,
  LearnDirectMessageInsert,
  LearnDirectMessageUpdate,
  Course,
  CourseInsert,
  CourseUpdate,
  CourseLesson,
  CourseLessonInsert,
  CourseLessonUpdate,
  Enrollment,
  EnrollmentInsert,
  EnrollmentUpdate,
  VideoProgress,
  VideoProgressInsert,
  VideoProgressUpdate,
  UserCertificate,
  UserCertificateInsert,
} from "@core/api/types";
import type {
  LearnPostRepository,
  LearnPostCommentRepository,
  LearnPostLikeRepository,
  LearnDirectMessageRepository,
  CourseRepository,
  CourseLessonRepository,
  EnrollmentRepository,
  VideoProgressRepository,
  UserCertificateRepository,
} from "@core/repositories";

// ── Learn Post Repository ────────────────────────────────────────

export class LearnPostRepositoryImpl
  extends BaseRepository<LearnPost, LearnPostInsert, LearnPostUpdate>
  implements LearnPostRepository
{
  get TableName(): string {
    return "learn_posts";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByUserId(userId: string, params?: QueryParams): Promise<PaginatedResult<LearnPost>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "user_id", operator: "=", value: userId },
      ],
    });
  }

  async findByCategory(category: string, params?: QueryParams): Promise<PaginatedResult<LearnPost>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "category", operator: "=", value: category },
      ],
    });
  }

  async findFeatured(params?: QueryParams): Promise<PaginatedResult<LearnPost>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "is_featured", operator: "=", value: true },
      ],
    });
  }

  async search(query: string, params?: QueryParams): Promise<PaginatedResult<LearnPost>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "title", operator: "ilike", value: `%${query}%` },
      ],
    });
  }

  async incrementLikes(id: string): Promise<LearnPost> {
    const post = await this.findById(id);
    if (!post) throw new Error(`Post ${id} not found`);
    return this.update(id, { likes_count: post.likes_count + 1 });
  }

  async incrementComments(id: string): Promise<LearnPost> {
    const post = await this.findById(id);
    if (!post) throw new Error(`Post ${id} not found`);
    return this.update(id, { comments_count: post.comments_count + 1 });
  }

  async incrementShares(id: string): Promise<LearnPost> {
    const post = await this.findById(id);
    if (!post) throw new Error(`Post ${id} not found`);
    return this.update(id, { shares_count: post.shares_count + 1 });
  }
}

// ── Learn Post Comment Repository ────────────────────────────────

export class LearnPostCommentRepositoryImpl
  extends BaseRepository<LearnPostComment, LearnPostCommentInsert, LearnPostCommentUpdate>
  implements LearnPostCommentRepository
{
  get TableName(): string {
    return "learn_post_comments";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByPostId(postId: string, params?: QueryParams): Promise<PaginatedResult<LearnPostComment>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "post_id", operator: "=", value: postId },
      ],
    });
  }

  async findByUserId(userId: string): Promise<LearnPostComment[]> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("user_id", "=", userId)
      .orderBy("created_at", false);
    return (result as LearnPostComment[]) || [];
  }

  async countByPostId(postId: string): Promise<number> {
    return this.count([{ field: "post_id", operator: "=", value: postId }]);
  }
}

// ── Learn Post Like Repository ───────────────────────────────────

export class LearnPostLikeRepositoryImpl
  extends BaseRepository<LearnPostLike, LearnPostLikeInsert, LearnPostLikeUpdate>
  implements LearnPostLikeRepository
{
  get TableName(): string {
    return "learn_post_likes";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByPostId(postId: string): Promise<LearnPostLike[]> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("post_id", "=", postId);
    return (result as LearnPostLike[]) || [];
  }

  async findByUserId(userId: string): Promise<LearnPostLike[]> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("user_id", "=", userId);
    return (result as LearnPostLike[]) || [];
  }

  async findByUserAndPost(userId: string, postId: string): Promise<LearnPostLike | null> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("user_id", "=", userId)
      .where("post_id", "=", postId)
      .single();
    return (result as LearnPostLike) || null;
  }

  async countByPostId(postId: string): Promise<number> {
    return this.count([{ field: "post_id", operator: "=", value: postId }]);
  }

  async isLikedByUser(userId: string, postId: string): Promise<boolean> {
    const like = await this.findByUserAndPost(userId, postId);
    return like !== null;
  }
}

// ── Learn Direct Message Repository ──────────────────────────────

export class LearnDirectMessageRepositoryImpl
  extends BaseRepository<LearnDirectMessage, LearnDirectMessageInsert, LearnDirectMessageUpdate>
  implements LearnDirectMessageRepository
{
  get TableName(): string {
    return "learn_direct_messages";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findBySenderId(senderId: string, params?: QueryParams): Promise<PaginatedResult<LearnDirectMessage>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "sender_id", operator: "=", value: senderId },
      ],
    });
  }

  async findByReceiverId(receiverId: string, params?: QueryParams): Promise<PaginatedResult<LearnDirectMessage>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "receiver_id", operator: "=", value: receiverId },
      ],
    });
  }

  async findByUserPair(userId1: string, userId2: string, params?: QueryParams): Promise<PaginatedResult<LearnDirectMessage>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "sender_id", operator: "in", value: [userId1, userId2] },
        { field: "receiver_id", operator: "in", value: [userId1, userId2] },
      ],
    });
  }

  async markAsRead(id: string): Promise<LearnDirectMessage> {
    return this.update(id, { is_read: true });
  }

  async countUnread(userId: string): Promise<number> {
    return this.count([
      { field: "receiver_id", operator: "=", value: userId },
      { field: "is_read", operator: "=", value: false },
    ]);
  }
}

// ── Course Repository ────────────────────────────────────────────

export class CourseRepositoryImpl
  extends BaseRepository<Course, CourseInsert, CourseUpdate>
  implements CourseRepository
{
  get TableName(): string {
    return "courses";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByCategory(category: string, params?: QueryParams): Promise<PaginatedResult<Course>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "category", operator: "=", value: category },
      ],
    });
  }

  async findFeatured(params?: QueryParams): Promise<PaginatedResult<Course>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "is_featured", operator: "=", value: true },
      ],
    });
  }

  async search(query: string, params?: QueryParams): Promise<PaginatedResult<Course>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "title", operator: "ilike", value: `%${query}%` },
      ],
    });
  }

  async incrementStudents(id: string): Promise<Course> {
    const course = await this.findById(id);
    if (!course) throw new Error(`Course ${id} not found`);
    return this.update(id, { students_count: (course.students_count || 0) + 1 });
  }
}

// ── Course Lesson Repository ─────────────────────────────────────

export class CourseLessonRepositoryImpl
  extends BaseRepository<CourseLesson, CourseLessonInsert, CourseLessonUpdate>
  implements CourseLessonRepository
{
  get TableName(): string {
    return "course_lessons";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByCourseId(courseId: string, params?: QueryParams): Promise<PaginatedResult<CourseLesson>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "course_id", operator: "=", value: courseId },
      ],
    });
  }

  async findByCourseIdOrdered(courseId: string): Promise<CourseLesson[]> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("course_id", "=", courseId)
      .orderBy("lesson_order", true);
    return (result as CourseLesson[]) || [];
  }

  async updateOrder(id: string, lessonOrder: number): Promise<CourseLesson> {
    return this.update(id, { lesson_order: lessonOrder });
  }
}

// ── Enrollment Repository ────────────────────────────────────────

export class EnrollmentRepositoryImpl
  extends BaseRepository<Enrollment, EnrollmentInsert, EnrollmentUpdate>
  implements EnrollmentRepository
{
  get TableName(): string {
    return "enrollments";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByUserId(userId: string, params?: QueryParams): Promise<PaginatedResult<Enrollment>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "user_id", operator: "=", value: userId },
      ],
    });
  }

  async findByCourseId(courseId: string, params?: QueryParams): Promise<PaginatedResult<Enrollment>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "course_id", operator: "=", value: courseId },
      ],
    });
  }

  async findByUserAndCourse(userId: string, courseId: string): Promise<Enrollment | null> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("user_id", "=", userId)
      .where("course_id", "=", courseId)
      .single();
    return (result as Enrollment) || null;
  }

  async updateProgress(id: string, progress: number): Promise<Enrollment> {
    return this.update(id, { progress });
  }
}

// ── Video Progress Repository ────────────────────────────────────

export class VideoProgressRepositoryImpl
  extends BaseRepository<VideoProgress, VideoProgressInsert, VideoProgressUpdate>
  implements VideoProgressRepository
{
  get TableName(): string {
    return "video_progress";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByUserAndCourse(userId: string, courseId: string): Promise<VideoProgress[]> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("user_id", "=", userId)
      .where("course_id", "=", courseId);
    return (result as VideoProgress[]) || [];
  }

  async findByLessonId(lessonId: string): Promise<VideoProgress | null> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("lesson_id", "=", lessonId)
      .single();
    return (result as VideoProgress) || null;
  }

  async updatePosition(id: string, positionSeconds: number): Promise<VideoProgress> {
    return this.update(id, { last_position_seconds: positionSeconds });
  }
}

// ── User Certificate Repository ──────────────────────────────────

export class UserCertificateRepositoryImpl
  extends BaseRepository<UserCertificate, UserCertificateInsert, Partial<UserCertificate>>
  implements UserCertificateRepository
{
  get TableName(): string {
    return "user_certificates";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByUserId(userId: string): Promise<UserCertificate[]> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("user_id", "=", userId)
      .orderBy("issued_at", false);
    return (result as UserCertificate[]) || [];
  }

  async findByCourseId(courseId: string): Promise<UserCertificate | null> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("course_id", "=", courseId)
      .single();
    return (result as UserCertificate) || null;
  }

  async findByCertificateNumber(number: string): Promise<UserCertificate | null> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("certificate_number", "=", number)
      .single();
    return (result as UserCertificate) || null;
  }
}
