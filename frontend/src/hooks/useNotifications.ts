import { useCallback, useEffect, useState } from "react";
import { http } from "@core/api";
import { listenToUserChannel } from "@core/realtime/echo";
import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const API = import.meta.env.VITE_API_URL || "/api";

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  related_id: string | null;
  created_at: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { notifyOrderUpdate, notifyTicketUpdate, notifyHealthTicketUpdate, permission } = usePushNotifications();

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const res = await http.get<{ data: Notification[] }>(`${API}/notifications?per_page=20`);
      const data = Array.isArray(res.data) ? res.data : [];
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length || 0);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setLoading(false);
    }
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      await http.post(`${API}/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // write failed; local state left unchanged
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await http.post(`${API}/notifications/read-all`);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // write failed; local state left unchanged
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    // Live push over Reverb — new notifications arrive instantly.
    return listenToUserChannel(user.id, (payload) => {
      fetchNotifications();

      // Mirror to OS-level push where permission is granted
      const type = String(payload.type ?? "");
      if (type.startsWith("order")) notifyOrderUpdate(String(payload.title ?? "Update"), String(payload.message ?? ""));
      else if (type.startsWith("ticket")) notifyTicketUpdate(String(payload.title ?? "Update"), String(payload.message ?? ""));
      else if (type.startsWith("health")) notifyHealthTicketUpdate(String(payload.title ?? "Update"), String(payload.message ?? ""));
    });
  }, [user, permission, fetchNotifications, notifyOrderUpdate, notifyTicketUpdate, notifyHealthTicketUpdate]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
};
