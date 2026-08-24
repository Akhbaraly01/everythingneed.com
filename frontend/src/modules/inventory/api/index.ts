import { http, qs } from "@core/api";
import type { AdjustStockInput, ReserveStockInput, ReleaseStockInput } from "../validators";

const API_BASE = "/api/inventory";

export const inventoryApi = {
  getStockLevel: (productId: string, warehouseId?: string) =>
    http.get<any>(`${API_BASE}/stock/${productId}${qs({ warehouseId })}`),
  getMovements: (productId: string, params?: any) =>
    http.get<any[]>(`${API_BASE}/stock/${productId}/movements${qs(params)}`),
  getLowStock: () => http.get<any[]>(`${API_BASE}/low-stock`),
  getOutOfStock: () => http.get<any[]>(`${API_BASE}/out-of-stock`),
  adjustStock: (data: AdjustStockInput) => http.post<any>(`${API_BASE}/adjust`, data),
  reserveStock: (data: ReserveStockInput) => http.post<any>(`${API_BASE}/reserve`, data),
  releaseStock: (data: ReleaseStockInput) => http.post<any>(`${API_BASE}/release`, data),
};
