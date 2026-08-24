/**
 * Tiny DI container. Modules resolve dependencies by contract token, never
 * by concrete class. Mirrors Laravel's service container `bind/make`.
 */

import type { DataClient } from "@core/contracts";
import type {
  ProfileRepository,
  UserRoleRepository,
  ProductRepository,
  MedicineRepository,
  NeedCategoryRepository,
  NeedItemRepository,
  VendorRepository,
  MedicineOrderRepository,
  VendorOrderRepository,
  CartItemRepository,
  DoctorRepository,
  HealthTicketRepository,
  DepartmentRepository,
  BookingRepository,
  BuildingServiceBookingRepository,
  DeliveryManagerRepository,
  OrderTrackingRepository,
  ChatConversationRepository,
  ChatMessageRepository,
  LearnPostRepository,
  NotificationRepository,
  TicketRepository,
  TicketMessageRepository,
  ServiceWorkerRepository,
  CourseRepository,
  EnrollmentRepository,
  VideoProgressRepository,
  UserCertificateRepository,
  ProductReviewRepository,
  ExpertReviewRepository,
  WishlistRepository,
  AuditLogRepository,
  PaymentRepository,
  RefundRepository,
  WalletRepository,
  WalletTransactionRepository,
  LearnPostCommentRepository,
  LearnPostLikeRepository,
  LearnDirectMessageRepository,
  ExpertAvailabilityRepository,
  ExpertWishlistRepository,
  CourseLessonRepository,
  MedicineOrderItemRepository,
} from "@core/repositories";

const registry = new Map<symbol, unknown>();

export function register<T>(token: symbol, impl: T): void {
  registry.set(token, impl);
}

export function resolve<T>(token: symbol): T {
  const impl = registry.get(token);
  if (!impl) throw new Error(`No implementation registered for ${token.toString()}`);
  return impl as T;
}

export function has(token: symbol): boolean {
  return registry.has(token);
}

export function reset(): void {
  registry.clear();
}

// ── Infrastructure Tokens ────────────────────────────────────────

export const TOKENS = {
  // Cross-cutting contracts
  Payment: Symbol.for("contract:Payment"),
  Notification: Symbol.for("contract:Notification"),
  Storage: Symbol.for("contract:Storage"),
  Search: Symbol.for("contract:Search"),
  Messaging: Symbol.for("contract:Messaging"),
  Analytics: Symbol.for("contract:Analytics"),
  Audit: Symbol.for("contract:Audit"),
  Cache: Symbol.for("contract:Cache"),

  // Data access
  DataClient: Symbol.for("contract:DataClient"),
  AuthClient: Symbol.for("contract:AuthClient"),

  // User & Auth repositories
  ProfileRepository: Symbol.for("repo:ProfileRepository"),
  UserRoleRepository: Symbol.for("repo:UserRoleRepository"),

  // Product & Catalog repositories
  ProductRepository: Symbol.for("repo:ProductRepository"),
  MedicineRepository: Symbol.for("repo:MedicineRepository"),
  NeedCategoryRepository: Symbol.for("repo:NeedCategoryRepository"),
  NeedItemRepository: Symbol.for("repo:NeedItemRepository"),

  // Vendor repositories
  VendorRepository: Symbol.for("repo:VendorRepository"),

  // Order repositories
  MedicineOrderRepository: Symbol.for("repo:MedicineOrderRepository"),
  VendorOrderRepository: Symbol.for("repo:VendorOrderRepository"),
  MedicineOrderItemRepository: Symbol.for("repo:MedicineOrderItemRepository"),
  OrderTrackingRepository: Symbol.for("repo:OrderTrackingRepository"),

  // Cart repository
  CartItemRepository: Symbol.for("repo:CartItemRepository"),

  // Healthcare repositories
  DoctorRepository: Symbol.for("repo:DoctorRepository"),
  HealthTicketRepository: Symbol.for("repo:HealthTicketRepository"),
  DepartmentRepository: Symbol.for("repo:DepartmentRepository"),

  // Booking repositories
  BookingRepository: Symbol.for("repo:BookingRepository"),
  BuildingServiceBookingRepository: Symbol.for("repo:BuildingServiceBookingRepository"),

  // Delivery repositories
  DeliveryManagerRepository: Symbol.for("repo:DeliveryManagerRepository"),

  // Messaging repositories
  ChatConversationRepository: Symbol.for("repo:ChatConversationRepository"),
  ChatMessageRepository: Symbol.for("repo:ChatMessageRepository"),

  // Learn repositories
  LearnPostRepository: Symbol.for("repo:LearnPostRepository"),
  LearnPostCommentRepository: Symbol.for("repo:LearnPostCommentRepository"),
  LearnPostLikeRepository: Symbol.for("repo:LearnPostLikeRepository"),
  LearnDirectMessageRepository: Symbol.for("repo:LearnDirectMessageRepository"),

  // Notification repository
  NotificationRepository: Symbol.for("repo:NotificationRepository"),

  // Ticket repositories
  TicketRepository: Symbol.for("repo:TicketRepository"),
  TicketMessageRepository: Symbol.for("repo:TicketMessageRepository"),

  // Service Worker repository
  ServiceWorkerRepository: Symbol.for("repo:ServiceWorkerRepository"),

  // Education repositories
  CourseRepository: Symbol.for("repo:CourseRepository"),
  CourseLessonRepository: Symbol.for("repo:CourseLessonRepository"),
  EnrollmentRepository: Symbol.for("repo:EnrollmentRepository"),
  VideoProgressRepository: Symbol.for("repo:VideoProgressRepository"),
  UserCertificateRepository: Symbol.for("repo:UserCertificateRepository"),

  // Review repositories
  ProductReviewRepository: Symbol.for("repo:ProductReviewRepository"),
  ExpertReviewRepository: Symbol.for("repo:ExpertReviewRepository"),
  ExpertAvailabilityRepository: Symbol.for("repo:ExpertAvailabilityRepository"),
  ExpertWishlistRepository: Symbol.for("repo:ExpertWishlistRepository"),

  // Wishlist repository
  WishlistRepository: Symbol.for("repo:WishlistRepository"),

  // Audit repository
  AuditLogRepository: Symbol.for("repo:AuditLogRepository"),

  // Payment repositories
  PaymentRepository: Symbol.for("repo:PaymentRepository"),
  RefundRepository: Symbol.for("repo:RefundRepository"),
  WalletRepository: Symbol.for("repo:WalletRepository"),
  WalletTransactionRepository: Symbol.for("repo:WalletTransactionRepository"),
} as const;

