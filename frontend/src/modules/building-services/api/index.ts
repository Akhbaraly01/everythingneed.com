import { http } from "@core/api";
import type { RegisterServiceWorkerInput, CreateServiceBookingInput, RegisterDeliveryManagerInput } from "../validators";

const API_BASE = "/api/building-services";

const qs = (params?: Record<string, unknown>) => {
  if (!params) return "";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) search.set(key, String(value));
  });
  const encoded = search.toString();
  return encoded ? `?${encoded}` : "";
};

export const buildingServicesApi = {
  getWorker: (id: string) => http.get<any>(`${API_BASE}/workers/${id}`),
  getWorkerByUserId: (userId: string) => http.get<any>(`${API_BASE}/workers/user/${userId}`),
  getWorkersByType: (workerType: string, params?: any) => http.get<any[]>(`${API_BASE}/workers/type/${workerType}${qs(params)}`),
  getAvailableWorkers: (params?: any) => http.get<any[]>(`${API_BASE}/workers/available${qs(params)}`),
  getBooking: (id: string) => http.get<any>(`${API_BASE}/bookings/${id}`),
  getUserBookings: (userId: string, params?: any) => http.get<any[]>(`${API_BASE}/bookings/user/${userId}${qs(params)}`),
  getDeliveryManager: (id: string) => http.get<any>(`${API_BASE}/delivery/${id}`),
  getAvailableDeliveryManagers: (params?: any) => http.get<any[]>(`${API_BASE}/delivery/available${qs(params)}`),
  registerWorker: (data: RegisterServiceWorkerInput) => http.post<any>(`${API_BASE}/workers`, data),
  updateWorker: (id: string, data: any) => http.put<any>(`${API_BASE}/workers/${id}`, data),
  updateWorkerAvailability: (id: string, isAvailable: boolean) =>
    http.patch<void>(`${API_BASE}/workers/${id}/availability`, { isAvailable }),
  createBooking: (data: CreateServiceBookingInput) => http.post<any>(`${API_BASE}/bookings`, data),
  updateBooking: (id: string, data: any) => http.put<any>(`${API_BASE}/bookings/${id}`, data),
  cancelBooking: (id: string) => http.post<void>(`${API_BASE}/bookings/${id}/cancel`),
  registerDeliveryManager: (data: RegisterDeliveryManagerInput) => http.post<any>(`${API_BASE}/delivery`, data),
};
