import { http, qs } from "@core/api";
import type { RegisterVendorInput, UpdateVendorProfileInput, UpdateVendorSettingsInput } from "../validators";

const API_BASE = "/api/vendors";

export const vendorsApi = {
  getById: (id: string) => http.get<any>(`${API_BASE}/${id}`),
  getByUserId: (userId: string) => http.get<any>(`${API_BASE}/user/${userId}`),
  list: (params?: any) => http.get<any[]>(`${API_BASE}${qs(params)}`),
  getByCategory: (category: string, params?: any) => http.get<any[]>(`${API_BASE}/category/${category}${qs(params)}`),
  getVerified: (params?: any) => http.get<any[]>(`${API_BASE}/verified${qs(params)}`),
  search: (query: string) => http.get<any[]>(`${API_BASE}/search${qs({ q: query })}`),
  register: (data: RegisterVendorInput) => http.post<any>(API_BASE, data),
  verify: (id: string) => http.post<void>(`${API_BASE}/${id}/verify`),
  suspend: (id: string, reason?: string) => http.post<void>(`${API_BASE}/${id}/suspend`, { reason }),
  updateProfile: (id: string, data: UpdateVendorProfileInput) => http.put<any>(`${API_BASE}/${id}/profile`, data),
  updateSettings: (id: string, data: UpdateVendorSettingsInput) => http.put<any>(`${API_BASE}/${id}/settings`, data),
};
