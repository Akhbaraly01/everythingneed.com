/**
 * Typed Event Bus for cross-module communication.
 *
 * Modules MUST NOT import each other's internals. Instead, they emit
 * typed events here and other modules subscribe. This mirrors how
 * Laravel's event/listener system will work after migration.
 *
 * Example:
 *   import { eventBus } from "@core/events/EventBus";
 *   eventBus.emit("OrderCreated", { orderId, userId, total });
 *   eventBus.on("OrderCreated", (p) => paymentService.charge(p));
 */

export interface DomainEventMap {
  // ── Order module ─────────────────────────────────────────────
  OrderCreated: { orderId: string; userId: string; total: number; currency: string };
  OrderCancelled: { orderId: string; reason?: string };
  OrderConfirmed: { orderId: string };
  OrderShipped: { orderId: string; trackingNumber?: string; estimatedDelivery?: string };
  OrderDelivered: { orderId: string };

  // ── Payment module ───────────────────────────────────────────
  PaymentInitiated: { paymentId: string; orderId: string; userId: string; amount: number; currency: string };
  PaymentCompleted: { orderId: string; paymentId: string; amount: number };
  PaymentFailed: { orderId: string; reason: string };
  RefundInitiated: { refundId: string; paymentId: string; amount: number };
  RefundCompleted: { refundId: string; paymentId: string; amount: number };

  // ── Delivery module ──────────────────────────────────────────
  DeliveryCreated: { orderId: string; deliveryId: string };
  DeliveryStatusChanged: { deliveryId: string; status: string };
  ShipmentCreated: { shipmentId: string; orderId: string };
  TrackingUpdated: { shipmentId: string; status: string };

  // ── Wallet module ────────────────────────────────────────────
  WalletDebited: { userId: string; amount: number; reference: string };
  WalletCredited: { userId: string; amount: number; reference: string };

  // ── Healthcare module ────────────────────────────────────────
  AppointmentBooked: { ticketId: string; doctorId: string | null; userId: string };
  AppointmentCancelled: { ticketId: string };
  DoctorAssigned: { ticketId: string; doctorId: string };
  ConsultationStarted: { ticketId: string; doctorId: string; patientId: string };
  ConsultationCompleted: { ticketId: string; doctorId: string; patientId: string };

  // ── Authentication module ────────────────────────────────────
  UserSignedUp: { userId: string; email: string };
  UserSignedIn: { userId: string };
  UserSignedOut: { userId: string };

  // ── Users module ─────────────────────────────────────────────
  UserProfileUpdated: { userId: string; changes: Record<string, unknown> };
  UserRoleAssigned: { userId: string; role: string; categoryId?: string };
  UserRoleRemoved: { userId: string; role: string };
  UserDeactivated: { userId: string; reason?: string };
  UserReactivated: { userId: string };

  // ── Products module ──────────────────────────────────────────
  ProductCreated: { productId: string; vendorId: string; name: string; price: number };
  ProductUpdated: { productId: string; changes: Record<string, unknown> };
  ProductDeleted: { productId: string };
  ProductStockChanged: { productId: string; previousQuantity: number; newQuantity: number };
  ProductReviewed: { productId: string; reviewId: string; userId: string; rating: number };

  // ── Vendors module ───────────────────────────────────────────
  VendorRegistered: { vendorId: string; userId: string; storeName: string };
  VendorVerified: { vendorId: string };
  VendorSuspended: { vendorId: string; reason?: string };

  // ── Pharmacy module ──────────────────────────────────────────
  MedicineCreated: { medicineId: string; name: string; category: string };
  MedicineStockChanged: { medicineId: string; previousQuantity: number; newQuantity: number };

  // ── Bookings module ──────────────────────────────────────────
  BookingCreated: { bookingId: string; userId: string; serviceType: string };
  BookingConfirmed: { bookingId: string };
  BookingCompleted: { bookingId: string };
  BookingCancelled: { bookingId: string; reason?: string };

  // ── Messaging module ─────────────────────────────────────────
  ConversationCreated: { conversationId: string; customerId: string; workerId?: string };
  MessageSent: { conversationId: string; messageId: string; senderId: string };

