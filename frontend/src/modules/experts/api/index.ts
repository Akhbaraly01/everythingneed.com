import { http, qs } from "@core/api";
import type { RegisterExpertInput, AddExpertReviewInput, AddToWishlistInput } from "../validators";

const API_BASE = "/api/experts";

export const expertsApi = {
  getById: (id: string) => http.get<any>(`${API_BASE}/${id}`),
  getByUserId: (userId: string) => http.get<any>(`${API_BASE}/user/${userId}`),
  getBySpecialization: (specialization: string, params?: any) =>
    http.get<any[]>(`${API_BASE}/specialization/${specialization}${qs(params)}`),
  search: (query: string) => http.get<any[]>(`${API_BASE}/search${qs({ q: query })}`),
  getAvailability: (expertId: string) => http.get<any>(`${API_BASE}/${expertId}/availability`),
  getReviews: (expertId: string, params?: any) => http.get<any[]>(`${API_BASE}/${expertId}/reviews${qs(params)}`),
  getAverageRating: (expertId: string) => http.get<number>(`${API_BASE}/${expertId}/rating`),
  getWishlist: (userId: string) => http.get<any[]>(`${API_BASE}/wishlist/${userId}`),
  register: (data: RegisterExpertInput) => http.post<any>(API_BASE, data),
  updateProfile: (id: string, data: any) => http.put<any>(`${API_BASE}/${id}`, data),
  updateAvailability: (id: string, data: any) => http.put<any>(`${API_BASE}/${id}/availability`, data),
  addReview: (data: AddExpertReviewInput) => http.post<any>(`${API_BASE}/reviews`, data),
  addToWishlist: (data: AddToWishlistInput) => http.post<void>(`${API_BASE}/wishlist`, data),
  removeFromWishlist: (userId: string, expertId: string) => http.delete<void>(`${API_BASE}/wishlist/${userId}/${expertId}`),
};
