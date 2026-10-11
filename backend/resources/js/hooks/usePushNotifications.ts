import { useEffect, useState } from 'react';
import { toast } from '@/components/ui/sonner';

interface PushNotifications {
    isSupported: boolean;
    permission: NotificationPermission;
    requestPermission: () => Promise<boolean>;
    sendNotification: (title: string, options?: NotificationOptions) => void;
    notifyOrderUpdate: (orderNumber: string, status: string) => void;
    notifyTicketUpdate: (ticketNumber: string, status: string) => void;
    notifyHealthTicketUpdate: (ticketNumber: string, status: string) => void;
}

export const usePushNotifications = (): PushNotifications => {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        if ('Notification' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = async (): Promise<boolean> => {
        if (!isSupported) {
            toast.error('Push notifications are not supported in this browser');
            return false;
        }

        try {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === 'granted') {
                toast.success("You'll receive alerts for order and ticket updates");
                return true;
            }

            if (result === 'denied') {
                toast.error('Please enable notifications in your browser settings');
            }

            return false;
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    };

    const sendNotification = (title: string, options?: NotificationOptions): void => {
        if (!isSupported || permission !== 'granted') {
            return;
        }

        try {
            const notification = new Notification(title, {
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                ...options,
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            setTimeout(() => notification.close(), 5000);
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    };

    const notifyOrderUpdate = (orderNumber: string, status: string): void => {
        sendNotification(`Order ${orderNumber} Updated`, {
            body: `Your order status has been changed to: ${status}`,
            tag: `order-${orderNumber}`,
        });
    };

    const notifyTicketUpdate = (ticketNumber: string, status: string): void => {
        sendNotification(`Ticket ${ticketNumber} Updated`, {
            body: `Your support ticket status has been changed to: ${status}`,
            tag: `ticket-${ticketNumber}`,
        });
    };

    const notifyHealthTicketUpdate = (ticketNumber: string, status: string): void => {
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
