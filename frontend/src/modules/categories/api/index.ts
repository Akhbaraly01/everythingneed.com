import { http } from "@core/api";
import type { CreateCategoryInput, UpdateCategoryInput, ReorderCategoryInput } from "../validators";

const API_BASE = "/api/categories";

const qs = (params?: Record<string, unknown>) => {
  if (!params) return "";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) search.set(key, String(value));
  });
  const encoded = search.toString();
  return encoded ? `?${encoded}` : "";
};

export const categoriesApi = {
  getById: (id: string) => http.get<any>(`${API_BASE}/${id}`),
  getBySlug: (slug: string) => http.get<any>(`${API_BASE}/slug/${slug}`),
  list: (params?: any) => http.get<any[]>(`${API_BASE}${qs(params)}`),
  getChildren: (parentId: string) => http.get<any[]>(`${API_BASE}/${parentId}/children`),
  getRoots: () => http.get<any[]>(`${API_BASE}/roots`),
  getTree: () => http.get<any[]>(`${API_BASE}/tree`),
  getPath: (id: string) => http.get<any[]>(`${API_BASE}/${id}/path`),
  create: (data: CreateCategoryInput) => http.post<any>(API_BASE, data),
  update: (id: string, data: UpdateCategoryInput) => http.put<any>(`${API_BASE}/${id}`, data),
  delete: (id: string) => http.delete<void>(`${API_BASE}/${id}`),
  reorder: (id: string, data: ReorderCategoryInput) => http.put<void>(`${API_BASE}/${id}/reorder`, data),
  toggleActive: (id: string) => http.patch<void>(`${API_BASE}/${id}/toggle-active`),
};
