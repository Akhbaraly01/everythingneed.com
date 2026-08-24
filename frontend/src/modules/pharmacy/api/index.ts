import { http, qs } from "@core/api";
import type { CreateMedicineInput, CreateMedicineOrderInput } from "../validators";

const API_BASE = "/api/pharmacy";

export const pharmacyApi = {
  getMedicine: (id: string) => http.get<any>(`${API_BASE}/medicines/${id}`),
  getByCategory: (category: string, params?: any) => http.get<any[]>(`${API_BASE}/medicines/category/${category}${qs(params)}`),
  search: (query: string, params?: any) => http.get<any[]>(`${API_BASE}/medicines/search${qs({ q: query, ...params })}`),
  getRequiresPrescription: (params?: any) => http.get<any[]>(`${API_BASE}/medicines/prescription-required${qs(params)}`),
  createMedicine: (data: CreateMedicineInput) => http.post<any>(`${API_BASE}/medicines`, data),
  updateMedicine: (id: string, data: any) => http.put<any>(`${API_BASE}/medicines/${id}`, data),
  deleteMedicine: (id: string) => http.delete<void>(`${API_BASE}/medicines/${id}`),
  updateStock: (id: string, quantityChange: number) => http.patch<any>(`${API_BASE}/medicines/${id}/stock`, { quantityChange }),
  createOrder: (data: CreateMedicineOrderInput) => http.post<any>(`${API_BASE}/orders`, data),
  getOrder: (orderId: string) => http.get<any>(`${API_BASE}/orders/${orderId}`),
  getUserOrders: (userId: string) => http.get<any[]>(`${API_BASE}/orders/user/${userId}`),
  updateOrderStatus: (orderId: string, status: string) => http.patch<void>(`${API_BASE}/orders/${orderId}/status`, { status }),
};
