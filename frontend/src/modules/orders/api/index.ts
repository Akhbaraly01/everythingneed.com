import { http, qs } from "@core/api";
import type { CreateMedicineOrderInput, CreateVendorOrderInput, AddTrackingInput } from "../validators";

const API_BASE = "/api/orders";

export const ordersApi = {
  getOrderById: (id: string) => http.get<any>(`${API_BASE}/${id}`),
  getOrdersByUserId: (userId: string, params?: any) => http.get<any[]>(`${API_BASE}/user/${userId}${qs(params)}`),
  getVendorOrdersByVendorId: (vendorId: string, params?: any) => http.get<any[]>(`${API_BASE}/vendor/${vendorId}${qs(params)}`),
  getVendorOrdersByCustomerId: (customerId: string, params?: any) => http.get<any[]>(`${API_BASE}/customer/${customerId}${qs(params)}`),
  createMedicineOrder: (data: CreateMedicineOrderInput) => http.post<any>(`${API_BASE}/medicine`, data),
  createVendorOrder: (data: CreateVendorOrderInput) => http.post<any>(`${API_BASE}/vendor`, data),
  confirmOrder: (orderId: string) => http.post<void>(`${API_BASE}/${orderId}/confirm`),
  shipOrder: (orderId: string, estimatedDelivery?: string) => http.post<void>(`${API_BASE}/${orderId}/ship`, { estimatedDelivery }),
  deliverOrder: (orderId: string) => http.post<void>(`${API_BASE}/${orderId}/deliver`),
  cancelOrder: (orderId: string, reason?: string) => http.post<void>(`${API_BASE}/${orderId}/cancel`, { reason }),
  addTracking: (data: AddTrackingInput) => http.post<any>(`${API_BASE}/${data.orderId}/tracking`, data),
  getTrackingHistory: (orderId: string) => http.get<any[]>(`${API_BASE}/${orderId}/tracking`),
};
