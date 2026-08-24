import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { useApp } from '@/hooks/use-app';
import { formatDateTime } from '@/lib/utils';
import { Bell, Check, CheckCheck } from 'lucide-react';

interface NotificationItem {
    id: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

interface NotificationsProps {
    notifications: {
        data: NotificationItem[];
        meta: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        };
    };
}

export default function Notifications({ notifications }: NotificationsProps) {
    return (
        <AppLayout title="Notifications">
            <Head title="Notifications" />

            <div className="space-y-6">
                {notifications.data.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Bell className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No notifications</h3>
                        <p className="mt-2 text-gray-500">You're all caught up!</p>
                    </div>
                ) : (
                    <div className="divide-y rounded-lg bg-white shadow dark:divide-gray-700 dark:bg-gray-800">
                        {notifications.data.map((notification) => (
                            <div
                                key={notification.id}
                                className={`flex items-start gap-4 p-4 ${
                                    !notification.is_read ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                                }`}
                            >
                                <div className={`rounded-full p-2 ${
                                    notification.is_read ? 'bg-gray-100' : 'bg-indigo-100'
                                }`}>
                                    <Bell className={`h-4 w-4 ${
                                        notification.is_read ? 'text-gray-400' : 'text-indigo-600'
                                    }`} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{notification.title}</p>
                                    <p className="text-sm text-gray-500">{notification.message}</p>
                                    <p className="mt-1 text-xs text-gray-400">{formatDateTime(notification.created_at)}</p>
                                </div>
                                {!notification.is_read && (
                                    <button className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <CheckCheck className="h-4 w-4 text-gray-400" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
