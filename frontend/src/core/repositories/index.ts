/**
 * Repository Interfaces - Port definitions for data access.
 * Modules depend on these interfaces, not concrete implementations.
 * Implementations live in Infrastructure layer.
 *
 * Laravel mapping: app/Repositories/*
 */

import type {
  Profile,
  ProfileInsert,
  ProfileUpdate,
  UserRole,
  UserRoleInsert,
  UserRoleUpdate,
  Product,
  ProductInsert,
  ProductUpdate,
  Vendor,
  VendorInsert,
  VendorUpdate,
  Medicine,
  MedicineInsert,
  MedicineUpdate,
  Course,
  CourseInsert,
  CourseUpdate,
  CourseLesson,
  CourseLessonInsert,
  CourseLessonUpdate,
  Doctor,
  DoctorInsert,
  DoctorUpdate,
  HealthTicket,
  HealthTicketInsert,
  HealthTicketUpdate,
  CartItem,
  CartItemInsert,
  CartItemUpdate,
  Booking,
  BookingInsert,
  BookingUpdate,
  MedicineOrder,
  MedicineOrderInsert,
  MedicineOrderUpdate,
  MedicineOrderItem,
  MedicineOrderItemInsert,
  MedicineOrderItemUpdate,
  VendorOrder,
  VendorOrderInsert,
  VendorOrderUpdate,
  Ticket,
  TicketInsert,
  TicketUpdate,
  TicketMessage,
  TicketMessageInsert,
  TicketMessageUpdate,
  Notification,
  NotificationInsert,
  NotificationUpdate,
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
  ChatConversation,
  ChatConversationInsert,
  ChatConversationUpdate,
  ChatMessage,
  ChatMessageInsert,
  ChatMessageUpdate,
  ServiceWorker,
  ServiceWorkerInsert,
  ServiceWorkerUpdate,
  BuildingServiceBooking,
  BuildingServiceBookingInsert,
  BuildingServiceBookingUpdate,
  DeliveryManager,
  DeliveryManagerInsert,
  DeliveryManagerUpdate,
  Enrollment,
  EnrollmentInsert,
  EnrollmentUpdate,
  Department,
  DepartmentInsert,
  DepartmentUpdate,
  NeedCategory,
  NeedCategoryInsert,
  NeedCategoryUpdate,
  NeedItem,
  NeedItemInsert,
  NeedItemUpdate,
  ProductReview,
  ProductReviewInsert,
  ProductReviewUpdate,
  ExpertReview,
  ExpertReviewInsert,
  ExpertReviewUpdate,
  ExpertAvailability,
  ExpertAvailabilityInsert,
  ExpertAvailabilityUpdate,
  ExpertWishlist,
  ExpertWishlistInsert,
  ExpertWishlistUpdate,
  OrderTracking,
  OrderTrackingInsert,
  OrderTrackingUpdate,
  AuditLog,
  AuditLogInsert,
  Wishlist,
  WishlistInsert,
  WishlistUpdate,
  VideoProgress,
  VideoProgressInsert,
  VideoProgressUpdate,
  UserCertificate,
  UserCertificateInsert,
  Payment,
  PaymentInsert,
  PaymentUpdate,
  Refund,
  RefundInsert,
  RefundUpdate,
  Wallet,
  WalletInsert,
  WalletUpdate,
  WalletTransaction,
  WalletTransactionInsert,
  WalletTransactionUpdate,
} from "@core/api/types";

import type { QueryParams, PaginatedResult, Repository, ReadRepository, WriteRepository } from "@core/domain";

// ── User & Auth Repositories ─────────────────────────────────────

export interface ProfileRepository extends Repository<Profile, ProfileInsert, ProfileUpdate> {
  findByEmail(email: string): Promise<Profile | null>;
  findByPhone(phone: string): Promise<Profile | null>;
  search(query: string): Promise<Profile[]>;
}

export interface UserRoleRepository extends Repository<UserRole, UserRoleInsert, UserRoleUpdate> {
  findByUserId(userId: string): Promise<UserRole[]>;
  findByRole(role: string): Promise<UserRole[]>;
  hasRole(userId: string, role: string): Promise<boolean>;
  assignRole(userId: string, role: string, categoryId?: string): Promise<UserRole>;
  removeRole(userId: string, role: string): Promise<boolean>;
}

// ── Product & Catalog Repositories ───────────────────────────────

