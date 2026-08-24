/**
 * Service configuration. Determines which adapter to use for data, auth,
 * and storage. Uses the real Laravel API adapter.
 *
 * Laravel mapping: config/services.php + .env
 */

export type ServiceMode = "api";

export const serviceConfig = {
  mode: (import.meta.env.VITE_API_MODE as ServiceMode) || "api",
  apiBaseUrl: import.meta.env.VITE_API_URL || "/api",
} as const;
