/**
 * Domain contracts. Modules depend on these interfaces, not concrete
 * implementations. Adapters live in `@core/adapters/*` (or per-module
 * `services/`) and are wired by the composition root.
 *
 * Laravel mapping: `app/Contracts/*.php` bound in service providers.
 */

export interface PaymentInterface {
  charge(input: { amount: number; currency: string; reference: string; userId: string }): Promise<{ paymentId: string; status: "succeeded" | "failed" | "pending" }>;
  refund(input: { paymentId: string; amount?: number }): Promise<{ refundId: string }>;
}

export interface NotificationInterface {
  send(input: {
    userId: string;
    channel: "email" | "push" | "in_app" | "sms";
    template: string;
    data: Record<string, unknown>;
  }): Promise<void>;
}

export interface StorageInterface {
  upload(bucket: string, path: string, file: File | Blob): Promise<{ url: string }>;
  remove(bucket: string, path: string): Promise<void>;
  signedUrl(bucket: string, path: string, expiresIn?: number): Promise<string>;
}

export interface SearchInterface<T = unknown> {
  query(input: { q: string; filters?: Record<string, unknown>; page?: number; perPage?: number }): Promise<{ items: T[]; total: number }>;
}

export interface MessagingInterface {
  sendMessage(input: { conversationId: string; senderId: string; body: string }): Promise<{ messageId: string }>;
}

export interface AnalyticsInterface {
  track(event: string, payload?: Record<string, unknown>): void;
}

export interface AuditInterface {
  log(input: { actorId: string; action: string; subjectType: string; subjectId: string; meta?: Record<string, unknown> }): Promise<void>;
}

export interface CacheInterface {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  invalidate(key: string): Promise<void>;
}