// ── Repository Type Map ──────────────────────────────────────────

export interface RepositoryMap {
  ProfileRepository: ProfileRepository;
  UserRoleRepository: UserRoleRepository;
  ProductRepository: ProductRepository;
  MedicineRepository: MedicineRepository;
  NeedCategoryRepository: NeedCategoryRepository;
  NeedItemRepository: NeedItemRepository;
  VendorRepository: VendorRepository;
  MedicineOrderRepository: MedicineOrderRepository;
  VendorOrderRepository: VendorOrderRepository;
  MedicineOrderItemRepository: MedicineOrderItemRepository;
  OrderTrackingRepository: OrderTrackingRepository;
  CartItemRepository: CartItemRepository;
  DoctorRepository: DoctorRepository;
  HealthTicketRepository: HealthTicketRepository;
  DepartmentRepository: DepartmentRepository;
  BookingRepository: BookingRepository;
  BuildingServiceBookingRepository: BuildingServiceBookingRepository;
  DeliveryManagerRepository: DeliveryManagerRepository;
  ChatConversationRepository: ChatConversationRepository;
  ChatMessageRepository: ChatMessageRepository;
  LearnPostRepository: LearnPostRepository;
  LearnPostCommentRepository: LearnPostCommentRepository;
  LearnPostLikeRepository: LearnPostLikeRepository;
  LearnDirectMessageRepository: LearnDirectMessageRepository;
  NotificationRepository: NotificationRepository;
  TicketRepository: TicketRepository;
  TicketMessageRepository: TicketMessageRepository;
  ServiceWorkerRepository: ServiceWorkerRepository;
  CourseRepository: CourseRepository;
  CourseLessonRepository: CourseLessonRepository;
  EnrollmentRepository: EnrollmentRepository;
  VideoProgressRepository: VideoProgressRepository;
  UserCertificateRepository: UserCertificateRepository;
  ProductReviewRepository: ProductReviewRepository;
  ExpertReviewRepository: ExpertReviewRepository;
  ExpertAvailabilityRepository: ExpertAvailabilityRepository;
  ExpertWishlistRepository: ExpertWishlistRepository;
  WishlistRepository: WishlistRepository;
  AuditLogRepository: AuditLogRepository;
  PaymentRepository: PaymentRepository;
  RefundRepository: RefundRepository;
  WalletRepository: WalletRepository;
  WalletTransactionRepository: WalletTransactionRepository;
}

// ── Typed Resolve Helper ─────────────────────────────────────────

export function resolveRepo<K extends keyof RepositoryMap>(token: symbol): RepositoryMap[K] {
  return resolve<RepositoryMap[K]>(token);
}
