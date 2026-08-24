import { http } from "@/core/api/client";
import { eventBus } from "@core/events/EventBus";
import type { DeliveryService } from "../domain";

export const deliveryService: DeliveryService = {
  async createShipment(data) {
    const result: any = await http.post("/api/delivery/managers", data);
    const shipment = result.data;
    eventBus.emit("ShipmentCreated", { shipmentId: shipment?.id, orderId: data.orderId });
    return shipment;
  },

  async updateTracking(shipmentId, data) {
    const result: any = await http.put(`/api/delivery/managers/${shipmentId}`, data);
    eventBus.emit("TrackingUpdated", { shipmentId, status: data.status });
    return result.data;
  },

  async markDelivered(shipmentId, actualDelivery) {
    await http.post(`/api/delivery/managers/${shipmentId}/deliver`, { delivered_at: actualDelivery });
    eventBus.emit("ShipmentDelivered", { shipmentId, orderId: "", deliveredAt: actualDelivery || new Date(), timestamp: new Date() });
  },

  async markFailed(shipmentId, reason) {
    await http.post(`/api/delivery/managers/${shipmentId}/fail`, { reason });
    eventBus.emit("ShipmentFailed", { shipmentId, reason, timestamp: new Date() });
  },

  async getShipmentById(shipmentId) {
    const data: any = await http.get(`/api/delivery/managers/${shipmentId}`);
    return data.data || null;
  },

  async getShipmentsByOrder(orderId) {
    const data: any = await http.get("/api/delivery/my", { params: { order_id: orderId } } as any);
    return data.data || [];
  },

  async getShipmentsByUser(userId) {
    const data: any = await http.get("/api/delivery/my");
    return data.data || [];
  },

  async getTrackingHistory(shipmentId) {
    const data: any = await http.get(`/api/delivery/managers/${shipmentId}`);
    return data.data ? [data.data] : [];
  },

  async calculateShippingRate(zoneId, method, weight, cartTotal) {
    const data: any = await http.get("/api/delivery/rates", { params: { zone_id: zoneId, method, weight, cart_total: cartTotal } } as any);
    return data.data?.rate || 0;
  },
};
