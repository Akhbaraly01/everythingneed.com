import AppLayout from '@/layouts/AppLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils';
import { Bell, Check, CheckCheck, Trash2, RefreshCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Pagination from '@/components/shared/Pagination';

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

const READ_FILTERS = [
    { value: '', label: 'All' },
    { value: '0', label: 'Unread' },
    { value: '1', label: 'Read' },
];

const EMPTY_META = { current_page: 1, last_page: 1, per_page: 15, total: 0 };

export default function NotificationsIndex() {
    const { url, props } = usePage();
    const sharedUnread = (props.unreadNotifications as number | undefined) ?? 0;

    const path = useMemo(() => url.split('?')[0] || '/notifications', [url]);
    const params = useMemo(() => new URLSearchParams(url.split('?')[1] ?? ''), [url]);
    const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1);
    const typeFilter = params.get('type') ?? '';
    const readFilter = params.get('is_read') ?? '';

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [meta, setMeta] = useState(EMPTY_META);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [knownTypes, setKnownTypes] = useState<string[]>([]);

    const fetchNotifications = useCallback(() => {
        setLoading(true);
        setError(null);

        const query: Record<string, string | number> = { page };
        if (typeFilter) query.type = typeFilter;
        if (readFilter !== '') query.is_read = readFilter;

        api.get<NotificationsResponse>('/api/notifications', { params: query })
            .then((res) => {
                const rows = res.data ?? [];
                setNotifications(rows);
                setMeta(res.meta ?? { ...EMPTY_META, current_page: page });
                setKnownTypes((prev) => {
                    const next = new Set(prev);
                    rows.forEach((n) => {
                        if (n.type) next.add(n.type);
                    });
                    return Array.from(next).sort();
                });
            })
            .catch((e) => {
                setError(errorMessage(e, 'Failed to load notifications'));
                setNotifications([]);
            })
            .finally(() => setLoading(false));
    }, [page, typeFilter, readFilter]);

    useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

    const applyFilters = (next: { type?: string; is_read?: string }) => {
        const query: Record<string, string> = {};
        const nextType = next.type ?? typeFilter;
        const nextRead = next.is_read ?? readFilter;

        if (nextType) query.type = nextType;
        if (nextRead !== '') query.is_read = nextRead;

        router.get(path, query, { preserveState: true });
    };

    const hrefFor = (target: number) => {
        const query = new URLSearchParams();
        query.set('page', String(target));
        if (typeFilter) query.set('type', typeFilter);
        if (readFilter !== '') query.set('is_read', readFilter);
        return `${path}?${query.toString()}`;
    };

    const markAsRead = async (id: string) => {
        try {
            await api.post(`/api/notifications/${id}/read`);
            setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
        } catch (e) {
            toast.error(errorMessage(e, 'Could not mark as read'));
        }
    };

    const markAllRead = async () => {
        try {
            await api.post('/api/notifications/read-all');
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        } catch (e) {
            toast.error(errorMessage(e, 'Could not mark all as read'));
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await api.del(`/api/notifications/${id}`);
            fetchNotifications();
        } catch (e) {
            toast.error(errorMessage(e, 'Could not delete notification'));
        }
    };

    const unreadCount = sharedUnread > 0 ? sharedUnread : notifications.filter((n) => !n.is_read).length;

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
                            onClick={() => void markAllRead()}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                        >
                            <CheckCheck className="h-4 w-4" /> Mark all read
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                        {READ_FILTERS.map((f) => {
                            const active = readFilter === f.value;
                            return (
                                <button
                                    key={f.label}
                                    type="button"
                                    onClick={() => applyFilters({ is_read: f.value })}
                                    className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                                        active
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    {f.label}
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => applyFilters({ type: '' })}
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                                typeFilter === ''
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                        >
                            All types
                        </button>
                        {knownTypes.map((t) => {
                            const active = typeFilter === t;
                            return (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => applyFilters({ type: t })}
                                    className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${
                                        active
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    {t.replace(/_/g, ' ')}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading...</p></div>
                ) : error ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-red-600 font-medium">{error}</p>
                        <button onClick={() => fetchNotifications()} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">
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
                                            onClick={() => void markAsRead(n.id)}
                                            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-green-600 dark:hover:bg-gray-700"
                                            title="Mark as read"
                                        >
                                            <Check className="h-4 w-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => void deleteNotification(n.id)}
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

                <Pagination currentPage={meta.current_page} lastPage={meta.last_page} hrefFor={hrefFor} />
            </div>
        </AppLayout>
    );
}
