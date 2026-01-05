import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { usePushNotifications } from "@/hooks/usePushNotifications";

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
  const { toast } = useToast();
  const { notifyOrderUpdate, notifyTicketUpdate, notifyHealthTicketUpdate, permission } = usePushNotifications();

  const fetchNotifications = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching notifications:", error);
      return;
    }

    setNotifications(data || []);
    setUnreadCount(data?.filter((n) => !n.is_read).length || 0);
    setLoading(false);
  };

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    // Subscribe to real-time notifications
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });
        }
      )
      .subscribe();

    // Subscribe to ticket updates
    const ticketChannel = supabase
      .channel("ticket-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tickets",
        },
        (payload) => {
          const ticketNumber = payload.new.ticket_number;
          const status = payload.new.status;
          toast({
            title: "Ticket Updated",
            description: `Ticket status changed to ${status}`,
          });
          // Send push notification
          if (permission === "granted") {
            notifyTicketUpdate(ticketNumber, status);
          }
        }
      )
      .subscribe();

    // Subscribe to order updates
    const orderChannel = supabase
      .channel("order-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "medicine_orders",
        },
        (payload) => {
          const orderNumber = payload.new.order_number;
          const status = payload.new.status;
          toast({
            title: "Order Updated",
            description: `Order status changed to ${status}`,
          });
          // Send push notification
          if (permission === "granted") {
            notifyOrderUpdate(orderNumber, status);
          }
        }
      )
      .subscribe();

    // Subscribe to health ticket updates
    const healthChannel = supabase
      .channel("health-ticket-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "health_tickets",
        },
        (payload) => {
          const ticketNumber = payload.new.ticket_number;
          const status = payload.new.status;
          toast({
            title: "Health Ticket Updated",
            description: `Your appointment status changed to ${status}`,
          });
          // Send push notification
          if (permission === "granted") {
            notifyHealthTicketUpdate(ticketNumber, status);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(ticketChannel);
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(healthChannel);
    };
  }, [user, permission]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
};
