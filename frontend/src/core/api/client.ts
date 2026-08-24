/**
 * Single API client for the whole app. Modules MUST import from here,
 * never directly from infrastructure implementations, so we can swap
 * transports during the Laravel migration without touching every module.
 *
 * Re-exports the configured data, auth, and storage clients.
 */
export { db, auth, storage, from, rpc, safeQuery } from "./laravelGateway";
export { http, invalidateCache, ApiError, setAuthTokenProvider, qs } from "./RequestBuilder";
