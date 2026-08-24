import { resolve, TOKENS } from "@core/di/container";
import { eventBus } from "@core/events/EventBus";
import type { MedicineOrderRepository, VendorOrderRepository, OrderTrackingRepository } from "@core/repositories";
import type { OrderService } from "../domain";

export const orderService: OrderService = {
  async createMedicineOrder(data) {
    const repo = resolve<MedicineOrderRepository>(TOKENS.MedicineOrderRepository);
    const total = data.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const order = (await repo.create({
      user_id: data.userId,
      order_number: `MO-${Date.now()}`,
      delivery_address: data.deliveryAddress,
      prescription_url: data.prescriptionUrl,
      total_amount: total,
      status: "pending",
    } as any)) as any;
    eventBus.emit("OrderCreated", { orderId: order.id, userId: data.userId, total, currency: "USD" });
    return order;
  },

  async createVendorOrder(data) {
    const repo = resolve<VendorOrderRepository>(TOKENS.VendorOrderRepository);
    const order = (await repo.create({
      vendor_id: data.vendorId,
      customer_id: data.customerId,
      product_id: data.productId,
      product_name: data.productName,
      quantity: data.quantity,
      unit_price: data.unitPrice,
      total_price: data.unitPrice * data.quantity,
      order_number: `VO-${Date.now()}`,
      shipping_address: data.shippingAddress,
      notes: data.notes,
      status: "pending",
    } as any)) as any;
    eventBus.emit("OrderCreated", { orderId: order.id, userId: data.customerId, total: data.unitPrice * data.quantity, currency: "USD" });
    return order;
  },

  async confirmOrder(orderId) {
    const repo = resolve<MedicineOrderRepository>(TOKENS.MedicineOrderRepository);
    await repo.updateStatus(orderId, "confirmed");
    eventBus.emit("OrderConfirmed", { orderId });
  },

  async shipOrder(orderId, trackingData) {
    const repo = resolve<MedicineOrderRepository>(TOKENS.MedicineOrderRepository);
    await repo.updateStatus(orderId, "shipped");
    eventBus.emit("OrderShipped", { orderId, estimatedDelivery: trackingData?.estimatedDelivery });
  },

  async deliverOrder(orderId) {
    const repo = resolve<MedicineOrderRepository>(TOKENS.MedicineOrderRepository);
    await repo.updateStatus(orderId, "delivered");
    eventBus.emit("OrderDelivered", { orderId });
  },

  async cancelOrder(orderId, reason) {
    const repo = resolve<MedicineOrderRepository>(TOKENS.MedicineOrderRepository);
    await repo.updateStatus(orderId, "cancelled");
    eventBus.emit("OrderCancelled", { orderId, reason });
  },

  async getOrderById(orderId) {
    const repo = resolve<MedicineOrderRepository>(TOKENS.MedicineOrderRepository);
    return (await repo.findById(orderId)) as any;
  },

  async getOrdersByUserId(userId, params) {
    const repo = resolve<MedicineOrderRepository>(TOKENS.MedicineOrderRepository);
    return (await repo.findByUserId(userId, params)) as any;
  },

  async getVendorOrdersByVendorId(vendorId, params) {
    const repo = resolve<VendorOrderRepository>(TOKENS.VendorOrderRepository);
    return (await repo.findByVendorId(vendorId, params)) as any;
  },

  async getVendorOrdersByCustomerId(customerId, params) {
    const repo = resolve<VendorOrderRepository>(TOKENS.VendorOrderRepository);
    return (await repo.findByCustomerId(customerId, params)) as any;
  },

  async addTracking(orderId, data) {
    const repo = resolve<OrderTrackingRepository>(TOKENS.OrderTrackingRepository);
    const tracking = (await repo.create({
      order_id: orderId,
      order_type: "medicine",
      user_id: "current-user",
      status: data.status,
      status_message: data.statusMessage,
      estimated_delivery: data.estimatedDelivery,
      location_lat: data.location?.lat,
      location_lng: data.location?.lng,
    } as any)) as any;
    eventBus.emit("TrackingUpdated", { shipmentId: tracking.order_id ?? orderId, status: data.status });
    return tracking;
  },

  async getTrackingHistory(orderId) {
    const repo = resolve<OrderTrackingRepository>(TOKENS.OrderTrackingRepository);
    return (await repo.findByOrderId(orderId)) as any;
  },
};