export interface ProductRepository extends Repository<Product, ProductInsert, ProductUpdate> {
  findByVendorId(vendorId: string, params?: QueryParams): Promise<PaginatedResult<Product>>;
  findByCategory(category: string, params?: QueryParams): Promise<PaginatedResult<Product>>;
  findActive(params?: QueryParams): Promise<PaginatedResult<Product>>;
  search(query: string, params?: QueryParams): Promise<PaginatedResult<Product>>;
  updateStock(id: string, quantity: number): Promise<Product>;
}

export interface MedicineRepository extends Repository<Medicine, MedicineInsert, MedicineUpdate> {
  findByCategory(category: string, params?: QueryParams): Promise<PaginatedResult<Medicine>>;
  search(query: string, params?: QueryParams): Promise<PaginatedResult<Medicine>>;
  findRequiresPrescription(params?: QueryParams): Promise<PaginatedResult<Medicine>>;
  updateStock(id: string, quantity: number): Promise<Medicine>;
}

export interface NeedCategoryRepository extends Repository<NeedCategory, NeedCategoryInsert, NeedCategoryUpdate> {
  findBySlug(slug: string): Promise<NeedCategory | null>;
  findWithItems(): Promise<NeedCategory[]>;
}

export interface NeedItemRepository extends Repository<NeedItem, NeedItemInsert, NeedItemUpdate> {
  findByCategoryId(categoryId: string, params?: QueryParams): Promise<PaginatedResult<NeedItem>>;
  findAvailable(params?: QueryParams): Promise<PaginatedResult<NeedItem>>;
  findByVendorId(vendorId: string): Promise<NeedItem[]>;
}

// ── Vendor Repositories ──────────────────────────────────────────

export interface VendorRepository extends Repository<Vendor, VendorInsert, VendorUpdate> {
  findByUserId(userId: string): Promise<Vendor | null>;
  findByCategory(category: string, params?: QueryParams): Promise<PaginatedResult<Vendor>>;
  findVerified(params?: QueryParams): Promise<PaginatedResult<Vendor>>;
  search(query: string): Promise<Vendor[]>;
}

// ── Order Repositories ───────────────────────────────────────────

export interface MedicineOrderRepository extends Repository<MedicineOrder, MedicineOrderInsert, MedicineOrderUpdate> {
  findByUserId(userId: string, params?: QueryParams): Promise<PaginatedResult<MedicineOrder>>;
  findByOrderNumber(orderNumber: string): Promise<MedicineOrder | null>;
  updateStatus(id: string, status: string): Promise<MedicineOrder>;
}

export interface VendorOrderRepository extends Repository<VendorOrder, VendorOrderInsert, VendorOrderUpdate> {
  findByVendorId(vendorId: string, params?: QueryParams): Promise<PaginatedResult<VendorOrder>>;
  findByCustomerId(customerId: string, params?: QueryParams): Promise<PaginatedResult<VendorOrder>>;
  findByOrderNumber(orderNumber: string): Promise<VendorOrder | null>;
  updateStatus(id: string, status: string): Promise<VendorOrder>;
}

// ── Cart Repository ──────────────────────────────────────────────

export interface CartItemRepository extends Repository<CartItem, CartItemInsert, CartItemUpdate> {
  findByUserId(userId: string): Promise<CartItem[]>;
  findByMedicineId(medicineId: string): Promise<CartItem | null>;
  clearByUserId(userId: string): Promise<boolean>;
  countByUserId(userId: string): Promise<number>;
}

// ── Healthcare Repositories ──────────────────────────────────────

export interface DoctorRepository extends Repository<Doctor, DoctorInsert, DoctorUpdate> {
  findByUserId(userId: string): Promise<Doctor | null>;
  findBySpecialization(specialization: string, params?: QueryParams): Promise<PaginatedResult<Doctor>>;
  findAvailable(params?: QueryParams): Promise<PaginatedResult<Doctor>>;
  search(query: string): Promise<Doctor[]>;
}

export interface HealthTicketRepository extends Repository<HealthTicket, HealthTicketInsert, HealthTicketUpdate> {
  findByPatientId(patientId: string, params?: QueryParams): Promise<PaginatedResult<HealthTicket>>;
  findByDoctorId(doctorId: string, params?: QueryParams): Promise<PaginatedResult<HealthTicket>>;
  findByTicketNumber(ticketNumber: string): Promise<HealthTicket | null>;
  updateStatus(id: string, status: string): Promise<HealthTicket>;
  assignDoctor(id: string, doctorId: string): Promise<HealthTicket>;
}

export interface DepartmentRepository extends Repository<Department, DepartmentInsert, DepartmentUpdate> {
  findByName(name: string): Promise<Department | null>;
}

// ── Booking Repositories ─────────────────────────────────────────

