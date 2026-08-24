/**
 * Runtime (zod) schemas for DomainEventMap.
 *
 * Source of truth: keep keys in sync with `DomainEventMap` in EventBus.ts.
 * Used by `scripts/check-event-contracts.mjs` to assert the two stay aligned
 * before build, and (optionally) by emitters in dev to validate payloads.
 */
import { z } from "zod";

export const domainEventSchemas = {
  // ── Order module ─────────────────────────────────────────────
  OrderCreated: z.object({
    orderId: z.string(),
    userId: z.string(),
    total: z.number(),
    currency: z.string(),
  }),
  OrderCancelled: z.object({ orderId: z.string(), reason: z.string().optional() }),
  OrderConfirmed: z.object({ orderId: z.string() }),
  OrderShipped: z.object({ orderId: z.string(), trackingNumber: z.string().optional(), estimatedDelivery: z.string().optional() }),
  OrderDelivered: z.object({ orderId: z.string() }),

  // ── Payment module ───────────────────────────────────────────
  PaymentInitiated: z.object({
    paymentId: z.string(),
    orderId: z.string(),
    userId: z.string(),
    amount: z.number(),
    currency: z.string(),
  }),
  PaymentCompleted: z.object({
    orderId: z.string(),
    paymentId: z.string(),
    amount: z.number(),
  }),
  PaymentFailed: z.object({ orderId: z.string(), reason: z.string() }),
  RefundInitiated: z.object({ refundId: z.string(), paymentId: z.string(), amount: z.number() }),
  RefundCompleted: z.object({ refundId: z.string(), paymentId: z.string(), amount: z.number() }),

  // ── Delivery module ──────────────────────────────────────────
  DeliveryCreated: z.object({ orderId: z.string(), deliveryId: z.string() }),
  DeliveryStatusChanged: z.object({ deliveryId: z.string(), status: z.string() }),
  ShipmentCreated: z.object({ shipmentId: z.string(), orderId: z.string() }),
  TrackingUpdated: z.object({ shipmentId: z.string(), status: z.string() }),

  // ── Wallet module ────────────────────────────────────────────
  WalletDebited: z.object({
    userId: z.string(),
    amount: z.number(),
    reference: z.string(),
  }),
  WalletCredited: z.object({
    userId: z.string(),
    amount: z.number(),
    reference: z.string(),
  }),

  // ── Healthcare module ────────────────────────────────────────
  AppointmentBooked: z.object({
    ticketId: z.string(),
    doctorId: z.string().nullable(),
    userId: z.string(),
  }),
  AppointmentCancelled: z.object({ ticketId: z.string() }),
  DoctorAssigned: z.object({ ticketId: z.string(), doctorId: z.string() }),
  ConsultationStarted: z.object({ ticketId: z.string(), doctorId: z.string(), patientId: z.string() }),
  ConsultationCompleted: z.object({ ticketId: z.string(), doctorId: z.string(), patientId: z.string() }),

  // ── Authentication module ────────────────────────────────────
  UserSignedUp: z.object({ userId: z.string(), email: z.string() }),
  UserSignedIn: z.object({ userId: z.string() }),
  UserSignedOut: z.object({ userId: z.string() }),

  // ── Users module ─────────────────────────────────────────────
  UserProfileUpdated: z.object({ userId: z.string(), changes: z.record(z.unknown()) }),
  UserRoleAssigned: z.object({ userId: z.string(), role: z.string(), categoryId: z.string().optional() }),
  UserRoleRemoved: z.object({ userId: z.string(), role: z.string() }),
  UserDeactivated: z.object({ userId: z.string(), reason: z.string().optional() }),
  UserReactivated: z.object({ userId: z.string() }),

  // ── Products module ──────────────────────────────────────────
  ProductCreated: z.object({ productId: z.string(), vendorId: z.string(), name: z.string(), price: z.number() }),
  ProductUpdated: z.object({ productId: z.string(), changes: z.record(z.unknown()) }),
  ProductDeleted: z.object({ productId: z.string() }),
  ProductStockChanged: z.object({ productId: z.string(), previousQuantity: z.number(), newQuantity: z.number() }),
  ProductReviewed: z.object({ productId: z.string(), reviewId: z.string(), userId: z.string(), rating: z.number() }),

  // ── Vendors module ───────────────────────────────────────────
  VendorRegistered: z.object({ vendorId: z.string(), userId: z.string(), storeName: z.string() }),
  VendorVerified: z.object({ vendorId: z.string() }),
  VendorSuspended: z.object({ vendorId: z.string(), reason: z.string().optional() }),

  // ── Pharmacy module ──────────────────────────────────────────
  MedicineCreated: z.object({ medicineId: z.string(), name: z.string(), category: z.string() }),
  MedicineStockChanged: z.object({ medicineId: z.string(), previousQuantity: z.number(), newQuantity: z.number() }),

  // ── Bookings module ──────────────────────────────────────────
  BookingCreated: z.object({ bookingId: z.string(), userId: z.string(), serviceType: z.string() }),
  BookingConfirmed: z.object({ bookingId: z.string() }),
  BookingCompleted: z.object({ bookingId: z.string() }),
  BookingCancelled: z.object({ bookingId: z.string(), reason: z.string().optional() }),

  // ── Messaging module ─────────────────────────────────────────
  ConversationCreated: z.object({ conversationId: z.string(), customerId: z.string(), workerId: z.string().optional() }),
  MessageSent: z.object({ conversationId: z.string(), messageId: z.string(), senderId: z.string() }),

  // ── Notifications module ─────────────────────────────────────
  NotificationRequested: z.object({
    userId: z.string(),
    channel: z.enum(["email", "push", "in_app", "sms"]),
    template: z.string(),
    data: z.record(z.unknown()),
  }),
  NotificationCreated: z.object({ notificationId: z.string(), userId: z.string(), title: z.string(), type: z.string() }),

  // ── Learn module ─────────────────────────────────────────────
  PostCreated: z.object({ postId: z.string(), userId: z.string(), title: z.string(), category: z.string() }),
  PostLiked: z.object({ postId: z.string(), userId: z.string() }),
  PostCommented: z.object({ postId: z.string(), commentId: z.string(), userId: z.string() }),

  // ── Tickets module ───────────────────────────────────────────
  TicketCreated: z.object({ ticketId: z.string(), ticketNumber: z.string(), userId: z.string(), priority: z.string() }),
  TicketAssigned: z.object({ ticketId: z.string(), assigneeId: z.string() }),
  TicketStatusChanged: z.object({ ticketId: z.string(), oldStatus: z.string(), newStatus: z.string() }),
  TicketResolved: z.object({ ticketId: z.string(), resolution: z.string().optional() }),

  // ── Subscriptions module ─────────────────────────────────────
  SubscriptionCreated: z.object({ subscriptionId: z.string(), userId: z.string(), planId: z.string() }),
  SubscriptionRenewed: z.object({ subscriptionId: z.string() }),
  SubscriptionCancelled: z.object({ subscriptionId: z.string(), reason: z.string().optional() }),
  SubscriptionExpired: z.object({ subscriptionId: z.string() }),

  // ── Analytics module ─────────────────────────────────────────
  AnalyticsEventTracked: z.object({ eventId: z.string(), eventType: z.string(), userId: z.string().optional() }),

  // ── Settings module ──────────────────────────────────────────
  SettingUpdated: z.object({ settingId: z.string(), key: z.string(), oldValue: z.unknown(), newValue: z.unknown() }),

  // ── Experts module ───────────────────────────────────────────
  ExpertRegistered: z.object({ expertId: z.string(), userId: z.string(), specialization: z.string() }),
  ExpertReviewed: z.object({ expertId: z.string(), reviewId: z.string(), userId: z.string(), rating: z.number() }),

  // ── Needs module ─────────────────────────────────────────────
  NeedCategoryCreated: z.object({ categoryId: z.string(), name: z.string(), slug: z.string() }),
  NeedItemCreated: z.object({ itemId: z.string(), categoryId: z.string(), name: z.string() }),

  // ── Building Services module ─────────────────────────────────
  ServiceWorkerRegistered: z.object({ workerId: z.string(), userId: z.string(), workerType: z.string() }),
  ServiceBookingCreated: z.object({ bookingId: z.string(), userId: z.string(), workerType: z.string() }),

  // ── Roles module ─────────────────────────────────────────────
  RoleAssigned: z.object({ userId: z.string(), role: z.string(), categoryId: z.string().optional() }),
  RoleRevoked: z.object({ userId: z.string(), role: z.string() }),

  // ── Permissions module ───────────────────────────────────────
  PermissionGranted: z.object({ roleId: z.string(), permission: z.string() }),
  PermissionRevoked: z.object({ roleId: z.string(), permission: z.string() }),

  // ── Inventory module ─────────────────────────────────────────
  StockAdjusted: z.object({ productId: z.string(), previousQuantity: z.number(), newQuantity: z.number() }),
  StockReserved: z.object({ productId: z.string(), quantity: z.number(), orderId: z.string() }),

  // ── Checkout module ──────────────────────────────────────────
  ItemAddedToCart: z.object({ userId: z.string(), productId: z.string(), quantity: z.number() }),
  CouponApplied: z.object({ userId: z.string(), couponCode: z.string(), discount: z.number() }),
} as const;

export type DomainEventName = keyof typeof domainEventSchemas;
