/**
 * Laravel API client — HTTP implementation for the Laravel 13 backend.
 * Sanctum token authentication, REST resources and the table gateway.
 */

import type { AuthClient, DataClient, DataQueryBuilder, StorageClient } from "@core/contracts";
import type { TableName, TableRow, DatabaseSchema } from "@core/api/types";
import { logger } from "@core/logging";

// ── Configuration ────────────────────────────────────────────────

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

// ── HTTP Client ──────────────────────────────────────────────────

class HttpClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  private resolveUrl(path: string): string {
    const url = `${this.baseUrl}${path}`;

    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    return new URL(url, window.location.origin).toString();
  }

  private getHeaders(isJson = true): Record<string, string> {
    const headers: Record<string, string> = {
      "Accept": "application/json",
    };
    if (isJson) {
      headers["Content-Type"] = "application/json";
    }
    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }
    return headers;
  }

  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    const url = new URL(this.resolveUrl(path));
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });
    }
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    const response = await fetch(this.resolveUrl(path), {
      method: "POST",
      headers: this.getHeaders(!isFormData),
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(this.resolveUrl(path), {
      method: "PUT",
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(this.resolveUrl(path), {
      method: "PATCH",
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  async delete(path: string): Promise<void> {
    const response = await fetch(this.resolveUrl(path), {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }
}

const httpClient = new HttpClient(API_BASE_URL);

// ── Laravel REST Query Builder ─────────────────────────────────────
//
// Implements the full fluent surface against /api/db/{table}. The
// backend enforces table whitelist, column validation and per-user
// ownership scoping, so this client can never read another user's rows.

type FilterOp =
  | "=" | "!=" | ">" | ">=" | "<" | "<="
  | "like" | "ilike" | "in" | "contains"
  | "eq" | "neq" | "gt" | "gte" | "lt" | "lte";

class ApiQueryBuilder<T> implements DataQueryBuilder<T> {
  private _table: string;
  private _selectCols: string | null = null;
  private _filters: Array<{ column: string; op: string; value: unknown }> = [];
  private _orderByCol: string | null = null;
  private _orderAsc = true;
  private _limitCount: number | null = null;
  private _offsetCount = 0;
  private _pendingWrite: { kind: "insert" | "update" | "delete" | "upsert"; data?: Partial<T> | Partial<T>[] } | null = null;

  constructor(table: string) {
    this._table = table;
  }

  select(columns?: string): this {
    this._selectCols = columns ?? "*";
    return this;
  }

  where(column: string, op: string, value: unknown): this {
    this._filters.push({ column, op, value });
    return this;
  }

  orderBy(column: string, ascending = true): this {
    this._orderByCol = column;
    this._orderAsc = ascending;
    return this;
  }

  limit(count: number): this {
    this._limitCount = count;
    return this;
  }

  offset(count: number): this {
    this._offsetCount = count;
    return this;
  }

  // Fluent filter aliases
  eq(column: string, value: unknown): this { return this.where(column, "eq", value); }
  neq(column: string, value: unknown): this { return this.where(column, "neq", value); }
  gt(column: string, value: unknown): this { return this.where(column, "gt", value); }
  gte(column: string, value: unknown): this { return this.where(column, "gte", value); }
  lt(column: string, value: unknown): this { return this.where(column, "lt", value); }
  lte(column: string, value: unknown): this { return this.where(column, "lte", value); }
  like(column: string, value: string): this { return this.where(column, "like", value); }
  ilike(column: string, value: string): this { return this.where(column, "ilike", value); }
  contains(column: string, value: unknown): this { return this.where(column, "contains", value); }
  in(column: string, values: unknown[]): this { return this.where(column, "in", values); }
  order(column: string, options?: { ascending?: boolean }): this {
    return this.orderBy(column, options?.ascending ?? true);
  }

  // ── Writes ──
  //
  // All writers return the builder itself (typed as a Promise for
  // compatibility). Execution is deferred until the chain is awaited,
  // so both orders work:
  //   await db.from("t").eq("id", x).update(patch)
  //   await db.from("t").update(patch).eq("id", x).select().single()
  insert(data: Partial<T> | Partial<T>[]): this {
    this._pendingWrite = { kind: "insert", data };
    return this;
  }

  upsert(data: Partial<T>): this {
    // Gateway POST creates the row; callers own uniqueness rules.
    this._pendingWrite = { kind: "upsert", data };
    return this;
  }

  update(data: Partial<T>): this {
    this._pendingWrite = { kind: "update", data };
    return this;
  }

  delete(): this {
    this._pendingWrite = { kind: "delete" };
    return this;
  }

  private async performWrite(): Promise<unknown> {
    const pending = this._pendingWrite;
    this._pendingWrite = null;

    if (!pending) {
      return this.execute();
    }

    if (pending.kind === "insert") {
      const rows = Array.isArray(pending.data) ? pending.data : [pending.data];
      const created: T[] = [];
      for (const row of rows) {
        created.push(await httpClient.post<{ data: T }>(`/db/${this._table}`, row).then((r) => r.data));
      }
      return created;
    }

    if (pending.kind === "upsert") {
      const response = await httpClient.post<{ data: T }>(`/db/${this._table}`, pending.data);
      return response.data ?? null;
    }

    const idFilter = this._filters.find((f) => f.column === "id");
    if (!idFilter) {
      throw new Error(`'${pending.kind}()' on '${this._table}' requires an .eq("id", ...) filter`);
    }

    if (pending.kind === "update") {
      const response = await httpClient.patch<{ data: T }>(`/db/${this._table}/${idFilter.value}`, pending.data);
      return response.data ?? null;
    }

    try {
      await httpClient.delete(`/db/${this._table}/${idFilter.value}`);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    try {
      const result = await this.performWrite();
      if (!onfulfilled) {
        return result as TResult1;
      }
      return await onfulfilled(result);
    } catch (error) {
      if (onrejected) {
        return await onrejected(error);
      }
      throw error;
    }
  }

  // ── Terminal reads ──
  async single(): Promise<T | null> {
    this._limitCount = 1;
    const results = (await this.performWrite()) as T[];
    return results?.[0] ?? null;
  }

  async maybeSingle(): Promise<T | null> {
    this._limitCount = 1;
    const results = (await this.performWrite()) as T[];
    return results?.[0] ?? null;
  }

  private async execute(): Promise<T[]> {
    const params: Record<string, unknown> = {};

    if (this._selectCols) {
      params.select = this._selectCols;
    }

    if (this._filters.length > 0) {
      params.filters = JSON.stringify(this._filters);
    }

    if (this._orderByCol) {
      params.orderBy = this._orderByCol;
      params.order = this._orderAsc ? "asc" : "desc";
    }

    if (this._limitCount !== null) {
      params.limit = this._limitCount;
    }

    if (this._offsetCount > 0) {
      params.offset = this._offsetCount;
    }

    try {
      const response = await httpClient.get<{ data: T[] }>(`/db/${this._table}`, params);
      return response.data;
    } catch (error) {
      logger.error("[apiClient]", `Failed to query ${this._table}`, { error });
      throw error;
    }
  }
}

// ── Token persistence ─────────────────────────────────────────────

const TOKEN_KEY = "auth_token";

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // localStorage unavailable
  }
}

// Restore token from storage on init
const savedToken = getStoredToken();
if (savedToken) {
  httpClient.setAccessToken(savedToken);
}

// ── Auth state listeners ──────────────────────────────────────────

type AuthStateCallback = (event: string, session: any | null) => void;
const authListeners: Set<AuthStateCallback> = new Set();

function notifyListeners(event: string, session: any | null) {
  authListeners.forEach((cb) => {
    try {
      cb(event, session);
    } catch {
      // ignore listener errors
    }
  });
}

// ── API Auth Client ──────────────────────────────────────────────

class ApiAuthClient implements AuthClient {
  async getSession() {
    try {
      const token = getStoredToken();
      if (!token) {
        return { data: { session: null }, error: null };
      }
      httpClient.setAccessToken(token);
      const response = await httpClient.get<{ data: { session: any | null } }>("/auth/session");
      return { data: { session: response.data.session }, error: null };
    } catch (error) {
      setStoredToken(null);
      httpClient.setAccessToken(null);
      return { data: { session: null }, error: error as Error };
    }
  }

  async getUser() {
    try {
      const response = await httpClient.get<{ data: { user: any | null } } | any>("/auth/user");
      const user = response.data?.user ?? response.data;
      return { data: { user }, error: null };
    } catch (error) {
      return { data: { user: null }, error: error as Error };
    }
  }

  async signUp({ email, password, options }) {
    try {
      const response = await httpClient.post<{ data: { user: any | null; access_token: string } }>("/auth/register", {
        email,
        password,
        full_name: options?.data?.full_name,
      });
      const accessToken = response.data.access_token;
      if (accessToken) {
        httpClient.setAccessToken(accessToken);
        setStoredToken(accessToken);
      }
      notifyListeners("SIGNED_IN", { user: response.data.user, access_token: accessToken });
      return { data: { user: response.data.user }, error: null };
    } catch (error) {
      return { data: { user: null }, error: error as Error };
    }
  }

  async signIn({ email, password }) {
    try {
      const response = await httpClient.post<{ data: { user: any | null; access_token: string } }>("/auth/login", {
        email,
        password,
      });
      const accessToken = response.data.access_token;
      if (accessToken) {
        httpClient.setAccessToken(accessToken);
        setStoredToken(accessToken);
      }
      notifyListeners("SIGNED_IN", { user: response.data.user, access_token: accessToken });
      return { data: { user: response.data.user }, error: null };
    } catch (error) {
      return { data: { user: null }, error: error as Error };
    }
  }

  async signOut() {
    try {
      await httpClient.post("/auth/logout");
    } catch {
      // ignore logout errors
    }
    httpClient.setAccessToken(null);
    setStoredToken(null);
    notifyListeners("SIGNED_OUT", null);
    return { error: null };
  }

  onAuthStateChange(callback: (event: string, session: any | null) => void) {
    authListeners.add(callback);
    return {
      data: {
        subscription: {
          unsubscribe() {
            authListeners.delete(callback);
          },
        },
      },
    };
  }
}

// ── API Data Client ──────────────────────────────────────────────

class ApiDataClient implements DataClient {
  from<K extends TableName>(table: K): DataQueryBuilder<TableRow<K>> {
    return new ApiQueryBuilder<TableRow<K>>(table as string);
  }

  async rpc<T>(functionName: string, params?: Record<string, unknown>): Promise<T> {
    try {
      const response = await httpClient.post<{ data: T }>(`/rpc/${functionName}`, params);
      return response.data;
    } catch (error) {
      logger.error("[apiClient]", `RPC call failed: ${functionName}`, { error });
      throw error;
    }
  }
}

// ── API Storage Client ───────────────────────────────────────────

class ApiStorageClient implements StorageClient {
  from(bucket: string) {
    return {
      async upload(path: string, file: File | Blob, options?: { contentType?: string }) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("path", path);

        const response = await httpClient.post<{ data: { path: string } }>(
          `/storage/${bucket}/upload`,
          formData
        );
        return { data: { path: response.data.path }, error: null };
      },

      getPublicUrl(path: string) {
        return { data: { publicUrl: `${API_BASE_URL}/storage/${bucket}/public/${path}` } };
      },

      async remove(paths: string[]) {
        await httpClient.post(`/storage/${bucket}/remove`, { paths });
        return { data: null, error: null };
      },

      async list(prefix?: string, options?: { limit?: number; offset?: number }) {
        const response = await httpClient.get<{ data: Array<{ name: string }> }>(
          `/storage/${bucket}/list`,
          { prefix, limit: options?.limit, offset: options?.offset }
        );
        return { data: response.data, error: null };
      },
    };
  }
}

// ── Export API clients ───────────────────────────────────────────

export const apiAuthClient = new ApiAuthClient();
export const apiDataClient = new ApiDataClient();
export const apiStorageClient = new ApiStorageClient();
export { httpClient };