export interface BookingRepository extends Repository<Booking, BookingInsert, BookingUpdate> {
  findByUserId(userId: string, params?: QueryParams): Promise<PaginatedResult<Booking>>;
  findByServiceType(serviceType: string, params?: QueryParams): Promise<PaginatedResult<Booking>>;
  updateStatus(id: string, status: string): Promise<Booking>;
}

export interface BuildingServiceBookingRepository extends Repository<BuildingServiceBooking, BuildingServiceBookingInsert, BuildingServiceBookingUpdate> {
  findByUserId(userId: string, params?: QueryParams): Promise<PaginatedResult<BuildingServiceBooking>>;
  findByWorkerType(workerType: string, params?: QueryParams): Promise<PaginatedResult<BuildingServiceBooking>>;
  updateStatus(id: string, status: string): Promise<BuildingServiceBooking>;
}

// ── Delivery Repositories ────────────────────────────────────────

export interface DeliveryManagerRepository extends Repository<DeliveryManager, DeliveryManagerInsert, DeliveryManagerUpdate> {
  findByUserId(userId: string): Promise<DeliveryManager | null>;
  findAvailable(params?: QueryParams): Promise<PaginatedResult<DeliveryManager>>;
  updateAvailability(id: string, isAvailable: boolean): Promise<DeliveryManager>;
}

export interface OrderTrackingRepository extends Repository<OrderTracking, OrderTrackingInsert, OrderTrackingUpdate> {
  findByOrderId(orderId: string): Promise<OrderTracking[]>;
  findLatestByOrderId(orderId: string): Promise<OrderTracking | null>;
  updateStatus(id: string, status: string, location?: { lat: number; lng: number }): Promise<OrderTracking>;
}

// ── Messaging Repositories ───────────────────────────────────────

export interface ChatConversationRepository extends Repository<ChatConversation, ChatConversationInsert, ChatConversationUpdate> {
  findByCustomerId(customerId: string, params?: QueryParams): Promise<PaginatedResult<ChatConversation>>;
  findByWorkerId(workerId: string, params?: QueryParams): Promise<PaginatedResult<ChatConversation>>;
  findByBookingId(bookingId: string): Promise<ChatConversation | null>;
}

export interface ChatMessageRepository extends Repository<ChatMessage, ChatMessageInsert, ChatMessageUpdate> {
  findByConversationId(conversationId: string, params?: QueryParams): Promise<PaginatedResult<ChatMessage>>;
  markAsRead(conversationId: string, userId: string): Promise<boolean>;
  countUnread(userId: string): Promise<number>;
}

// ── Learn Repositories ───────────────────────────────────────────

export interface LearnPostRepository extends Repository<LearnPost, LearnPostInsert, LearnPostUpdate> {
  findByUserId(userId: string, params?: QueryParams): Promise<PaginatedResult<LearnPost>>;
  findByCategory(category: string, params?: QueryParams): Promise<PaginatedResult<LearnPost>>;
  findFeatured(params?: QueryParams): Promise<PaginatedResult<LearnPost>>;
  search(query: string, params?: QueryParams): Promise<PaginatedResult<LearnPost>>;
  incrementLikes(id: string): Promise<LearnPost>;
  incrementComments(id: string): Promise<LearnPost>;
  incrementShares(id: string): Promise<LearnPost>;
}

// ── Notification Repository ──────────────────────────────────────

export interface NotificationRepository extends Repository<Notification, NotificationInsert, NotificationUpdate> {
  findByUserId(userId: string, params?: QueryParams): Promise<PaginatedResult<Notification>>;
  findUnreadByUserId(userId: string): Promise<Notification[]>;
  markAsRead(id: string): Promise<Notification>;
  markAllAsRead(userId: string): Promise<boolean>;
  countUnread(userId: string): Promise<number>;
}

// ── Ticket Repositories ──────────────────────────────────────────

export interface TicketRepository extends Repository<Ticket, TicketInsert, TicketUpdate> {
  findByUserId(userId: string, params?: QueryParams): Promise<PaginatedResult<Ticket>>;
  findByTicketNumber(ticketNumber: string): Promise<Ticket | null>;
  findByAssignee(assigneeId: string, params?: QueryParams): Promise<PaginatedResult<Ticket>>;
  updateStatus(id: string, status: string): Promise<Ticket>;
  assignTo(id: string, assigneeId: string): Promise<Ticket>;
}

// ── Service Worker Repository ────────────────────────────────────

