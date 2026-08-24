import { http } from "@/core/api/client";
import { eventBus } from "@core/events/EventBus";
import type { FoodService } from "../domain";

export const foodService: FoodService = {
  async createRestaurant(data) {
    const result: any = await http.post("/api/restaurants", data);
    const restaurant = result.data;
    eventBus.emit("RestaurantCreated", { restaurantId: restaurant.id, ownerId: data.ownerId, name: data.name, timestamp: new Date() });
    return restaurant;
  },

  async updateRestaurant(restaurantId, data) {
    const result: any = await http.put(`/api/restaurants/${restaurantId}`, data);
    return result.data;
  },

  async getRestaurantById(restaurantId) {
    const data: any = await http.get(`/api/restaurants/${restaurantId}`);
    return data.data || null;
  },

  async getRestaurantBySlug(slug) {
    const data: any = await http.get(`/api/restaurants/slug/${slug}`);
    return data.data || null;
  },

  async getRestaurantsByOwner(ownerId) {
    const data: any = await http.get("/api/restaurants", { params: { owner_id: ownerId } } as any);
    return data.data || [];
  },

  async getActiveRestaurants() {
    const data: any = await http.get("/api/restaurants", { params: { status: "active" } } as any);
    return data.data || [];
  },

  async getFeaturedRestaurants() {
    const data: any = await http.get("/api/restaurants/featured");
    return data.data || [];
  },

  async createMenuItem(restaurantId, data) {
    const result: any = await http.post(`/api/restaurants/${restaurantId}/menu`, data);
    const item = result.data;
    eventBus.emit("MenuItemCreated", { menuItemId: item.id, restaurantId, name: data.name, price: data.price, timestamp: new Date() });
    return item;
  },

  async updateMenuItem(menuItemId, data) {
    const result: any = await http.put(`/api/menu-items/${menuItemId}`, data);
    return result.data;
  },

  async toggleMenuItemAvailability(menuItemId) {
    await http.put(`/api/menu-items/${menuItemId}/toggle`);
  },

  async getMenuItemsByRestaurant(restaurantId) {
    const data: any = await http.get(`/api/restaurants/${restaurantId}/menu`);
    return data.data || [];
  },

  async getMenuItemsByCategory(restaurantId, category) {
    const data: any = await http.get(`/api/restaurants/${restaurantId}/menu`, { params: { category } } as any);
    return data.data || [];
  },

  async placeFoodOrder(userId, data) {
    const result: any = await http.post("/api/food-orders", { user_id: userId, ...data });
    const order = result.data;
    eventBus.emit("FoodOrderPlaced", { orderId: order.id, userId, restaurantId: data.restaurantId, total: order.total, timestamp: new Date() });
    return order;
  },

  async updateFoodOrderStatus(orderId, status) {
    await http.put(`/api/food-orders/${orderId}/status`, { status });
    eventBus.emit("FoodOrderStatusChanged", { orderId, previousStatus: "pending", newStatus: status, timestamp: new Date() });
  },

  async getFoodOrderById(orderId) {
    const data: any = await http.get(`/api/food-orders/${orderId}`);
    return data.data || null;
  },

  async getFoodOrdersByUser(userId) {
    const data: any = await http.get("/api/food-orders", { params: { user_id: userId } } as any);
    return data.data || [];
  },

  async getFoodOrdersByRestaurant(restaurantId) {
    const data: any = await http.get("/api/food-orders", { params: { restaurant_id: restaurantId } } as any);
    return data.data || [];
  },
};