  // ── Notifications module (cross-module sink) ─────────────────
  NotificationRequested: {
    userId: string;
    channel: "email" | "push" | "in_app" | "sms";
    template: string;
    data: Record<string, unknown>;
  };
  NotificationCreated: { notificationId: string; userId: string; title: string; type: string };

  // ── Learn module ─────────────────────────────────────────────
  PostCreated: { postId: string; userId: string; title: string; category: string };
  PostLiked: { postId: string; userId: string };
  PostCommented: { postId: string; commentId: string; userId: string };

  // ── Tickets module ───────────────────────────────────────────
  TicketCreated: { ticketId: string; ticketNumber: string; userId: string; priority: string };
  TicketAssigned: { ticketId: string; assigneeId: string };
  TicketStatusChanged: { ticketId: string; oldStatus: string; newStatus: string };
  TicketResolved: { ticketId: string; resolution?: string };

  // ── Subscriptions module ─────────────────────────────────────
  SubscriptionCreated: { subscriptionId: string; userId: string; planId: string };
  SubscriptionRenewed: { subscriptionId: string };
  SubscriptionCancelled: { subscriptionId: string; reason?: string };
  SubscriptionExpired: { subscriptionId: string };

  // ── Analytics module ─────────────────────────────────────────
  AnalyticsEventTracked: { eventId: string; eventType: string; userId?: string };

  // ── Settings module ──────────────────────────────────────────
  SettingUpdated: { settingId: string; key: string; oldValue: unknown; newValue: unknown };

  // ── Experts module ───────────────────────────────────────────
  ExpertRegistered: { expertId: string; userId: string; specialization: string };
  ExpertReviewed: { expertId: string; reviewId: string; userId: string; rating: number };

  // ── Needs module ─────────────────────────────────────────────
  NeedCategoryCreated: { categoryId: string; name: string; slug: string };
  NeedItemCreated: { itemId: string; categoryId: string; name: string };

  // ── Building Services module ─────────────────────────────────
  ServiceWorkerRegistered: { workerId: string; userId: string; workerType: string };
  ServiceBookingCreated: { bookingId: string; userId: string; workerType: string };

  // ── Roles module ─────────────────────────────────────────────
  RoleAssigned: { userId: string; role: string; categoryId?: string };
  RoleRevoked: { userId: string; role: string };

  // ── Permissions module ───────────────────────────────────────
  PermissionGranted: { roleId: string; permission: string };
  PermissionRevoked: { roleId: string; permission: string };

  // ── Inventory module ─────────────────────────────────────────
  StockAdjusted: { productId: string; previousQuantity: number; newQuantity: number };
  StockReserved: { productId: string; quantity: number; orderId: string };

  // ── Checkout module ──────────────────────────────────────────
  ItemAddedToCart: { userId: string; productId: string; quantity: number };
  CouponApplied: { userId: string; couponCode: string; discount: number };

  // ── Extend per-module as needed. ─────────────────────────────
  [key: string]: unknown;
}

type Handler<T> = (payload: T) => void | Promise<void>;

class EventBus {
  private handlers = new Map<string, Set<Handler<any>>>();

  on<K extends keyof DomainEventMap>(event: K, handler: Handler<DomainEventMap[K]>): () => void {
    const key = String(event);
    if (!this.handlers.has(key)) this.handlers.set(key, new Set());
    this.handlers.get(key)!.add(handler as Handler<any>);
    return () => this.off(event, handler);
  }

  off<K extends keyof DomainEventMap>(event: K, handler: Handler<DomainEventMap[K]>) {
    this.handlers.get(String(event))?.delete(handler as Handler<any>);
  }

  emit<K extends keyof DomainEventMap>(event: K, payload: DomainEventMap[K]) {
    const set = this.handlers.get(String(event));
    if (!set) return;
    for (const h of set) {
      try {
        void h(payload);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[EventBus] handler for ${String(event)} threw:`, err);
      }
    }
  }

  clear() {
    this.handlers.clear();
  }
}

export const eventBus = new EventBus();
