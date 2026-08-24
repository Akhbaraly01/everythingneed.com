import { http } from "@core/api";
import { qs } from "@core/api";
import type { CreateRestaurantInput, CreateMenuItemInput, PlaceFoodOrderInput } from "../validators";

const API_BASE = "/api/food";

export const foodApi = {
  getRestaurant: (id: string) => http.get<any>(`${API_BASE}/restaurants/${id}`),
  getRestaurantBySlug: (slug: string) => http.get<any>(`${API_BASE}/restaurants/slug/${slug}`),
  getActiveRestaurants: (params?: any) => http.get<any[]>(`${API_BASE}/restaurants${qs(params)}`),
  getFeaturedRestaurants: () => http.get<any[]>(`${API_BASE}/restaurants/featured`),
  createRestaurant: (data: CreateRestaurantInput) => http.post<any>(`${API_BASE}/restaurants`, data),
  updateRestaurant: (id: string, data: any) => http.put<any>(`${API_BASE}/restaurants/${id}`, data),
  getMenuItems: (restaurantId: string) => http.get<any[]>(`${API_BASE}/restaurants/${restaurantId}/menu`),
  createMenuItem: (restaurantId: string, data: CreateMenuItemInput) => http.post<any>(`${API_BASE}/restaurants/${restaurantId}/menu`, data),
  updateMenuItem: (menuItemId: string, data: any) => http.put<any>(`${API_BASE}/menu/${menuItemId}`, data),
  toggleMenuItemAvailability: (menuItemId: string) => http.patch<void>(`${API_BASE}/menu/${menuItemId}/toggle`),
  placeOrder: (data: PlaceFoodOrderInput) => http.post<any>(`${API_BASE}/orders`, data),
  getOrder: (orderId: string) => http.get<any>(`${API_BASE}/orders/${orderId}`),
  getUserOrders: (userId: string) => http.get<any[]>(`${API_BASE}/orders/user/${userId}`),
  updateOrderStatus: (orderId: string, status: string) => http.patch<void>(`${API_BASE}/orders/${orderId}/status`, { status }),
};
