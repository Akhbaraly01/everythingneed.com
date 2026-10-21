import AdminLayout from '@/layouts/AdminLayout';
import { Head, usePage } from '@inertiajs/react';
import { api, errorMessage, rows } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import DataTable from '@/components/shared/DataTable';
import SearchInput from '@/components/shared/SearchInput';
import { useConfirm } from '@/lib/confirm';
import { Bell, CheckCircle, Circle, Send, Trash2, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Notification {
    id: string;
    title: string;
    message?: string | null;
    type?: string | null;
    is_read: boolean;
    created_at: string;
    user_name?: string | null;
    user_email?: string | null;
}

interface Meta {
    page: number;
    per_page: number;
    total: number;
}

interface Recipient {
    id: string;
    name: string;
    email: string;
}

interface AudienceRole {
    role: string;
    users: number;
}

type Audience = 'user' | 'role' | 'all';

export default function AdminNotifications() {
    const ask = useConfirm();
    const roles = (usePage().props.auth as { roles?: string[] } | null)?.roles ?? [];
    const canManage = roles.some((r) => ['super_admin', 'administrator'].includes(r));

    const [items, setItems] = useState<Notification[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [read, setRead] = useState('all');
    const [type, setType] = useState('');
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [reloadToken, setReloadToken] = useState(0);
    const [busy, setBusy] = useState<string | null>(null);

    const [composing, setComposing] = useState(false);
    const [audience, setAudience] = useState<Audience>('user');
    const [audienceRoles, setAudienceRoles] = useState<AudienceRole[]>([]);
    const [usersTotal, setUsersTotal] = useState(0);
    const [role, setRole] = useState('');
    const [recipientQuery, setRecipientQuery] = useState('');
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [notificationType, setNotificationType] = useState('admin_broadcast');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams({ page: String(page), is_read: read });
        if (type) params.set('type', type);
        if (query) params.set('search', query);

        setLoading(true);
        api.get<{ data: Notification[]; meta: Meta }>(`/api/admin/notifications?${params.toString()}`)
            .then((res) => { setItems(rows<Notification>(res)); setMeta(res.meta); })
            .catch((e) => { setItems([]); toast.error(errorMessage(e, 'Failed to load notifications')); })
            .finally(() => setLoading(false));
    }, [read, type, query, page, reloadToken]);

    useEffect(() => {
        if (!composing) return;
        api.get<{ data: { roles: AudienceRole[]; users_total: number } }>('/api/admin/notifications/audiences')
            .then((res) => {
                setAudienceRoles(res.data.roles ?? []);
                setUsersTotal(res.data.users_total ?? 0);
            })
            .catch(() => undefined);
    }, [composing]);

    useEffect(() => {
        if (!composing || audience !== 'user') return;
        const timer = setTimeout(() => {
            const params = new URLSearchParams();
            if (recipientQuery) params.set('q', recipientQuery);
            const qs = params.toString();
            api.get<{ data: Recipient[] }>(`/api/admin/notifications/recipients${qs ? `?${qs}` : ''}`)
                .then((res) => setRecipients(res.data ?? []))
                .catch(() => setRecipients([]));
        }, 250);

        return () => clearTimeout(timer);
    }, [composing, audience, recipientQuery]);

    const openComposer = () => {
        setComposing(true);
        setAudience('user');
        setRole('');
        setRecipientQuery('');
        setRecipients([]);
        setSelectedRecipient(null);
        setTitle('');
        setBody('');
        setNotificationType('admin_broadcast');
    };

    const send = async () => {
        if (!title.trim() || !body.trim()) {
            toast.error('Title and message are required');
            return;
        }
        if (audience === 'user' && !selectedRecipient) {
            toast.error('Choose a recipient');
            return;
        }
        if (audience === 'role' && !role) {
            toast.error('Choose a role');
            return;
        }

        if (audience !== 'user') {
            const target = audience === 'all'
                ? `all ${usersTotal} users`
                : `every user with the ${role} role`;
            const ok = await ask({
                title: 'Send this notification?',
                description: `${target} will receive “${title.trim()}”.`,
                confirmLabel: 'Send notification',
            });
            if (!ok) return;
        }

        setSending(true);
        try {
            const res = await api.post<{ message?: string }>('/api/admin/notifications/send', {
                audience,
                recipient_id: audience === 'user' ? selectedRecipient?.id : undefined,
                role: audience === 'role' ? role : undefined,
                title: title.trim(),
                message: body.trim(),
                type: notificationType.trim() || undefined,
            });
            toast.success(res.message ?? 'Notification sent');
            setComposing(false);
            setReloadToken((value) => value + 1);
        } catch (e) {
            toast.error(errorMessage(e, 'Notification send failed'));
        } finally {
            setSending(false);
        }
    };

    const removeNotification = async (notification: Notification) => {
        const ok = await ask({
            title: 'Remove this notification?',
            description: 'It is soft-deleted for everyone and disappears from recipient inboxes.',
            confirmLabel: 'Remove notification',
            danger: true,
        });
        if (!ok) return;

        setBusy(notification.id);
        try {
            await api.del(`/api/admin/notifications/${notification.id}`);
            setReloadToken((value) => value + 1);
            toast.success('Notification removed');
        } catch (e) {
            toast.error(errorMessage(e, 'Could not remove notification'));
        } finally {
            setBusy(null);
        }
    };

    return (
        <AdminLayout title="Notifications">
            <Head title="Notifications" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                        <Bell className="h-6 w-6" /> Platform Notifications
                    </h1>
                    <div className="flex items-center gap-3">
                        {meta && <span className="text-sm text-gray-500">{meta.total} notifications</span>}
                        {canManage && (
                            <button onClick={openComposer}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                                <Send className="h-4 w-4" /> Send notification
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search title, message, recipient" />
                    <input value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} placeholder="Filter type"
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200" />
                    <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-0.5 dark:border-gray-700 dark:bg-gray-800">
                        {['all', 'unread', 'read'].map((r) => (
                            <button key={r} onClick={() => { setRead(r); setPage(1); }}
                                className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize ${read === r ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

                <DataTable
                    columns={[
                        {
                            key: 'status', header: 'Status',
                            render: (n) => (n.is_read
                                ? <CheckCircle className="h-4 w-4 text-green-600" />
                                : <Circle className="h-4 w-4 text-blue-600" />),
                        },
                        { key: 'title', header: 'Title', accessor: 'title', sortable: true, render: (n) => <span className="font-medium text-gray-900 dark:text-white">{n.title}</span> },
                        {
                            key: 'message', header: 'Message',
                            render: (n) => <span className="text-xs text-gray-600 dark:text-gray-300">{n.message || '—'}</span>,
                        },
                        {
                            key: 'type', header: 'Type', accessor: 'type', sortable: true,
                            render: (n) => (
                                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs capitalize text-gray-700 dark:bg-gray-700 dark:text-gray-300">{n.type ?? '—'}</span>
                            ),
                        },
                        {
                            key: 'recipient', header: 'Recipient', accessor: 'user_name', sortable: true,
                            render: (n) => (
                                <>
                                    <p className="text-gray-900 dark:text-white">{n.user_name ?? '—'}</p>
                                    <p className="text-xs text-gray-500">{n.user_email}</p>
                                </>
                            ),
                        },
                        {
                            key: 'date', header: 'Date', accessor: 'created_at', sortable: true,
                            render: (n) => <span className="text-xs text-gray-500">{formatDateTime(n.created_at)}</span>,
                        },
                        {
                            key: 'actions', header: 'Actions',
                            render: (n) => canManage ? (
                                <button disabled={busy === n.id} onClick={() => void removeNotification(n)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 dark:border-red-900 dark:hover:bg-red-950/30">
                                    <Trash2 className="h-3 w-3" /> Remove
                                </button>
                            ) : <span className="text-xs text-gray-400">View only</span>,
                        },
                    ]}
                    data={items}
                    loading={loading}
                    emptyTitle="No notifications found"
                    emptyDescription="Sent platform notifications appear here."
                    rowClassName={(n) => (n.is_read ? '' : 'bg-blue-50/50 dark:bg-blue-900/10')}
                />

                {meta && meta.total > meta.per_page && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Page {meta.page} · {meta.total} notifications</span>
                        <div className="flex gap-2">
                            <button disabled={meta.page <= 1} onClick={() => setPage(page - 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Previous</button>
                            <button disabled={meta.page * meta.per_page >= meta.total} onClick={() => setPage(page + 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Next</button>
                        </div>
                    </div>
                )}
            </div>

            {composing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl dark:bg-gray-800" role="dialog" aria-modal="true">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Send notification</h2>
                                <p className="text-xs text-gray-500">Persisted inbox row plus best-effort realtime push.</p>
                            </div>
                            <button onClick={() => setComposing(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700" aria-label="Close">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mt-4 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Audience</label>
                                <div className="mt-1 flex flex-wrap gap-2">
                                    {([
                                        ['user', 'Single user'],
                                        ['role', 'Role'],
                                        ['all', 'Everyone'],
                                    ] as const).map(([value, label]) => (
                                        <button key={value} onClick={() => setAudience(value)}
                                            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${audience === value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {audience === 'user' && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Recipient</label>
                                    {selectedRecipient ? (
                                        <div className="mt-1 flex items-center justify-between rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600">
                                            <span>{selectedRecipient.name} · {selectedRecipient.email}</span>
                                            <button onClick={() => setSelectedRecipient(null)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="mt-1">
                                                <SearchInput value={recipientQuery} onChange={setRecipientQuery} placeholder="Search name or email" />
                                            </div>
                                            <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                                {recipients.length === 0 ? (
                                                    <p className="p-3 text-xs text-gray-500">No matching users.</p>
                                                ) : recipients.map((recipient) => (
                                                    <button key={recipient.id} onClick={() => setSelectedRecipient(recipient)}
                                                        className="flex w-full items-center justify-between border-b border-gray-100 px-3 py-2 text-left text-sm last:border-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700">
                                                        <span>{recipient.name}</span>
                                                        <span className="text-xs text-gray-500">{recipient.email}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {audience === 'role' && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Role</label>
                                    <select value={role} onChange={(e) => setRole(e.target.value)}
                                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                        <option value="">Choose a role</option>
                                        {audienceRoles.map((r) => <option key={r.role} value={r.role}>{r.role} ({r.users} users)</option>)}
                                    </select>
                                </div>
                            )}

                            {audience === 'all' && (
                                <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                                    <Users className="h-4 w-4" /> This sends to all {usersTotal} active accounts.
                                </p>
                            )}

                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Title</label>
                                <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    placeholder="Short headline" />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Message</label>
                                <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={500}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    placeholder="What should the recipient know?" />
                                <p className="mt-1 text-right text-[10px] text-gray-400">{body.length}/500</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Type</label>
                                <input value={notificationType} onChange={(e) => setNotificationType(e.target.value)} maxLength={60}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    placeholder="admin_broadcast" />
                            </div>
                        </div>

                        <div className="mt-5 flex justify-end gap-2">
                            <button onClick={() => setComposing(false)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600">Cancel</button>
                            <button disabled={sending || !title.trim() || !body.trim()} onClick={() => void send()}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40">
                                <Send className="h-4 w-4" /> {sending ? 'Sending...' : 'Send notification'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
