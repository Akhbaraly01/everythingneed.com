import { http } from "@core/api";
import type { CreateBookingInput, CancelBookingInput } from "../validators";

const API_BASE = "/api/bookings";

const qs = (params?: Record<string, unknown>) => {
  if (!params) return "";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) search.set(key, String(value));
  });
  const encoded = search.toString();
  return encoded ? `?${encoded}` : "";
};

export const bookingsApi = {
  getById: (id: string) => http.get<any>(`${API_BASE}/${id}`),
  getByUser: (userId: string, params?: any) => http.get<any[]>(`${API_BASE}/user/${userId}${qs(params)}`),
  getByServiceType: (serviceType: string, params?: any) => http.get<any[]>(`${API_BASE}/type/${serviceType}${qs(params)}`),
  create: (data: CreateBookingInput) => http.post<any>(API_BASE, data),
  confirm: (id: string) => http.post<void>(`${API_BASE}/${id}/confirm`),
  complete: (id: string) => http.post<void>(`${API_BASE}/${id}/complete`),
  cancel: (data: CancelBookingInput) => http.post<void>(`${API_BASE}/cancel`, data),
};
