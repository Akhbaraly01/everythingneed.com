import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Check if browser supports notifications
    if ("Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser",
        variant: "destructive",
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        toast({
          title: "Notifications Enabled",
          description: "You'll receive alerts for order and ticket updates",
        });
        return true;
      } else if (result === "denied") {
        toast({
          title: "Notifications Blocked",
          description: "Please enable notifications in your browser settings",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
    return false;
  };

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== "granted") {
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  const notifyOrderUpdate = (orderNumber: string, status: string) => {
    sendNotification(`Order ${orderNumber} Updated`, {
      body: `Your order status has been changed to: ${status}`,
      tag: `order-${orderNumber}`,
    });
  };

  const notifyTicketUpdate = (ticketNumber: string, status: string) => {
    sendNotification(`Ticket ${ticketNumber} Updated`, {
      body: `Your support ticket status has been changed to: ${status}`,
      tag: `ticket-${ticketNumber}`,
    });
  };

  const notifyHealthTicketUpdate = (ticketNumber: string, status: string) => {
    sendNotification(`Health Ticket ${ticketNumber} Updated`, {
      body: `Your appointment status has been changed to: ${status}`,
      tag: `health-${ticketNumber}`,
    });
  };

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
    notifyOrderUpdate,
    notifyTicketUpdate,
    notifyHealthTicketUpdate,
  };
};
