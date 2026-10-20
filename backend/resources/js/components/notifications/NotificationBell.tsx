import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { useLanguage } from '@/lib/use-language';

export interface NotificationItem {
    id: string;
    title: string;
    message: string;
    type?: string;
    related_id?: string | null;
    is_read: boolean;
    created_at: string;
}

interface NotificationsResponse {
    data: NotificationItem[];
    meta?: { total?: number };
}

interface SharedWorkspace {
    current?: string;
    adminHrefs?: string[];
}

const TYPE_ICONS: Record<string, string> = {
    order: '\u{1F4E6}',
    support: '\u{1F3AB}',
    message: '\u{1F4AC}',
    kyc: '\u{1F9FD}',
    wallet: '\u{1F4B0}',
    withdrawal: '\u{1F4B8}',
    bill: '\u{1F4C4}',
    booking: '\u{1F4C5}',
    certificate: '\u{1F3C6}',
    enrollment: '\u{1F4DA}',
    health_ticket: '\u{1F3E5}',
    need_offer: '\u{1F4E6}',
    need_payout: '\u{1F4B0}',
    // legacy aliases kept for rows created before the type rename
    order_update: '\u{1F4E6}',
    ticket_update: '\u{1F3AB}',
};

const TYPE_LINKS: Record<string, (relatedId?: string | null) => string> = {
    order: (id) => (id ? `/orders/${id}` : '/account/orders'),
    order_update: (id) => (id ? `/orders/${id}` : '/account/orders'),
    support: (id) => (id ? `/account/support/${id}` : '/account/support'),
    ticket_update: (id) => (id ? `/account/support/${id}` : '/account/support'),
    message: () => '/account/messages',
    kyc: () => '/account/kyc',
    wallet: () => '/account/wallet',
    withdrawal: () => '/account/wallet',
    bill: () => '/bills',
    booking: (id) => (id ? `/account/bookings/${id}` : '/account/bookings'),
    certificate: () => '/account/certificates',
    enrollment: () => '/learn/my-courses',
    health_ticket: () => '/healthcare/tickets',
    // every need_* event carries the need request id
    need_offer: (id) => (id ? `/account/needs/${id}` : '/account/needs'),
    need_offer_accepted: (id) => (id ? `/account/needs/${id}` : '/account/needs'),
    need_offer_rejected: (id) => (id ? `/account/needs/${id}` : '/account/needs'),
    need_paid: (id) => (id ? `/account/needs/${id}` : '/account/needs'),
    need_fulfilled: (id) => (id ? `/account/needs/${id}` : '/account/needs'),
    need_completed: (id) => (id ? `/account/needs/${id}` : '/account/needs'),
    need_payout: () => '/account/wallet',
    need_rejected: (id) => (id ? `/account/needs/${id}` : '/account/needs'),
    need_expired: (id) => (id ? `/account/needs/${id}` : '/account/needs'),
    need_disputed: (id) => (id ? `/account/needs/${id}` : '/account/needs'),
    need_refunded: (id) => (id ? `/account/needs/${id}` : '/account/needs'),
};

/**
 * Global notification bell.
 *
 * Badge source of truth is the server-shared `unreadNotifications` prop
 * (counted for the whole account, not just the 8 fetched rows), refreshed
 * via partial Inertia reload after every read mutation — so the badge never
 * shows 0 before the dropdown has been opened and never goes stale after
 * marking items read. In the admin console the "View all" entry points at
 * the console notifications feed when the role may open it, and falls back
 * to the personal marketplace feed otherwise (never a 403 dead-end).
 */