export interface ServiceWorkerRepository extends Repository<ServiceWorker, ServiceWorkerInsert, ServiceWorkerUpdate> {
  findByUserId(userId: string): Promise<ServiceWorker | null>;
  findByWorkerType(workerType: string, params?: QueryParams): Promise<PaginatedResult<ServiceWorker>>;
  findAvailable(params?: QueryParams): Promise<PaginatedResult<ServiceWorker>>;
  updateAvailability(id: string, isAvailable: boolean): Promise<ServiceWorker>;
}

// ── Education Repositories ───────────────────────────────────────

export interface CourseRepository extends Repository<Course, CourseInsert, CourseUpdate> {
  findByCategory(category: string, params?: QueryParams): Promise<PaginatedResult<Course>>;
  findFeatured(params?: QueryParams): Promise<PaginatedResult<Course>>;
  search(query: string, params?: QueryParams): Promise<PaginatedResult<Course>>;
  incrementStudents(id: string): Promise<Course>;
}

export interface EnrollmentRepository extends Repository<Enrollment, EnrollmentInsert, EnrollmentUpdate> {
  findByUserId(userId: string, params?: QueryParams): Promise<PaginatedResult<Enrollment>>;
  findByCourseId(courseId: string, params?: QueryParams): Promise<PaginatedResult<Enrollment>>;
  findByUserAndCourse(userId: string, courseId: string): Promise<Enrollment | null>;
  updateProgress(id: string, progress: number): Promise<Enrollment>;
}

export interface VideoProgressRepository extends Repository<VideoProgress, VideoProgressInsert, VideoProgressUpdate> {
  findByUserAndCourse(userId: string, courseId: string): Promise<VideoProgress[]>;
  findByLessonId(lessonId: string): Promise<VideoProgress | null>;
  updatePosition(id: string, positionSeconds: number): Promise<VideoProgress>;
}

export interface UserCertificateRepository extends Repository<UserCertificate, UserCertificateInsert, Partial<UserCertificate>> {
  findByUserId(userId: string): Promise<UserCertificate[]>;
  findByCourseId(courseId: string): Promise<UserCertificate | null>;
  findByCertificateNumber(number: string): Promise<UserCertificate | null>;
}

// ── Review Repositories ──────────────────────────────────────────

export interface ProductReviewRepository extends Repository<ProductReview, ProductReviewInsert, Partial<ProductReview>> {
  findByProductId(productId: string, params?: QueryParams): Promise<PaginatedResult<ProductReview>>;
  findByUserId(userId: string, params?: QueryParams): Promise<PaginatedResult<ProductReview>>;
  findByUserAndProduct(userId: string, productId: string): Promise<ProductReview | null>;
  getAverageRating(productId: string): Promise<number>;
}

export interface ExpertReviewRepository extends Repository<ExpertReview, ExpertReviewInsert, Partial<ExpertReview>> {
  findByExpertId(expertId: string, params?: QueryParams): Promise<PaginatedResult<ExpertReview>>;
  findByUserId(userId: string, params?: QueryParams): Promise<PaginatedResult<ExpertReview>>;
  findByUserAndExpert(userId: string, expertId: string): Promise<ExpertReview | null>;
  getAverageRating(expertId: string): Promise<number>;
}

// ── Wishlist Repository ──────────────────────────────────────────

export interface WishlistRepository extends Repository<Wishlist, WishlistInsert, Partial<Wishlist>> {
  findByUserId(userId: string, params?: QueryParams): Promise<PaginatedResult<Wishlist>>;
  findByUserAndProduct(userId: string, productId: string): Promise<Wishlist | null>;
}

// ── Audit Repository ─────────────────────────────────────────────

export interface AuditLogRepository extends Repository<AuditLog, AuditLogInsert, Partial<AuditLog>> {
  findByEntity(entityType: string, entityId: string, params?: QueryParams): Promise<PaginatedResult<AuditLog>>;
  findByActorId(actorId: string, params?: QueryParams): Promise<PaginatedResult<AuditLog>>;
  findByAction(action: string, params?: QueryParams): Promise<PaginatedResult<AuditLog>>;
}

// ── Payment Repositories ─────────────────────────────────────────

export interface PaymentRepository extends Repository<Payment, PaymentInsert, PaymentUpdate> {
  findByOrderId(orderId: string): Promise<Payment[]>;
  findByUserId(userId: string, params?: QueryParams): Promise<PaginatedResult<Payment>>;
  findByReference(reference: string): Promise<Payment | null>;
  updateStatus(id: string, status: string): Promise<Payment>;
}

export interface RefundRepository extends Repository<Refund, RefundInsert, RefundUpdate> {
  findByPaymentId(paymentId: string): Promise<Refund[]>;
  findByStatus(status: string, params?: QueryParams): Promise<PaginatedResult<Refund>>;
  updateStatus(id: string, status: string): Promise<Refund>;
}

