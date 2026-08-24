import { http, qs } from "@core/api";
import type { CreateProductInput, UpdateProductInput } from "../validators";

const API_BASE = "/api/products";

export const productsApi = {
  getById: (id: string) => http.get<any>(`${API_BASE}/${id}`),
  getByVendor: (vendorId: string, params?: any) => http.get<any[]>(`${API_BASE}/vendor/${vendorId}${qs(params)}`),
  getByCategory: (category: string, params?: any) => http.get<any[]>(`${API_BASE}/category/${category}${qs(params)}`),
  getActive: (params?: any) => http.get<any[]>(`${API_BASE}${qs(params)}`),
  search: (query: string, params?: any) => http.get<any[]>(`${API_BASE}/search${qs({ q: query, ...params })}`),
  create: (data: CreateProductInput) => http.post<any>(API_BASE, data),
  update: (id: string, data: UpdateProductInput) => http.put<any>(`${API_BASE}/${id}`, data),
  delete: (id: string) => http.delete<void>(`${API_BASE}/${id}`),
  updateStock: (id: string, quantity: number) => http.patch<any>(`${API_BASE}/${id}/stock`, { quantity }),
  getReviews: (productId: string, params?: any) => http.get<any[]>(`${API_BASE}/${productId}/reviews${qs(params)}`),
  createReview: (data: any) => http.post<any>(`${API_BASE}/reviews`, data),
};
