import { http, qs } from "@core/api";
import type { CreateNeedCategoryInput, CreateNeedItemInput } from "../validators";

const API_BASE = "/api/needs";

export const needsApi = {
  getCategory: (id: string) => http.get<any>(`${API_BASE}/categories/${id}`),
  getCategoryBySlug: (slug: string) => http.get<any>(`${API_BASE}/categories/slug/${slug}`),
  getAllCategories: () => http.get<any[]>(`${API_BASE}/categories`),
  getCategoriesWithItems: () => http.get<any[]>(`${API_BASE}/categories/with-items`),
  getItem: (id: string) => http.get<any>(`${API_BASE}/items/${id}`),
  getItemsByCategory: (categoryId: string, params?: any) => http.get<any[]>(`${API_BASE}/categories/${categoryId}/items${qs(params)}`),
  getAvailableItems: (params?: any) => http.get<any[]>(`${API_BASE}/items/available${qs(params)}`),
  createCategory: (data: CreateNeedCategoryInput) => http.post<any>(`${API_BASE}/categories`, data),
  updateCategory: (id: string, data: any) => http.put<any>(`${API_BASE}/categories/${id}`, data),
  deleteCategory: (id: string) => http.delete<void>(`${API_BASE}/categories/${id}`),
  createItem: (data: CreateNeedItemInput) => http.post<any>(`${API_BASE}/items`, data),
  updateItem: (id: string, data: any) => http.put<any>(`${API_BASE}/items/${id}`, data),
  deleteItem: (id: string) => http.delete<void>(`${API_BASE}/items/${id}`),
};
