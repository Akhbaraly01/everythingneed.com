import { http } from "@/core/api/client";
import { eventBus } from "@core/events/EventBus";
import type { StoreService } from "../domain";

export const storeService: StoreService = {
  async createStore(data) {
    const result: any = await http.post("/api/vendors/stores", data);
    const store = result.data;
    eventBus.emit("StoreCreated", { storeId: store.id, vendorId: data.vendorId, name: data.name, timestamp: new Date() });
    return store;
  },

  async updateStore(storeId, data) {
    const result: any = await http.put(`/api/vendors/stores/${storeId}`, data);
    eventBus.emit("StoreUpdated", { storeId, changes: data as Partial<any>, timestamp: new Date() });
    return result.data;
  },

  async closeStore(storeId, reason) {
    await http.put(`/api/vendors/stores/${storeId}/close`, { reason });
    eventBus.emit("StoreClosed", { storeId, reason, timestamp: new Date() });
  },

  async reopenStore(storeId) {
    await http.put(`/api/vendors/stores/${storeId}/reopen`);
    eventBus.emit("StoreReopened", { storeId, timestamp: new Date() });
  },

  async getStoreById(storeId) {
    const data: any = await http.get(`/api/vendors/${storeId}`);
    return data.data || null;
  },

  async getStoreBySlug(slug) {
    const data: any = await http.get(`/api/vendors/slug/${slug}`);
    return data.data || null;
  },

  async getStoresByVendor(vendorId) {
    const data: any = await http.get(`/api/vendors/${vendorId}/stores`);
    return data.data || [];
  },

  async getStoresByCategory(categoryId) {
    const data: any = await http.get("/api/vendors", { params: { category_id: categoryId } } as any);
    return data.data || [];
  },

  async getActiveStores() {
    const data: any = await http.get("/api/vendors", { params: { status: "active" } } as any);
    return data.data || [];
  },

  async createCategory(data) {
    const result: any = await http.post("/api/vendor-categories", data);
    return result.data;
  },

  async getCategoryById(categoryId) {
    const data: any = await http.get(`/api/vendor-categories/${categoryId}`);
    return data.data || null;
  },

  async getAllCategories() {
    const data: any = await http.get("/api/vendor-categories");
    return data.data || [];
  },
};
