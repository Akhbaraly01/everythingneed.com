import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import Breadcrumb from '@/components/shared/Breadcrumb';
import { StatusBadge } from '@/components/shared/Ui';
import { Paperclip, Send, ShieldAlert } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuthPermissions } from '@/lib/permissions';

interface TicketMessage {
    id: string;
    sender_id: string;
    message: string;
    is_internal: boolean;
    attachments?: string[] | null;
    created_at: string;
    sender?: { id: string; name: string } | null;
}

interface TicketRow {
    id: string;
    ticket_number: string;
    subject: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
    assigned_to?: string | null;
    escalated_at?: string | null;
    satisfaction_rating?: number | null;
    satisfaction_comment?: string | null;
    attachments?: string[] | null;
    user?: { id: string; name: string; email?: string | null } | null;
    department?: { id: string; name: string } | null;
    messages?: TicketMessage[];
    created_at: string;
}

interface TicketEventRow {
    id: string;
    event_type: string;
    actor_id?: string | null;
    payload?: Record<string, string> | null;
    created_at: string;
}

interface UserLite {
    id: string;
    name: string;
    email?: string | null;
}

interface DepartmentLite {
    id: string;
    name: string;
}

const STATUSES = ['open', 'in_progress', 'pending', 'resolved', 'closed'] as const;

const priorityTone: Record<string, string> = {
    urgent: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-gray-100 text-gray-800',
    low: 'bg-gray-100 text-gray-600',
};

const href = (path: string): string => `/storage/${path.replace(/^\//, '')}`;

