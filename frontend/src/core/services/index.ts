/**
 * Service barrel. Exports the configured Laravel API adapters.
 * Modules import from @core/services to get the correct implementation.
 *
 * Laravel mapping: service provider bindings in bootstrap/providers.php
 */
import { apiAuthClient, apiDataClient, apiStorageClient } from "./apiClient";
import type { AuthClient, DataClient, StorageClient } from "@core/contracts";

export type { AuthClient, DataClient, StorageClient } from "@core/contracts";
export { serviceConfig } from "./config";

// Use real API clients
export const authClient: AuthClient = apiAuthClient;
export const dataClient: DataClient = apiDataClient;
export const storageClient: StorageClient = apiStorageClient;

// Re-export API client helpers
export { httpClient, apiAuthClient, apiDataClient, apiStorageClient } from "./apiClient";
