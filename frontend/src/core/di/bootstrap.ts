/**
 * Bootstrap the DI container with all concrete implementations.
 * Call this once at application startup.
 */

import { register, TOKENS } from "./container";
import type { DataClient } from "@core/contracts";
import { db, auth, storage } from "@core/api/laravelGateway";

// Orders
import {
  MedicineOrderRepositoryImpl,
  VendorOrderRepositoryImpl,
  OrderTrackingRepositoryImpl,
  MedicineOrderItemRepositoryImpl,
} from "@modules/orders/infrastructure";

// Payments
import {
  PaymentRepositoryImpl,
  RefundRepositoryImpl,
  WalletRepositoryImpl,
  WalletTransactionRepositoryImpl,
} from "@modules/payments/infrastructure";

// Products
import { ProductRepositoryImpl, ProductReviewRepositoryImpl } from "@modules/products/infrastructure";

// Healthcare
import { DoctorRepositoryImpl, HealthTicketRepositoryImpl, DepartmentRepositoryImpl } from "@modules/healthcare/infrastructure";

// Tickets
import { TicketRepositoryImpl, TicketMessageRepositoryImpl } from "@modules/tickets/infrastructure";

// Pharmacy
import { MedicineRepositoryImpl } from "@modules/pharmacy/infrastructure";

// Bookings
import { BookingRepositoryImpl, BuildingServiceBookingRepositoryImpl } from "@modules/bookings/infrastructure";

// Users
import { ProfileRepositoryImpl, UserRoleRepositoryImpl } from "@modules/users/infrastructure";

// Messaging
import {
  ChatConversationRepositoryImpl,
  ChatMessageRepositoryImpl,
  NotificationRepositoryImpl,
} from "@modules/messaging/infrastructure";

// Learn
import {
  LearnPostRepositoryImpl,
  LearnPostCommentRepositoryImpl,
  LearnPostLikeRepositoryImpl,
  LearnDirectMessageRepositoryImpl,
  CourseRepositoryImpl,
  CourseLessonRepositoryImpl,
  EnrollmentRepositoryImpl,
  VideoProgressRepositoryImpl,
  UserCertificateRepositoryImpl,
} from "@modules/learn/infrastructure";

// Needs
import { NeedCategoryRepositoryImpl, NeedItemRepositoryImpl } from "@modules/needs/infrastructure";

// Vendors
import { VendorRepositoryImpl } from "@modules/vendors/infrastructure";

// Checkout
import { CartItemRepositoryImpl } from "@modules/checkout/infrastructure";

// Deliveries
import { DeliveryManagerRepositoryImpl } from "@modules/deliveries/infrastructure";

// Building Services
import { ServiceWorkerRepositoryImpl } from "@modules/building-services/infrastructure";

// Experts
import { ExpertAvailabilityRepositoryImpl, ExpertWishlistRepositoryImpl } from "@modules/experts/infrastructure";

// Reviews
import { ExpertReviewRepositoryImpl } from "@modules/reviews/infrastructure";

// Engagement
import { WishlistRepositoryImpl } from "@modules/engagement/infrastructure";

// Admin
import { AuditLogRepositoryImpl } from "@modules/admin/infrastructure";

let bootstrapped = false;