export default function AdminSupportDetail({ ticket_id }: { ticket_id: string }) {
    const { can } = useAuthPermissions();
    const canManage = can('support.tickets.manage');
    const canAssign = can('support.tickets.assign');
    const canEscalate = can('support.tickets.escalate');
    const [ticket, setTicket] = useState<TicketRow | null>(null);
    const [events, setEvents] = useState<TicketEventRow[]>([]);
    const [agents, setAgents] = useState<UserLite[]>([]);
    const [departments, setDepartments] = useState<DepartmentLite[]>([]);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState('');
    const [internal, setInternal] = useState(false);
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        api.get<{ data: { ticket: TicketRow; events: TicketEventRow[] } }>(
            `/api/admin/support/tickets/${ticket_id}`,
        )
            .then((res) => {
                setTicket(res.data?.ticket ?? null);
                setEvents(Array.isArray(res.data?.events) ? res.data.events : []);
            })
            .catch((e) => {
                setTicket(null);
                toast.error(errorMessage(e, 'Failed to load ticket'));
            })
            .finally(() => setLoading(false));
    }, [ticket_id]);

    useEffect(() => {
        load();
        api.get<{ data: UserLite[] }>('/api/admin/support/agents')
            .then((res) => setAgents(Array.isArray(res.data) ? res.data : []))
            .catch(() => setAgents([]));
        api.get<{ data: DepartmentLite[] }>('/api/admin/departments')
            .then((res) => setDepartments(Array.isArray(res.data) ? res.data : []))
            .catch(() => setDepartments([]));
    }, [load]);

    const run = async (action: () => Promise<unknown>, success: string, after?: () => void) => {
        setBusy(true);
        try {
            await action();
            toast.success(success);
            after?.();
            load();
        } catch (e) {
            toast.error(errorMessage(e, 'Action failed'));
        } finally {
            setBusy(false);
        }
    };

    const sendReply = () => {
        const message = reply.trim();
        if (!message) return;
        void run(
            () => api.post(`/api/tickets/${ticket_id}/reply`, { message, is_internal: internal }),
            internal ? 'Internal note added' : 'Reply sent',
            () => {
                setReply('');
                setInternal(false);
            },
        );
    };

    if (loading) {
        return (
            <AdminLayout title="Ticket">
                <Head title="Ticket" />
                <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800" aria-busy="true">
                    <p className="text-gray-500">Loading ticket…</p>
                </div>
            </AdminLayout>
        );
    }

    if (!ticket) {
        return (
            <AdminLayout title="Ticket not found">
                <Head title="Ticket not found" />
                <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                    <p className="text-gray-500">This ticket does not exist or you cannot view it.</p>
                    <Link href="/admin/support" className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline">
                        Back to support desk
                    </Link>
                </div>
            </AdminLayout>
        );
    }

    const messages = Array.isArray(ticket.messages) ? ticket.messages : [];

    return (
        <AdminLayout title={`${ticket.ticket_number} · Support`}>
            <Head title={`${ticket.ticket_number} · Support`} />

            <div className="space-y-6">
                <Breadcrumb
                    items={[
                        { label: 'Admin', href: '/admin/dashboard' },
                        { label: 'Support', href: '/admin/support' },
                        { label: ticket.ticket_number },
                    ]}
                />

                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="font-mono text-xs text-gray-500">{ticket.ticket_number}</p>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{ticket.subject}</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            {ticket.user?.name ?? 'Unknown requester'}
                            {ticket.user?.email ? ` · ${ticket.user.email}` : ''}
                            {' · '}
                            {formatDateTime(ticket.created_at)}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={ticket.status} />
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityTone[ticket.priority] ?? ''}`}>
                            {ticket.priority}
                        </span>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                        <label htmlFor="status-select" className="block text-xs font-medium uppercase text-gray-500">Status</label>
                        {canManage ? (
                            <select
                                id="status-select"
                                value={ticket.status}
                                disabled={busy}
                                onChange={(e) =>
                                    void run(
                                        () => api.patch(`/api/tickets/${ticket_id}/status`, { status: e.target.value }),
                                        'Status updated',
                                    )
                                }
                                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                            >
                                {STATUSES.map((s) => (
                                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                ))}
                            </select>
                        ) : (
                            <p className="mt-2 text-sm capitalize text-gray-700 dark:text-gray-300">{ticket.status.replace('_', ' ')}</p>
                        )}
                    </div>

                    {canAssign && (
                        <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                        <label htmlFor="assignee-select" className="block text-xs font-medium uppercase text-gray-500">Assignee</label>
                        <select
                            id="assignee-select"
                            value={ticket.assigned_to ?? ''}
                            disabled={busy}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (!value) return;
                                void run(
                                    () => api.patch(`/api/admin/support/tickets/${ticket_id}/assign`, { assigned_to: value }),
                                    'Ticket assigned',
                                );
                            }}
                            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                        >
                            <option value="">Unassigned</option>
                            {agents.map((a) => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                    </div>
                    )}

                    {canManage && (
                        <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                        <label htmlFor="department-select" className="block text-xs font-medium uppercase text-gray-500">Department</label>
                        <select
                            id="department-select"
                            value={ticket.department?.id ?? ''}
                            disabled={busy}
                            onChange={(e) => {
                                const value = e.target.value;
                                void run(
                                    () => api.post(`/api/tickets/${ticket_id}/assign-department`, { department_id: value || null }),
                                    'Department updated',
                                );
                            }}
                            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                        >
                            <option value="">Unassigned</option>
                            {departments.map((d) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                    )}
                </div>

                {(ticket.satisfaction_rating != null || ticket.escalated_at) && (
                    <div className="flex flex-wrap gap-4 rounded-lg bg-white p-4 text-sm shadow dark:bg-gray-800">
                        {ticket.escalated_at && (
                            <p className="flex items-center gap-2 text-red-700 dark:text-red-400">
                                <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                                Escalated {formatDateTime(ticket.escalated_at)}
                            </p>
                        )}
                        {ticket.satisfaction_rating != null && (
                            <p className="text-gray-700 dark:text-gray-300">
                                Satisfaction: {ticket.satisfaction_rating}/5
                                {ticket.satisfaction_comment ? ` — “${ticket.satisfaction_comment}”` : ''}
                            </p>
                        )}
                    </div>
                )}

                <div className="rounded-lg bg-white shadow dark:bg-gray-800">
                    <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Conversation</h2>
                    </div>
                    <div className="max-h-[28rem] space-y-4 overflow-y-auto p-4">
                        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
                            <p className="text-xs font-medium uppercase text-gray-500">
                                {ticket.user?.name ?? 'Requester'} · {formatDateTime(ticket.created_at)}
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">{ticket.description}</p>
                            {(ticket.attachments ?? []).map((path) => (
                                <a
                                    key={path}
                                    href={href(path)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-2 flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
                                >
                                    <Paperclip className="h-3 w-3" aria-hidden="true" />
                                    {path.split('/').pop()}
                                </a>
                            ))}
                        </div>

                        {messages.map((m) => (
                            <div
                                key={m.id}
                                className={`rounded-lg p-3 ${m.is_internal ? 'border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950' : 'bg-gray-50 dark:bg-gray-900'}`}
                            >
                                <p className="text-xs font-medium uppercase text-gray-500">
                                    {m.sender?.name ?? 'Unknown'} · {formatDateTime(m.created_at)}
                                    {m.is_internal ? ' · internal note' : ''}
                                </p>
                                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">{m.message}</p>
                                {(m.attachments ?? []).map((path) => (
                                    <a
                                        key={path}
                                        href={href(path)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-2 flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
                                    >
                                        <Paperclip className="h-3 w-3" aria-hidden="true" />
                                        {path.split('/').pop()}
                                    </a>
                                ))}
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-gray-200 p-4 dark:border-gray-700">
                        <label htmlFor="reply-box" className="sr-only">Reply</label>
                        <textarea
                            id="reply-box"
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            rows={3}
                            placeholder="Write a reply to the requester…"
                            className="w-full rounded-lg border border-gray-300 p-3 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                        />
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                <input
                                    type="checkbox"
                                    checked={internal}
                                    onChange={(e) => setInternal(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                File as internal note
                            </label>
                            <div className="flex gap-2">
                                {canEscalate && (
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() =>
                                            void run(
                                                () => api.post(`/api/tickets/${ticket_id}/escalate`, { reason: 'Escalated from ticket detail' }),
                                                'Ticket escalated',
                                            )
                                        }
                                        className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                                    >
                                        Escalate
                                    </button>
                                )}
                                <button
                                    type="button"
                                    disabled={busy || !reply.trim()}
                                    onClick={sendReply}
                                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                                >
                                    <Send className="h-4 w-4" aria-hidden="true" />
                                    Send
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg bg-white shadow dark:bg-gray-800">
                    <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Audit trail</h2>
                    </div>
                    {events.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-gray-500">No recorded events yet.</p>
                    ) : (
                        <ul className="divide-y divide-gray-100 px-4 py-2 dark:divide-gray-700">
                            {events.map((ev) => (
                                <li key={ev.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                                    <span className="text-gray-800 dark:text-gray-200">{ev.event_type.replace(/_/g, ' ')}</span>
                                    <span className="text-xs text-gray-500">{formatDateTime(ev.created_at)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
