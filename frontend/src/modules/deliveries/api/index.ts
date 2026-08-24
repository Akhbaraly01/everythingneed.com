import { http } from "@core/api";
import type { CreateShipmentInput, UpdateTrackingInput } from "../validators";

const API_BASE = "/api/deliveries";

export const deliveriesApi = {
  getById: (id: string) => http.get<any>(`${API_BASE}/${id}`),
  getByOrder: (orderId: string) => http.get<any[]>(`${API_BASE}/order/${orderId}`),
  getByUser: (userId: string) => http.get<any[]>(`${API_BASE}/user/${userId}`),
  getTrackingHistory: (shipmentId: string) => http.get<any[]>(`${API_BASE}/${shipmentId}/tracking`),
  create: (data: CreateShipmentInput) => http.post<any>(API_BASE, data),
  updateTracking: (shipmentId: string, data: UpdateTrackingInput) => http.post<any>(`${API_BASE}/${shipmentId}/tracking`, data),
  markDelivered: (shipmentId: string) => http.post<void>(`${API_BASE}/${shipmentId}/delivered`),
  markFailed: (shipmentId: string, reason?: string) => http.post<void>(`${API_BASE}/${shipmentId}/failed`, { reason }),
  calculateRate: (data: any) => http.post<number>(`${API_BASE}/calculate-rate`, data),
};
