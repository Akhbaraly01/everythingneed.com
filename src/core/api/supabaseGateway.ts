/**
 * Module-facing Supabase gateway. Modules MUST go through this rather than
 * importing `@/integrations/supabase/client` directly. Centralises auth
 * header, retries, audit hooks and lets us swap the backend later
 * (Laravel API) without rewriting modules.
 */
import { supabase as raw } from "@/integrations/supabase/client";
import { logger } from "@core/logging";

/** Re-exported for modules to use via `@core/api/supabaseGateway` only.
 * Direct imports from `@/integrations/supabase/*` are blocked by ESLint
 * and `scripts/check-api-usage.mjs`. */
export const supabase = raw;
import { logger } from "@core/logging";

export type TableName = Parameters<typeof raw.from>[0];

export const supabaseGateway = {
  from: (table: TableName) => raw.from(table),
  storage: raw.storage,
  auth: raw.auth,
  functions: raw.functions,
  rpc: raw.rpc.bind(raw),
};

export async function safeQuery<T>(fn: () => Promise<{ data: T | null; error: unknown }>): Promise<T> {
  const { data, error } = await fn();
  if (error) {
    logger?.error?.("[supabaseGateway] query failed", { error });
    throw error;
  }
  return data as T;
}
