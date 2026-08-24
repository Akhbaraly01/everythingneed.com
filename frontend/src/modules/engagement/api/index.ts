import { qs } from "@core/api";
import { http } from "@core/api";
import type { FavoriteInput, RecordViewInput, AddToWishlistInput } from "../validators";

const API_BASE = "/api/engagement";

export const engagementApi = {
  getFavorites: (userId: string, targetType?: string) =>
    http.get<any[]>(`${API_BASE}/favorites/${userId}${qs({ targetType })}`),
  getRecentlyViewed: (userId: string, targetType?: string) =>
    http.get<any[]>(`${API_BASE}/recently-viewed/${userId}${qs({ targetType })}`),
  getWishlist: (id: string) => http.get<any>(`${API_BASE}/wishlists/${id}`),
  getUserWishlists: (userId: string) => http.get<any[]>(`${API_BASE}/wishlists/user/${userId}`),
  isFavorited: (userId: string, targetType: string, targetId: string) =>
    http.get<boolean>(`${API_BASE}/favorites/check${qs({ userId, targetType, targetId })}`),
  favorite: (data: FavoriteInput) => http.post<any>(`${API_BASE}/favorites`, data),
  unfavorite: (userId: string, targetType: string, targetId: string) =>
    http.delete<void>(`${API_BASE}/favorites/${userId}/${targetType}/${targetId}`),
  recordView: (data: RecordViewInput) => http.post<any>(`${API_BASE}/recently-viewed`, data),
  addToWishlist: (data: AddToWishlistInput) => http.post<any>(`${API_BASE}/wishlists/items`, data),
  removeFromWishlist: (wishlistId: string, targetId: string) =>
    http.delete<void>(`${API_BASE}/wishlists/${wishlistId}/items/${targetId}`),
  createWishlist: (data: any) => http.post<any>(`${API_BASE}/wishlists`, data),
};
