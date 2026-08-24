/**
 * Infrastructure Layer - Repository implementations, adapters, external service clients.
 * Implements domain contracts and ports.
 *
 * Laravel mapping: app/Infrastructure/*
 */

import type {
  DataClient,
  AuthClient,
  StorageClient,
  PaymentInterface,
  NotificationInterface,
  SearchInterface,
  MessagingInterface,
  AnalyticsInterface,
  AuditInterface,
  CacheInterface,
} from "@core/contracts";
import type {
  PaymentPort,
  NotificationPort,
  MessagingPort,
  SearchPort,
  StoragePort,
  AnalyticsPort,
  AuditPort,
  CachePort,
} from "@core/application";
import type { QueryParams, PaginatedResult, UnitOfWork } from "@core/domain";

// ── Data Access Adapter ──────────────────────────────────────────

export class DataClientAdapter implements DataClient {
  constructor(private readonly client: DataClient) {}

  from<K extends any>(table: K): any {
    return this.client.from(table as any);
  }

  rpc<T>(functionName: string, params?: Record<string, unknown>): Promise<T> {
    return this.client.rpc(functionName, params);
  }
}

// ── Auth Adapter ─────────────────────────────────────────────────

export class AuthClientAdapter implements AuthClient {
  constructor(private readonly client: AuthClient) {}

  getSession(): Promise<{ data: { session: any | null }; error: Error | null }> {
    return this.client.getSession();
  }

  getUser(): Promise<{ data: { user: any | null }; error: Error | null }> {
    return this.client.getUser();
  }

  signUp(input: { email: string; password: string; options?: { data?: Record<string, unknown> } }): Promise<{ data: { user: any | null }; error: Error | null }> {
    return this.client.signUp(input);
  }

  signIn(input: { email: string; password: string }): Promise<{ data: { user: any | null }; error: Error | null }> {
    return this.client.signIn(input);
  }

  signOut(): Promise<{ error: Error | null }> {
    return this.client.signOut();
  }

  onAuthStateChange(callback: (event: string, session: any | null) => void): { data: { subscription: { unsubscribe: () => void } } } {
    return this.client.onAuthStateChange(callback);
  }
}

// ── Storage Adapter ──────────────────────────────────────────────

export class StorageClientAdapter implements StorageClient {
  constructor(private readonly client: StorageClient) {}

  from(bucket: string): any {
    return this.client.from(bucket);
  }
}

// ── Payment Adapter ──────────────────────────────────────────────

export class PaymentAdapter implements PaymentPort {
  constructor(private readonly paymentClient: PaymentInterface) {}

  async charge(input: {
    amount: number;
    currency: string;
    reference: string;
    userId: string;
  }): Promise<{ paymentId: string; status: "succeeded" | "failed" | "pending" }> {
    return this.paymentClient.charge(input);
  }

  async refund(input: { paymentId: string; amount?: number }): Promise<{ refundId: string }> {
    return this.paymentClient.refund(input);
  }
}

// ── Notification Adapter ─────────────────────────────────────────

export class NotificationAdapter implements NotificationPort {
  constructor(private readonly notificationClient: NotificationInterface) {}

  async send(input: {
    userId: string;
    channel: "email" | "push" | "in_app" | "sms";
    template: string;
    data: Record<string, unknown>;
  }): Promise<void> {
    return this.notificationClient.send(input);
  }
}

// ── Messaging Adapter ────────────────────────────────────────────

export class MessagingAdapter implements MessagingPort {
  constructor(private readonly messagingClient: MessagingInterface) {}

  async sendMessage(input: {
    conversationId: string;
    senderId: string;
    body: string;
  }): Promise<{ messageId: string }> {
    return this.messagingClient.sendMessage(input);
  }
}

// ── Search Adapter ───────────────────────────────────────────────

export class SearchAdapter<T> implements SearchPort<T> {
  constructor(private readonly searchClient: SearchInterface<T>) {}

  async query(input: {
    q: string;
    filters?: Record<string, unknown>;
    page?: number;
    perPage?: number;
  }): Promise<{ items: T[]; total: number }> {
    return this.searchClient.query(input);
  }
}

// ── Storage Adapter ──────────────────────────────────────────────

export class StorageAdapter implements StoragePort {
  constructor(private readonly storageClient: StorageClient) {}

  async upload(path: string, file: File | Blob, options?: { contentType?: string }): Promise<{ url: string }> {
    const bucket = this.storageClient.from("uploads");
    const result = await bucket.upload(path, file, options);
    if (result.error) throw result.error;
    const { data } = bucket.getPublicUrl(path);
    return { url: data.publicUrl };
  }

  async delete(path: string): Promise<void> {
    const bucket = this.storageClient.from("uploads");
    const result = await bucket.remove([path]);
    if (result.error) throw result.error;
  }

  getPublicUrl(path: string): string {
    const bucket = this.storageClient.from("uploads");
    const { data } = bucket.getPublicUrl(path);
    return data.publicUrl;
  }
}

// ── Analytics Adapter ────────────────────────────────────────────

export class AnalyticsAdapter implements AnalyticsPort {
  constructor(private readonly analyticsClient: AnalyticsInterface) {}

  track(event: string, payload?: Record<string, unknown>): void {
    this.analyticsClient.track(event, payload);
  }
}

// ── Audit Adapter ────────────────────────────────────────────────

