import { http } from "@/core/api/client";
import { qs } from "@core/api";
import { eventBus } from "@core/events/EventBus";
import type { InventoryService } from "../domain";

export const inventoryService: InventoryService = {
  async adjustStock(productId, data) {
    const result: any = await http.post(`/api/stock/adjust`, { product_id: productId, ...data });
    const stockLevel = result.data;
    eventBus.emit("StockAdjusted", { productId, previousQuantity: 0, newQuantity: data.quantity });
    return stockLevel;
  },

  async reserveStock(productId, data) {
    const result: any = await http.post(`/api/stock`, { product_id: productId, ...data, type: 'reserve' });
    const stockLevel = result.data;
    eventBus.emit("StockReserved", { productId, quantity: data.quantity, orderId: (data as any).orderId || "" });
    return stockLevel;
  },

  async releaseStock(productId, data) {
    const result: any = await http.post(`/api/stock`, { product_id: productId, ...data, type: 'release' });
    return result.data;
  },

  async getStockLevel(productId, warehouseId) {
    const data: any = await http.get(`/api/stock/${productId}`, { params: { warehouse_id: warehouseId } } as any);
    return data.data || null;
  },

  async getStockMovements(productId, params) {
    const data: any = await http.get(`/api/stock/${productId}/movements${qs(params)}`);
    return { items: data.data || [], total: data.meta?.total || 0 };
  },

  async getLowStockProducts() {
    const data: any = await http.get("/api/stock", { params: { status: "low_stock" } } as any);
    return data.data || [];
  },

  async getOutOfStockProducts() {
    const data: any = await http.get("/api/stock", { params: { status: "out_of_stock" } } as any);
    return data.data || [];
  },
};
