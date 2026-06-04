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
  // Order module
  OrderCreated: { orderId: string; userId: string; total: number; currency: string };
  OrderCancelled: { orderId: string; reason?: string };

  // Payment module
  PaymentCompleted: { orderId: string; paymentId: string; amount: number };
  PaymentFailed: { orderId: string; reason: string };

  // Delivery module
  DeliveryCreated: { orderId: string; deliveryId: string };
  DeliveryStatusChanged: { deliveryId: string; status: string };

  // Wallet module
  WalletDebited: { userId: string; amount: number; reference: string };
  WalletCredited: { userId: string; amount: number; reference: string };

  // Healthcare module
  AppointmentBooked: { ticketId: string; doctorId: string | null; userId: string };
  AppointmentCancelled: { ticketId: string };

  // Notification module (cross-module sink)
  NotificationRequested: {
    userId: string;
    channel: "email" | "push" | "in_app" | "sms";
    template: string;
    data: Record<string, unknown>;
  };

  // Authentication module
  UserSignedIn: { userId: string };
  UserSignedOut: { userId: string };

  // Extend per-module as needed.
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
