/**
 * Domain contracts. Modules depend on these interfaces, not concrete
 * implementations. Adapters live in `@core/services/*` and are wired
 * by the composition root.
 *
 * Laravel mapping: `app/Contracts/*.php` bound in service providers.
 */

import type { TableName, TableRow, TableInsert, TableUpdate, User, Session } from "@core/api/types";

// ── Data Access Contract ───────────────────────────────────────────
//
// Laravel REST gateway: reads/writes hit /api/db/{table} where every
// query is authenticated, whitelisted, and ownership-scoped server-side.

export interface DataFilter {
  column: string;
  op: string;
  value: unknown;
}

export interface DataQueryBuilder<T> {
  select(columns?: string): DataQueryBuilder<T>;
  where(column: string, op: string, value: unknown): DataQueryBuilder<T>;
  orderBy(column: string, ascending?: boolean): DataQueryBuilder<T>;
  limit(count: number): DataQueryBuilder<T>;
  offset(count: number): DataQueryBuilder<T>;

  // Fluent filter aliases
  eq(column: string, value: unknown): DataQueryBuilder<T>;
  neq(column: string, value: unknown): DataQueryBuilder<T>;
  gt(column: string, value: unknown): DataQueryBuilder<T>;
  gte(column: string, value: unknown): DataQueryBuilder<T>;
  lt(column: string, value: unknown): DataQueryBuilder<T>;
  lte(column: string, value: unknown): DataQueryBuilder<T>;
  like(column: string, value: string): DataQueryBuilder<T>;
  ilike(column: string, value: string): DataQueryBuilder<T>;
  contains(column: string, value: unknown): DataQueryBuilder<T>;
  in(column: string, values: unknown[]): DataQueryBuilder<T>;
  order(column: string, options?: { ascending?: boolean; foreignTable?: string }): DataQueryBuilder<T>;

  // Writes (POST/PATCH/DELETE against the gateway).
  // Each returns the builder so calls chain and execute on await.
  insert(data: Partial<T> | Partial<T>[]): DataQueryBuilder<T>;
  upsert(data: Partial<T>): DataQueryBuilder<T>;
  update(data: Partial<T>): DataQueryBuilder<T>;
  delete(): DataQueryBuilder<T>;

  single(): Promise<T | null>;
  maybeSingle(): Promise<T | null>;
  then(resolve: (rows: unknown) => unknown): Promise<unknown>;
}

export interface DataClient {
  from<K extends TableName>(table: K): DataQueryBuilder<TableRow<K>>;
  rpc<T>(functionName: string, params?: Record<string, unknown>): Promise<T>;
}

// ── Auth Contract ──────────────────────────────────────────────────

export interface AuthClient {
  getSession(): Promise<{ data: { session: Session | null }; error: Error | null }>;
  getUser(): Promise<{ data: { user: User | null }; error: Error | null }>;
  signUp(input: { email: string; password: string; options?: { data?: Record<string, unknown> } }): Promise<{ data: { user: User | null }; error: Error | null }>;
  signIn(input: { email: string; password: string }): Promise<{ data: { user: User | null }; error: Error | null }>;
  signOut(): Promise<{ error: Error | null }>;
  onAuthStateChange(callback: (event: string, session: Session | null) => void): { data: { subscription: { unsubscribe: () => void } } };
}

// ── Storage Contract ───────────────────────────────────────────────

export interface StorageBucket {
  upload(path: string, file: File | Blob, options?: { contentType?: string }): Promise<{ data: { path: string }; error: Error | null }>;
  getPublicUrl(path: string): { data: { publicUrl: string } };
  remove(paths: string[]): Promise<{ data: unknown; error: Error | null }>;
  list(prefix?: string, options?: { limit?: number; offset?: number }): Promise<{ data: Array<{ name: string }>; error: Error | null }>;
}

export interface StorageClient {
  from(bucket: string): StorageBucket;
}

// ── Existing contracts (kept from original) ────────────────────────

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
