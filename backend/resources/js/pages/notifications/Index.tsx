import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils';
import { Bell, Check, CheckCheck, Trash2, RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Notification {
    id: string;
    title: string;
    message: string;
    type?: string;
    is_read: boolean;
    created_at: string;
}

interface NotificationsResponse {
    data: Notification[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
}

export default function NotificationsIndex() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchNotifications = () => {
        setLoading(true);
        setError(null);
        api.get<NotificationsResponse>('/api/notifications')
            .then((res) => setNotifications(res.data))
            .catch((e) => {
                setError(errorMessage(e, 'Failed to load notifications'));
                setNotifications([]);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchNotifications(); }, []);

    const markAsRead = async (id: string) => {
        try {
            await api.post(`/api/notifications/${id}/read`);
            setNotifications(notifications.map((n) => n.id === id ? { ...n, is_read: true } : n));
        } catch (e) {
            toast.error(errorMessage(e, 'Could not mark as read'));
        }
    };

    const markAllRead = async () => {
        try {
            await api.post('/api/notifications/read-all');
            setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
        } catch (e) {
            toast.error(errorMessage(e, 'Could not mark all as read'));
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await api.del(`/api/notifications/${id}`);
            setNotifications(notifications.filter((n) => n.id !== id));
        } catch (e) {
            toast.error(errorMessage(e, 'Could not delete notification'));
        }
    };

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    return (
        <AppLayout title="Notifications">
            <Head title="Notifications" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up'}
                    </p>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllRead}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                        >
                            <CheckCheck className="h-4 w-4" /> Mark all read
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading...</p></div>
                ) : error ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-red-600 font-medium">{error}</p>
                        <button onClick={fetchNotifications} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                            <RefreshCcw className="h-4 w-4" /> Retry
                        </button>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Bell className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No notifications</h3>
                        <p className="mt-2 text-gray-500">You're all caught up!</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                className={`flex items-start gap-4 rounded-lg bg-white p-4 shadow transition dark:bg-gray-800 ${
                                    !n.is_read ? 'border-l-4 border-indigo-500' : ''
                                }`}
                            >
                                <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${!n.is_read ? 'bg-indigo-500' : 'bg-transparent'}`} />
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm ${!n.is_read ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {n.title}
                                    </p>
                                    <p className="mt-0.5 text-sm text-gray-500">{n.message}</p>
                                    <p className="mt-1 text-xs text-gray-400">{formatDateTime(n.created_at)}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    {!n.is_read && (
                                        <button
                                            onClick={() => markAsRead(n.id)}
                                            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-green-600 dark:hover:bg-gray-700"
                                            title="Mark as read"
                                        >
                                            <Check className="h-4 w-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteNotification(n.id)}
                                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
