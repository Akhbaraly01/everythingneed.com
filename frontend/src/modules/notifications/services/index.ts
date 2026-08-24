import { http, qs } from "@/core/api/client";
import { eventBus } from "@core/events/EventBus";
import type { NotificationService } from "../domain";

export const notificationService: NotificationService = {
  async create(data) {
    const result = await http.post<{ data: any }>("/api/notifications", data);
    const notification = result.data;
    eventBus.emit("NotificationCreated", { notificationId: notification?.id, userId: data.userId, title: data.title, type: data.type });
    return notification;
  },

  async markAsRead(notificationId) {
    await http.post(`/api/notifications/${notificationId}/read`);
    eventBus.emit("NotificationRead", { notificationId, userId: "", timestamp: new Date() });
    return { id: notificationId, isRead: true } as any;
  },

  async markAllAsRead(userId) {
    await http.post("/api/notifications/read-all");
  },

  async getUnreadCount(userId) {
    const data = await http.get<{ data?: any[] }>("/api/notifications");
    return data.data?.filter((n: any) => !n.is_read).length || 0;
  },

  async getById(notificationId) {
    const data = await http.get<{ data?: any[] }>("/api/notifications");
    const notifications = data.data || [];
    return notifications.find((n: any) => n.id === notificationId) || null;
  },

  async getByUserId(userId, params) {
    const data = await http.get<{ data?: any[]; meta?: { total?: number } }>(`/api/notifications${qs(params as Record<string, unknown>)}`);
    return { items: data.data || [], total: data.meta?.total || 0 };
  },

  async getUnreadByUserId(userId) {
    const data = await http.get<{ data?: any[] }>(`/api/notifications${qs({ unread: true })}`);
    return data.data || [];
  },
};