export interface WalletRepository extends Repository<Wallet, WalletInsert, WalletUpdate> {
  findByUserId(userId: string): Promise<Wallet | null>;
  updateBalance(id: string, balance: number): Promise<Wallet>;
}

export interface WalletTransactionRepository extends Repository<WalletTransaction, WalletTransactionInsert, WalletTransactionUpdate> {
  findByWalletId(walletId: string, params?: QueryParams): Promise<PaginatedResult<WalletTransaction>>;
  findByType(type: "credit" | "debit", params?: QueryParams): Promise<PaginatedResult<WalletTransaction>>;
}

// ── Ticket Message Repository ────────────────────────────────────

export interface TicketMessageRepository extends Repository<TicketMessage, TicketMessageInsert, TicketMessageUpdate> {
  findByTicketId(ticketId: string, params?: QueryParams): Promise<PaginatedResult<TicketMessage>>;
  findBySenderId(senderId: string): Promise<TicketMessage[]>;
  markAsRead(id: string): Promise<TicketMessage>;
  countByTicketId(ticketId: string): Promise<number>;
}

// ── Learn Repositories (extended) ────────────────────────────────

export interface LearnPostCommentRepository extends Repository<LearnPostComment, LearnPostCommentInsert, LearnPostCommentUpdate> {
  findByPostId(postId: string, params?: QueryParams): Promise<PaginatedResult<LearnPostComment>>;
  findByUserId(userId: string): Promise<LearnPostComment[]>;
  countByPostId(postId: string): Promise<number>;
}

export interface LearnPostLikeRepository extends Repository<LearnPostLike, LearnPostLikeInsert, LearnPostLikeUpdate> {
  findByPostId(postId: string): Promise<LearnPostLike[]>;
  findByUserId(userId: string): Promise<LearnPostLike[]>;
  findByUserAndPost(userId: string, postId: string): Promise<LearnPostLike | null>;
  countByPostId(postId: string): Promise<number>;
  isLikedByUser(userId: string, postId: string): Promise<boolean>;
}

export interface LearnDirectMessageRepository extends Repository<LearnDirectMessage, LearnDirectMessageInsert, LearnDirectMessageUpdate> {
  findBySenderId(senderId: string, params?: QueryParams): Promise<PaginatedResult<LearnDirectMessage>>;
  findByReceiverId(receiverId: string, params?: QueryParams): Promise<PaginatedResult<LearnDirectMessage>>;
  findByUserPair(userId1: string, userId2: string, params?: QueryParams): Promise<PaginatedResult<LearnDirectMessage>>;
  markAsRead(id: string): Promise<LearnDirectMessage>;
  countUnread(userId: string): Promise<number>;
}

// ── Expert Repositories (extended) ───────────────────────────────

export interface ExpertAvailabilityRepository extends Repository<ExpertAvailability, ExpertAvailabilityInsert, ExpertAvailabilityUpdate> {
  findByExpertId(expertId: string, expertType: string): Promise<ExpertAvailability | null>;
  findAvailable(expertType: string, params?: QueryParams): Promise<PaginatedResult<ExpertAvailability>>;
  updateStatus(expertId: string, expertType: string, status: string, isAvailable: boolean): Promise<ExpertAvailability>;
}

export interface ExpertWishlistRepository extends Repository<ExpertWishlist, ExpertWishlistInsert, ExpertWishlistUpdate> {
  findByUserId(userId: string): Promise<ExpertWishlist[]>;
  findByUserAndExpert(userId: string, expertId: string): Promise<ExpertWishlist | null>;
}

// ── Course Lesson Repository ─────────────────────────────────────

export interface CourseLessonRepository extends Repository<CourseLesson, CourseLessonInsert, CourseLessonUpdate> {
  findByCourseId(courseId: string, params?: QueryParams): Promise<PaginatedResult<CourseLesson>>;
  findByCourseIdOrdered(courseId: string): Promise<CourseLesson[]>;
  updateOrder(id: string, lessonOrder: number): Promise<CourseLesson>;
}

// ── Medicine Order Item Repository ───────────────────────────────

export interface MedicineOrderItemRepository extends Repository<MedicineOrderItem, MedicineOrderItemInsert, MedicineOrderItemUpdate> {
  findByOrderId(orderId: string): Promise<MedicineOrderItem[]>;
  findByMedicineId(medicineId: string): Promise<MedicineOrderItem[]>;
  deleteByOrderId(orderId: string): Promise<boolean>;
}
