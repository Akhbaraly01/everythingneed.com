import { http } from "@/core/api/client";
import { eventBus } from "@core/events/EventBus";
import type { CategoryService } from "../domain";

const qs = (params?: Record<string, unknown>) => {
  if (!params) return "";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) search.set(key, String(value));
  });
  const encoded = search.toString();
  return encoded ? `?${encoded}` : "";
};

export const categoryService: CategoryService = {
  async create(data) {
    const res = await http.post<{ data: any }>("/api/categories", data);
    const category = res.data;
    eventBus.emit("CategoryCreated", { categoryId: category.id, name: data.name, parentId: data.parentId, timestamp: new Date() });
    return category;
  },

  async update(categoryId, data) {
    const res = await http.put<{ data: any }>(`/api/categories/${categoryId}`, data);
    eventBus.emit("CategoryUpdated", { categoryId, changes: data as Partial<any>, timestamp: new Date() });
    return res.data;
  },

  async delete(categoryId) {
    await http.delete(`/api/categories/${categoryId}`);
    eventBus.emit("CategoryDeleted", { categoryId, timestamp: new Date() });
  },

  async reorder(categoryId, newSortOrder) {
    await http.put(`/api/categories/${categoryId}/reorder`, { sort_order: newSortOrder });
    eventBus.emit("CategoryReordered", { categoryId, newSortOrder, previousSortOrder: 0, timestamp: new Date() });
  },

  async toggleActive(categoryId) {
    const res = await http.put<{ data?: { is_active?: boolean } }>(`/api/categories/${categoryId}/toggle-active`);
    eventBus.emit("CategoryToggled", { categoryId, isActive: res.data?.is_active, timestamp: new Date() });
  },

  async getById(categoryId) {
    const res = await http.get<{ data: any }>(`/api/categories/${categoryId}`);
    return res.data || null;
  },

  async getBySlug(slug) {
    const res = await http.get<{ data: any }>(`/api/categories/slug/${slug}`);
    return res.data || null;
  },

  async getChildren(parentId) {
    const res = await http.get<{ data: any[] }>(`/api/categories${qs({ parent_id: parentId })}`);
    return res.data || [];
  },

  async getRootCategories() {
    const res = await http.get<{ data: any[] }>(`/api/categories${qs({ root: true })}`);
    return res.data || [];
  },

  async getTree() {
    const res = await http.get<{ data: any[] }>("/api/categories/tree");
    return res.data || [];
  },

  async getPath(categoryId) {
    const res = await http.get<{ data: any[] }>(`/api/categories/${categoryId}/path`);
    return res.data || [];
  },
};
