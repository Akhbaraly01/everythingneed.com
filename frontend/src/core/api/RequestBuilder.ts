/**
 * Fluent HTTP request builder layered over fetch. All module-level HTTP
 * MUST go through this so we get unified auth, retry,
 * caching, and error semantics — mirroring Laravel's HTTP client.
 */
import { logger } from "@core/logging";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions {
  method?: Method;
  headers?: Record<string, string>;
  body?: unknown;
  retries?: number;
  retryDelayMs?: number;
  cacheTtlSeconds?: number;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  constructor(public status: number, public body: unknown, message?: string) {
    super(message ?? `HTTP ${status}`);
  }
}

const memoryCache = new Map<string, { at: number; ttl: number; value: unknown }>();

let authTokenProvider: () => string | null = () => null;
export const setAuthTokenProvider = (fn: () => string | null) => {
  authTokenProvider = fn;
};

export async function request<T>(url: string, opts: RequestOptions = {}): Promise<T> {
  const method = opts.method ?? "GET";
  const cacheKey = method === "GET" && opts.cacheTtlSeconds ? `${method}:${url}` : null;

  if (cacheKey) {
    const hit = memoryCache.get(cacheKey);
    if (hit && Date.now() - hit.at < hit.ttl * 1000) return hit.value as T;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers ?? {}),
  };
  const token = authTokenProvider();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const maxAttempts = Math.max(1, (opts.retries ?? 0) + 1);
  const delay = opts.retryDelayMs ?? 250;
  let lastErr: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, {
        method,
        headers,
        body: opts.body != null ? JSON.stringify(opts.body) : undefined,
        signal: opts.signal,
      });
      const text = await res.text();
      const data = text ? safeJson(text) : null;
      if (!res.ok) throw new ApiError(res.status, data);
      if (cacheKey) memoryCache.set(cacheKey, { at: Date.now(), ttl: opts.cacheTtlSeconds!, value: data });
      return data as T;
    } catch (err) {
      lastErr = err;
      const retriable = err instanceof ApiError ? err.status >= 500 : true;
      if (attempt < maxAttempts && retriable) {
        await new Promise((r) => setTimeout(r, delay * attempt));
        continue;
      }
      logger?.error?.("[api] request failed", { url, method, err });
      throw err;
    }
  }
  throw lastErr;
}

function safeJson(s: string) {
  try { return JSON.parse(s); } catch { return s; }
}

/** Serialize optional query params into a URL query string ("?a=1&b=2"). */
export function qs(params?: Record<string, unknown>): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}

export const http = {
  get: <T>(url: string, opts?: Omit<RequestOptions, "method" | "body">) => request<T>(url, { ...opts, method: "GET" }),
  post: <T>(url: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) => request<T>(url, { ...opts, method: "POST", body }),
  put: <T>(url: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) => request<T>(url, { ...opts, method: "PUT", body }),
  patch: <T>(url: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) => request<T>(url, { ...opts, method: "PATCH", body }),
  delete: <T>(url: string, opts?: Omit<RequestOptions, "method" | "body">) => request<T>(url, { ...opts, method: "DELETE" }),
};

export function invalidateCache(prefix?: string) {
  if (!prefix) return memoryCache.clear();
  for (const k of memoryCache.keys()) if (k.includes(prefix)) memoryCache.delete(k);
}