export default function NotificationBell() {
    const { t } = useLanguage();
    const { unreadNotifications, workspace } = usePage().props as {
        unreadNotifications?: number;
        workspace?: SharedWorkspace | null;
    };
    const sharedUnread = Number(unreadNotifications ?? 0);

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<NotificationItem[]>([]);
    // Optimistic override between the mutation and the shared-prop reload;
    // cleared whenever the server sends a fresh authoritative count.
    const [localUnread, setLocalUnread] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setLocalUnread(null);
    }, [sharedUnread]);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get<NotificationsResponse>('/api/notifications', {
                params: { per_page: 8 },
            });
            setItems(res.data ?? []);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!open) return;
        void fetchNotifications();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        const onClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('keydown', onKey);
        document.addEventListener('mousedown', onClick);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('mousedown', onClick);
        };
    }, [open, fetchNotifications]);

    const unreadCount = localUnread ?? sharedUnread;
    const refreshSharedCount = useCallback(() => {
        router.reload({ only: ['unreadNotifications'] });
    }, []);

    const markAsRead = async (id: string) => {
        setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
        setLocalUnread((prev) => Math.max(0, (prev ?? sharedUnread) - 1));
        try {
            await api.post(`/api/notifications/${id}/read`);
            refreshSharedCount();
        } catch {
            // API failed -> row is still unread server-side: drop the
            // optimistic override so the badge snaps back to the shared count.
            setLocalUnread(null);
        }
    };

    const markAllAsRead = async () => {
        setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setLocalUnread(0);
        try {
            await api.post('/api/notifications/read-all');
            refreshSharedCount();
        } catch {
            setLocalUnread(null);
        }
    };

    const linkFor = (n: NotificationItem): string => {
        let href = n.type ? TYPE_LINKS[n.type]?.(n.related_id) : undefined;
        // Unknown need_* event -> its detail page (needs always carry the id).
        if (!href && n.type?.startsWith('need_') && n.related_id) {
            href = `/account/needs/${n.related_id}`;
        }
        // A type-link built from a missing related_id (e.g. '/orders/')
        // is not navigable — fall back to the notification list.
        return href && !href.endsWith('/') ? href : '/notifications';
    };

    const inAdminConsole = workspace?.current === 'admin';
    const canOpenAdminFeed = inAdminConsole && (workspace?.adminHrefs ?? []).includes('/admin/notifications');
    const viewAllHref = canOpenAdminFeed ? '/admin/notifications' : '/notifications';

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label={unreadCount > 0
                    ? t('notifications.count', { n: unreadCount, defaultValue: `Notifications, ${unreadCount} unread` })
                    : t('nav.notifications')}
                aria-expanded={open}
                className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-foreground hover:bg-muted"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive p-0 text-[10px] font-medium text-destructive-foreground">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-border bg-card shadow-lg">
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                        <h3 className="text-sm font-semibold">{t('nav.notifications')}</h3>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={() => void markAllAsRead()}
                                className="text-xs text-primary hover:underline"
                            >
                                {t('notifications.markAllRead', { defaultValue: 'Mark all read' })}
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <p className="p-4 text-center text-sm text-muted-foreground">{t('common.loading')}</p>
                        ) : items.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <Bell className="mx-auto mb-2 h-8 w-8 opacity-50" />
                                <p className="text-sm">{t('notifications.empty', { defaultValue: 'No notifications yet' })}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {items.map((n) => (
                                    <Link
                                        key={n.id}
                                        href={linkFor(n)}
                                        onClick={() => {
                                            if (!n.is_read) void markAsRead(n.id);
                                            setOpen(false);
                                        }}
                                        className={`block px-4 py-3 hover:bg-muted/50 ${
                                            !n.is_read ? 'bg-primary/5' : ''
                                        }`}
                                    >
                                        <div className="flex gap-3">
                                            <span className="text-lg">
                                                {(n.type && TYPE_ICONS[n.type]) ?? '\u{1F514}'}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">{n.title}</p>
                                                <p className="line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {formatDateTime(n.created_at)}
                                                </p>
                                            </div>
                                            {!n.is_read && (
                                                <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="border-t border-border p-2">
                        <Link
                            href={viewAllHref}
                            onClick={() => setOpen(false)}
                            className="block w-full rounded-md py-2 text-center text-sm text-primary hover:bg-muted"
                        >
                            {t('notifications.viewAll', { defaultValue: 'View all notifications' })}
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