export class AuditAdapter implements AuditPort {
  constructor(private readonly auditClient: AuditInterface) {}

  async log(input: {
    actorId: string;
    action: string;
    subjectType: string;
    subjectId: string;
    meta?: Record<string, unknown>;
  }): Promise<void> {
    return this.auditClient.log(input);
  }
}

// ── Cache Adapter ────────────────────────────────────────────────

export class CacheAdapter implements CachePort {
  constructor(private readonly cacheClient: CacheInterface) {}

  async get<T>(key: string): Promise<T | null> {
    return this.cacheClient.get<T>(key);
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    return this.cacheClient.set<T>(key, value, ttlSeconds);
  }

  async invalidate(key: string): Promise<void> {
    return this.cacheClient.invalidate(key);
  }
}

// ── Repository Base ──────────────────────────────────────────────

export abstract class BaseRepository<T, TInsert = Partial<T>, TUpdate = Partial<T>> {
  protected dataClient: DataClient;

  constructor(dataClient: DataClient) {
    this.dataClient = dataClient;
  }

  abstract get TableName(): string;

  async findById(id: string): Promise<T | null> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("id", "=", id)
      .single();
    return result as T | null;
  }

  async findMany(params?: QueryParams): Promise<PaginatedResult<T>> {
    let query = this.dataClient.from(this.TableName as any);

    if (params?.filters) {
      for (const filter of params.filters) {
        query = query.where(filter.field, filter.operator as any, filter.value);
      }
    }

    if (params?.sort) {
      for (const sort of params.sort) {
        query = query.orderBy(sort.field, sort.direction === "asc");
      }
    }

    if (params?.pagination) {
      query = query.limit(params.pagination.perPage);
      query = query.offset((params.pagination.page - 1) * params.pagination.perPage);
    }

    const items = await query;
    const total = await this.count(params?.filters);

    return {
      items: items as T[],
      total,
      page: params?.pagination?.page || 1,
      perPage: params?.pagination?.perPage || 10,
      totalPages: Math.ceil(total / (params?.pagination?.perPage || 10)),
    };
  }

  async create(data: TInsert): Promise<T> {
    const result = (await this.dataClient
      .from(this.TableName as any)
      .insert(data as any)
      .single()) as T | null;
    return result as T;
  }

  async update(id: string, data: TUpdate): Promise<T> {
    const result = (await this.dataClient
      .from(this.TableName as any)
      .where("id", "=", id)
      .update(data as any)
      .single()) as T | null;
    return result as T;
  }

  async delete(id: string): Promise<boolean> {
    const result = (await this.dataClient
      .from(this.TableName as any)
      .where("id", "=", id)
      .delete()) as unknown as { error: Error | null };
    return !result?.error;
  }

  async exists(id: string): Promise<boolean> {
    const item = await this.findById(id);
    return item !== null;
  }

  async count(filters?: any[]): Promise<number> {
    let query = this.dataClient.from(this.TableName as any).select("id");

    if (filters) {
      for (const filter of filters) {
        query = query.where(filter.field, filter.operator, filter.value);
      }
    }

    const result = await query;
    return Array.isArray(result) ? result.length : 0;
  }
}

// ── Unit of Work Implementation ──────────────────────────────────

type PendingOperation = {
  id: string;
  table: string;
  type: "create" | "update" | "delete";
  data?: unknown;
  previousData?: unknown;
};

export class UnitOfWorkImpl implements UnitOfWork {
  private transactionId: string;
  private dataClient: DataClient;
  private pendingOperations: PendingOperation[] = [];
  private isActive = false;

  constructor(dataClient: DataClient) {
    this.dataClient = dataClient;
    this.transactionId = crypto.randomUUID();
  }

  getTransactionId(): string {
    return this.transactionId;
  }

  async begin(): Promise<void> {
    if (this.isActive) {
      throw new Error(`Transaction ${this.transactionId} is already active`);
    }
    this.isActive = true;
    this.pendingOperations = [];
  }

  async commit(): Promise<void> {
    if (!this.isActive) {
      throw new Error(`Transaction ${this.transactionId} is not active`);
    }
    this.pendingOperations = [];
    this.isActive = false;
  }

  async rollback(): Promise<void> {
    if (!this.isActive) {
      throw new Error(`Transaction ${this.transactionId} is not active`);
    }

    // Execute compensating operations in reverse order
    for (const op of this.pendingOperations.reverse()) {
      try {
        switch (op.type) {
          case "create":
            // Undo create = delete
            await this.dataClient.from(op.table as any).where("id", "=", op.id).delete();
            break;
          case "update":
            // Undo update = restore previous data
            if (op.previousData) {
              await this.dataClient.from(op.table as any).where("id", "=", op.id).update(op.previousData);
            }
            break;
          case "delete":
            // Undo delete = re-create
            if (op.previousData) {
              await this.dataClient.from(op.table as any).insert(op.previousData);
            }
            break;
        }
      } catch {
        // Compensation failed — log but continue rolling back remaining operations
        console.error(`Failed to compensate operation ${op.id} on ${op.table}`);
      }
    }

    this.pendingOperations = [];
    this.isActive = false;
  }

  trackOperation(op: PendingOperation): void {
    if (this.isActive) {
      this.pendingOperations.push(op);
    }
  }

  isTransactionActive(): boolean {
    return this.isActive;
  }
}