export function bootstrap(dataClient?: DataClient): void {
  if (bootstrapped) return;

  const dc = dataClient || (db as unknown as DataClient);

  // ── Cross-cutting contracts ──────────────────────────────────
  register(TOKENS.DataClient, dc);
  register(TOKENS.AuthClient, auth);
  register(TOKENS.Storage, storage);

  // ── Orders module ────────────────────────────────────────────
  register(TOKENS.MedicineOrderRepository, new MedicineOrderRepositoryImpl(dc));
  register(TOKENS.VendorOrderRepository, new VendorOrderRepositoryImpl(dc));
  register(TOKENS.OrderTrackingRepository, new OrderTrackingRepositoryImpl(dc));
  register(TOKENS.MedicineOrderItemRepository, new MedicineOrderItemRepositoryImpl(dc));

  // ── Payments module ──────────────────────────────────────────
  register(TOKENS.PaymentRepository, new PaymentRepositoryImpl(dc));
  register(TOKENS.RefundRepository, new RefundRepositoryImpl(dc));
  register(TOKENS.WalletRepository, new WalletRepositoryImpl(dc));
  register(TOKENS.WalletTransactionRepository, new WalletTransactionRepositoryImpl(dc));

  // ── Products module ──────────────────────────────────────────
  register(TOKENS.ProductRepository, new ProductRepositoryImpl(dc));
  register(TOKENS.ProductReviewRepository, new ProductReviewRepositoryImpl(dc));

  // ── Healthcare module ────────────────────────────────────────
  register(TOKENS.DoctorRepository, new DoctorRepositoryImpl(dc));
  register(TOKENS.HealthTicketRepository, new HealthTicketRepositoryImpl(dc));
  register(TOKENS.DepartmentRepository, new DepartmentRepositoryImpl(dc));

  // ── Tickets module ───────────────────────────────────────────
  register(TOKENS.TicketRepository, new TicketRepositoryImpl(dc));
  register(TOKENS.TicketMessageRepository, new TicketMessageRepositoryImpl(dc));

  // ── Pharmacy module ──────────────────────────────────────────
  register(TOKENS.MedicineRepository, new MedicineRepositoryImpl(dc));

  // ── Bookings module ──────────────────────────────────────────
  register(TOKENS.BookingRepository, new BookingRepositoryImpl(dc));
  register(TOKENS.BuildingServiceBookingRepository, new BuildingServiceBookingRepositoryImpl(dc));

  // ── Users module ─────────────────────────────────────────────
  register(TOKENS.ProfileRepository, new ProfileRepositoryImpl(dc));
  register(TOKENS.UserRoleRepository, new UserRoleRepositoryImpl(dc));

  // ── Messaging module ─────────────────────────────────────────
  register(TOKENS.ChatConversationRepository, new ChatConversationRepositoryImpl(dc));
  register(TOKENS.ChatMessageRepository, new ChatMessageRepositoryImpl(dc));
  register(TOKENS.NotificationRepository, new NotificationRepositoryImpl(dc));

  // ── Learn module ─────────────────────────────────────────────
  register(TOKENS.LearnPostRepository, new LearnPostRepositoryImpl(dc));
  register(TOKENS.LearnPostCommentRepository, new LearnPostCommentRepositoryImpl(dc));
  register(TOKENS.LearnPostLikeRepository, new LearnPostLikeRepositoryImpl(dc));
  register(TOKENS.LearnDirectMessageRepository, new LearnDirectMessageRepositoryImpl(dc));
  register(TOKENS.CourseRepository, new CourseRepositoryImpl(dc));
  register(TOKENS.CourseLessonRepository, new CourseLessonRepositoryImpl(dc));
  register(TOKENS.EnrollmentRepository, new EnrollmentRepositoryImpl(dc));
  register(TOKENS.VideoProgressRepository, new VideoProgressRepositoryImpl(dc));
  register(TOKENS.UserCertificateRepository, new UserCertificateRepositoryImpl(dc));

  // ── Needs module ─────────────────────────────────────────────
  register(TOKENS.NeedCategoryRepository, new NeedCategoryRepositoryImpl(dc));
  register(TOKENS.NeedItemRepository, new NeedItemRepositoryImpl(dc));

  // ── Vendors module ───────────────────────────────────────────
  register(TOKENS.VendorRepository, new VendorRepositoryImpl(dc));

  // ── Checkout module ──────────────────────────────────────────
  register(TOKENS.CartItemRepository, new CartItemRepositoryImpl(dc));

  // ── Deliveries module ────────────────────────────────────────
  register(TOKENS.DeliveryManagerRepository, new DeliveryManagerRepositoryImpl(dc));

  // ── Building Services module ─────────────────────────────────
  register(TOKENS.ServiceWorkerRepository, new ServiceWorkerRepositoryImpl(dc));

  // ── Experts module ───────────────────────────────────────────
  register(TOKENS.ExpertAvailabilityRepository, new ExpertAvailabilityRepositoryImpl(dc));
  register(TOKENS.ExpertWishlistRepository, new ExpertWishlistRepositoryImpl(dc));

  // ── Reviews module ───────────────────────────────────────────
  register(TOKENS.ExpertReviewRepository, new ExpertReviewRepositoryImpl(dc));

  // ── Engagement module ────────────────────────────────────────
  register(TOKENS.WishlistRepository, new WishlistRepositoryImpl(dc));

  // ── Admin module ─────────────────────────────────────────────
  register(TOKENS.AuditLogRepository, new AuditLogRepositoryImpl(dc));

  bootstrapped = true;
}

export function isBootstrapped(): boolean {
  return bootstrapped;
}
