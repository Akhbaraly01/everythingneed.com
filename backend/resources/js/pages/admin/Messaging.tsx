import AdminLayout from '@/layouts/AdminLayout';
import { Head, usePage } from '@inertiajs/react';
import { api, errorMessage, rows } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import DataTable from '@/components/shared/DataTable';
import SearchInput from '@/components/shared/SearchInput';
import { useConfirm } from '@/lib/confirm';
import { MessageSquare, RotateCcw, Trash2, UserRound, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Participant {
    id: string;
    name?: string | null;
    email?: string | null;
}

interface Conversation {
    id: string;
    customer?: Participant | null;
    worker?: Participant | null;
    booking_id?: string | null;
    messages_count?: number;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
}

interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    message: string;
    message_type: string;
    is_read: boolean;
    created_at: string;
    deleted_at?: string | null;
    sender?: Participant | null;
}

interface ConversationDetail extends Conversation {
    messages: Message[];
}

interface Meta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export default function AdminMessaging() {
    const ask = useConfirm();
    const roles = (usePage().props.auth as { roles?: string[] } | null)?.roles ?? [];
    const canManage = roles.some((r) => ['super_admin', 'administrator', 'support_admin'].includes(r));

    const [items, setItems] = useState<Conversation[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState('all');
    const [page, setPage] = useState(1);
    const [reloadToken, setReloadToken] = useState(0);

    const [selected, setSelected] = useState<ConversationDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams({ page: String(page), per_page: '20', status });
        if (query) params.set('search', query);

        setLoading(true);
        api.get<{ data: Conversation[]; meta: Meta }>(`/api/admin/messaging/conversations?${params.toString()}`)
            .then((res) => { setItems(rows<Conversation>(res)); setMeta(res.meta); })
            .catch((e) => { setItems([]); toast.error(errorMessage(e, 'Failed to load conversations')); })
            .finally(() => setLoading(false));
    }, [query, status, page, reloadToken]);

    const openConversation = (conversation: Conversation) => {
        setDetailLoading(true);
        setSelected({ ...conversation, messages: [] });
        api.get<{ data: ConversationDetail }>(`/api/admin/messaging/conversations/${conversation.id}`)
            .then((res) => setSelected(res.data))
            .catch((e) => {
                toast.error(errorMessage(e, 'Failed to load conversation'));
                setSelected(null);
            })
            .finally(() => setDetailLoading(false));
    };

    const removeConversation = async (conversation: Conversation) => {
        const ok = await ask({
            title: 'Remove this conversation?',
            description: 'The thread is soft-deleted and hidden from both participants. Moderators can restore it later.',
            confirmLabel: 'Remove conversation',
            danger: true,
        });
        if (!ok) return;

        setBusy(conversation.id);
        try {
            await api.del(`/api/admin/messaging/conversations/${conversation.id}`);
            setSelected(null);
            setReloadToken((value) => value + 1);
            toast.success('Conversation removed');
        } catch (e) {
            toast.error(errorMessage(e, 'Conversation removal failed'));
        } finally {
            setBusy(null);
        }
    };

    const restoreConversation = async (conversation: Conversation) => {
        setBusy(conversation.id);
        try {
            await api.post(`/api/admin/messaging/conversations/${conversation.id}/restore`);
            setReloadToken((value) => value + 1);
            if (selected?.id === conversation.id) {
                setSelected({ ...selected, deleted_at: null });
            }
            toast.success('Conversation restored');
        } catch (e) {
            toast.error(errorMessage(e, 'Conversation restore failed'));
        } finally {
            setBusy(null);
        }
    };

    const removeMessage = async (message: Message) => {
        const ok = await ask({
            title: 'Remove this message?',
            description: 'The message is soft-deleted and hidden from participants.',
            confirmLabel: 'Remove message',
            danger: true,
        });
        if (!ok) return;

        setBusy(message.id);
        try {
            await api.del(`/api/admin/messaging/messages/${message.id}`);
            setSelected((current) => current ? {
                ...current,
                messages: current.messages.map((m) => m.id === message.id ? { ...m, deleted_at: new Date().toISOString() } : m),
            } : current);
            setReloadToken((value) => value + 1);
            toast.success('Message removed');
        } catch (e) {
            toast.error(errorMessage(e, 'Message removal failed'));
        } finally {
            setBusy(null);
        }
    };

    return (
        <AdminLayout title="Messaging">
            <Head title="Messaging" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                        <MessageSquare className="h-6 w-6" /> Messaging
                    </h1>
                    {meta && <span className="text-sm text-gray-500">{meta.total} conversations</span>}
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                    Support and moderation access only. Opening a thread does not send read receipts; removals are soft deletes and audited.
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search participants or message text" />
                    <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
                        <option value="all">All conversations</option>
                        <option value="active">Active</option>
                        <option value="removed">Removed</option>
                    </select>
                </div>

                <DataTable
                    columns={[
                        {
                            key: 'participants', header: 'Participants',
                            render: (c: Conversation) => (
                                <div className="space-y-1">
                                    <p className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-white">
                                        <UserRound className="h-3.5 w-3.5 text-gray-400" />
                                        {c.customer?.name ?? 'Deleted customer'}
                                    </p>
                                    <p className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <UserRound className="h-3 w-3 text-gray-400" />
                                        {c.worker?.name ?? 'Deleted worker'}
                                    </p>
                                    {c.booking_id && <p className="font-mono text-[10px] text-gray-400">Booking {c.booking_id.slice(0, 8)}</p>}
                                </div>
                            ),
                        },
                        {
                            key: 'messages', header: 'Messages',
                            render: (c: Conversation) => <span className="text-sm">{c.messages_count ?? 0}</span>,
                        },
                        {
                            key: 'updated', header: 'Last activity', sortable: true,
                            render: (c: Conversation) => <span className="text-xs text-gray-500">{formatDateTime(c.updated_at)}</span>,
                        },
                        {
                            key: 'status', header: 'Status',
                            render: (c: Conversation) => c.deleted_at
                                ? <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Removed</span>
                                : <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">Active</span>,
                        },
                        {
                            key: 'actions', header: 'Actions',
                            render: (c: Conversation) => (
                                <div className="flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={() => openConversation(c)}
                                        className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 dark:border-gray-600 dark:text-gray-300">View</button>
                                    {canManage && (c.deleted_at ? (
                                        <button disabled={busy === c.id} onClick={() => void restoreConversation(c)}
                                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-700 disabled:opacity-40 dark:border-emerald-900 dark:text-emerald-300">
                                            <RotateCcw className="h-3 w-3" /> Restore
                                        </button>
                                    ) : (
                                        <button disabled={busy === c.id} onClick={() => void removeConversation(c)}
                                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 disabled:opacity-40 dark:border-red-900">
                                            <Trash2 className="h-3 w-3" /> Remove
                                        </button>
                                    ))}
                                </div>
                            ),
                        },
                    ]}
                    data={items}
                    loading={loading}
                    emptyTitle="No conversations found"
                    emptyDescription="Direct customer-provider chats appear here."
                    onRowClick={(conversation) => openConversation(conversation)}
                />

                {meta && meta.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Page {meta.current_page} of {meta.last_page} · {meta.total} conversations</span>
                        <div className="flex gap-2">
                            <button disabled={meta.current_page <= 1} onClick={() => setPage(page - 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Previous</button>
                            <button disabled={meta.current_page >= meta.last_page} onClick={() => setPage(page + 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Next</button>
                        </div>
                    </div>
                )}
            </div>

            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl dark:bg-gray-800" role="dialog" aria-modal="true">
                        <div className="flex items-start justify-between border-b border-gray-200 p-5 dark:border-gray-700">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {selected.customer?.name ?? 'Deleted customer'} and {selected.worker?.name ?? 'Deleted worker'}
                                </h2>
                                <p className="text-xs text-gray-500">
                                    {selected.customer?.email ?? '—'} · {selected.worker?.email ?? '—'}
                                </p>
                                {selected.deleted_at && <p className="mt-1 text-xs font-medium text-red-600">This conversation is removed</p>}
                            </div>
                            <button onClick={() => setSelected(null)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700" aria-label="Close conversation">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5">
                            {detailLoading ? (
                                <div className="py-10 text-center text-sm text-gray-500">Loading conversation...</div>
                            ) : selected.messages.length === 0 ? (
                                <div className="py-10 text-center text-sm text-gray-500">No messages in this conversation.</div>
                            ) : (
                                <div className="space-y-3">
                                    {selected.messages.map((message) => (
                                        <div key={message.id} className={`rounded-lg border p-3 ${message.deleted_at ? 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20' : 'border-gray-200 dark:border-gray-700'}`}>
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-900 dark:text-white">{message.sender?.name ?? 'Deleted user'}</p>
                                                    <p className="text-[10px] text-gray-500">{formatDateTime(message.created_at)} · {message.message_type}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {message.deleted_at ? (
                                                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">Removed</span>
                                                    ) : canManage && (
                                                        <button disabled={busy === message.id} onClick={() => void removeMessage(message)}
                                                            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:hover:bg-red-950/30" title="Remove message">
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <p className={`mt-2 whitespace-pre-wrap break-words text-sm ${message.deleted_at ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-200'}`}>
                                                {message.message}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {canManage && !detailLoading && (
                            <div className="flex justify-end gap-2 border-t border-gray-200 p-4 dark:border-gray-700">
                                {selected.deleted_at ? (
                                    <button disabled={busy === selected.id} onClick={() => void restoreConversation(selected)}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-40">
                                        <RotateCcw className="h-4 w-4" /> Restore conversation
                                    </button>
                                ) : (
                                    <button disabled={busy === selected.id} onClick={() => void removeConversation(selected)}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40">
                                        <Trash2 className="h-4 w-4" /> Remove conversation
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
