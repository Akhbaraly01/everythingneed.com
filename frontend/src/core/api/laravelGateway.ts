/**
 * Laravel REST gateway — the single module-facing data plane.
 *
 * Every table operation flows through the authenticated Laravel API
 * (`/api/db/{table}`), where the backend enforces a strict resource
 * whitelist, column validation and per-user ownership scoping before
 * touching PostgreSQL. Modules must import `db`, `auth` and `storage`
 * from this file instead of reaching into infrastructure directly.
 */

import { authClient, dataClient, storageClient } from "@core/services";
import { logger } from "@core/logging";
import type { DataClient, AuthClient, StorageClient } from "@core/contracts";
import type { TableName } from "@core/api/types";

// ── Clients ────────────────────────────────────────────────────────

/** Laravel-backed query client — use for all table operations. */
export const db: DataClient = dataClient;

/** Sanctum authentication client — login/register/logout/session. */
export const auth: AuthClient = authClient;

/** File storage client backed by Laravel's filesystem endpoints. */
export const storage: StorageClient = storageClient;

// ── Typed convenience helpers ──────────────────────────────────────

/**
 * Shorthand: `from("products").select("*").eq("is_active", true)`.
 * Returns a thenable (awaitable) query builder.
 */
export function from<K extends TableName>(table: K) {
  return dataClient.from(table);
}

/**
 * Execute a server-side function endpoint (Laravel action exposed via REST).
 */
export async function rpc<T>(fn: string, params?: Record<string, unknown>): Promise<T> {
  return dataClient.rpc<T>(fn, params);
}

// ── Safe query wrapper ─────────────────────────────────────────────

export async function safeQuery<T>(fn: () => Promise<{ data: T | null; error: unknown }>): Promise<T> {
  const { data, error } = await fn();
  if (error) {
    logger.error("[laravelGateway]", "Query failed", { error });
    throw error;
  }
  return data as T;
}
