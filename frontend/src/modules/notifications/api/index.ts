import { http, qs } from "@core/api";
import type { CreateNotificationInput } from "../validators";

const API_BASE = "/api/notifications";

export const notificationsApi = {
  getById: (id: string) => http.get<any>(`${API_BASE}/${id}`),
  getByUser: (userId: string, params?: any) => http.get<any[]>(`${API_BASE}/user/${userId}${qs(params)}`),
  getUnreadByUser: (userId: string) => http.get<any[]>(`${API_BASE}/user/${userId}/unread`),
  getUnreadCount: (userId: string) => http.get<number>(`${API_BASE}/user/${userId}/unread/count`),
  create: (data: CreateNotificationInput) => http.post<any>(API_BASE, data),
  markAsRead: (id: string) => http.post<void>(`${API_BASE}/${id}/read`),
  markAllAsRead: (userId: string) => http.post<void>(`${API_BASE}/user/${userId}/read-all`),
};
