import { http, qs } from "@core/api";
import type { CreateStoreInput, UpdateStoreInput } from "../validators";

const API_BASE = "/api/stores";

export const storesApi = {
  getById: (id: string) => http.get<any>(`${API_BASE}/${id}`),
  getBySlug: (slug: string) => http.get<any>(`${API_BASE}/slug/${slug}`),
  list: (params?: any) => http.get<any[]>(`${API_BASE}${qs(params)}`),
  getByVendor: (vendorId: string) => http.get<any[]>(`${API_BASE}/vendor/${vendorId}`),
  getByCategory: (categoryId: string) => http.get<any[]>(`${API_BASE}/category/${categoryId}`),
  getActive: () => http.get<any[]>(`${API_BASE}/active`),
  create: (data: CreateStoreInput) => http.post<any>(API_BASE, data),
  update: (id: string, data: UpdateStoreInput) => http.put<any>(`${API_BASE}/${id}`, data),
  close: (id: string) => http.post<void>(`${API_BASE}/${id}/close`),
  reopen: (id: string) => http.post<void>(`${API_BASE}/${id}/reopen`),
  listCategories: () => http.get<any[]>(`${API_BASE}/categories`),
  createCategory: (data: any) => http.post<any>(`${API_BASE}/categories`, data),
};
