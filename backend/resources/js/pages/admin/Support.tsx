import { statusTone } from '@/lib/lifecycle';
import AdminLayout from '@/layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import DataTable from '@/components/shared/DataTable';
import { Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

/**
 * Unified support desk over the LIVE tickets queue (tickets + departments),
 * the same data the dashboard counts. Legacy support_tickets is retired.
 */
interface DeskTicket {
    id: string;
    ticket_number: string;
    subject: string;
    status: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    user_name?: string | null;
    assigned_to_name?: string | null;
    department_name?: string | null;
    created_at: string;
}

const STATUSES = ['all', 'open', 'in_progress', 'pending', 'resolved', 'closed'] as const;
type StatusFilter = (typeof STATUSES)[number];

const priorityTone: Record<string, string> = {
    urgent: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-gray-100 text-gray-800',
    low: 'bg-gray-100 text-gray-600',
};

export default function AdminSupport() {
    const [tickets, setTickets] = useState<DeskTicket[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<StatusFilter>('all');
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');

    const fetchTickets = useCallback(() => {
        setLoading(true);
        const params: Record<string, string> = {};
        if (status !== 'all') params.status = status;
        if (query) params.search = query;
        api.get<{ data: DeskTicket[]; total?: number }>('/api/admin/support/tickets', { params })
            .then((res) => {
                setTickets(Array.isArray(res.data) ? res.data : []);
                setTotal(Number(res.total ?? res.data?.length ?? 0));
            })
            .catch((e) => {
                setTickets([]);
                toast.error(errorMessage(e, 'Failed to load tickets'));
            })
            .finally(() => setLoading(false));
    }, [status, query]);

    useEffect(() => { fetchTickets(); }, [fetchTickets]);

    const changeStatus = async (t: DeskTicket, next: DeskTicket['status']) => {
        try {
            await api.patch(`/api/tickets/${t.id}/status`, { status: next });
            setTickets(tickets.map((x) => (x.id === t.id ? { ...x, status: next } : x)));
            toast.success(`${t.ticket_number} → ${next}`);
        } catch (e) {
            toast.error(errorMessage(e, 'Status change failed'));
        }
    };

    const onSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setQuery(search.trim());
    };

    return (
        <AdminLayout title="Support Desk">
            <Head title="Support Desk" />

            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Support Desk</h1>
                    <p className="text-sm text-gray-500" aria-live="polite">{total} ticket{total === 1 ? '' : 's'}</p>
                </div>

                <form onSubmit={onSearch} className="flex gap-2" role="search">
                    <label htmlFor="ticket-search" className="sr-only">Search tickets</label>
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                        <input
                            id="ticket-search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by number, subject, or requester…"
                            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                    </div>
                    <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
                        Search
                    </button>
                </form>

                <div className="flex flex-wrap gap-2" role="group" aria-label="Filter tickets by status">
                    {STATUSES.map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatus(s)}
                            aria-pressed={status === s}
                            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                                status === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                            }`}
                        >
                            {s === 'all' ? 'all' : s.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                <DataTable
                    columns={[
                        {
                            key: 'ticket', header: 'Ticket', accessor: 'ticket_number', sortable: true,
                            render: (t) => (
                                <>
                                    <p className="font-mono text-xs text-gray-500">{t.ticket_number}</p>
                                    <Link
                                        href={`/admin/support/${t.id}`}
                                        className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                                    >
                                        {t.subject}
                                    </Link>
                                </>
                            ),
                        },
                        {
                            key: 'requester', header: 'Requester', accessor: 'user_name', sortable: true,
                            render: (t) => <span className="text-sm text-gray-600 dark:text-gray-300">{t.user_name ?? '—'}</span>,
                        },
                        {
                            key: 'department', header: 'Department', accessor: 'department_name', sortable: true,
                            render: (t) => <span className="text-sm text-gray-600 dark:text-gray-300">{t.department_name ?? '—'}</span>,
                        },
                        {
                            key: 'assigned', header: 'Assigned',
                            render: (t) => <span className="text-sm text-gray-600 dark:text-gray-300">{t.assigned_to_name ?? 'Unassigned'}</span>,
                        },
                        {
                            key: 'priority', header: 'Priority', accessor: 'priority', sortable: true,
                            render: (t) => (
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityTone[t.priority] ?? ''}`}>
                                    {t.priority}
                                </span>
                            ),
                        },
                        {
                            key: 'created', header: 'Created', accessor: 'created_at', sortable: true,
                            render: (t) => <span className="text-xs text-gray-500">{formatDateTime(t.created_at)}</span>,
                        },
                        {
                            key: 'status', header: 'Status', accessor: 'status', sortable: true,
                            render: (t) => (
                                <>
                                    <label className="sr-only" htmlFor={`status-${t.id}`}>Status for {t.ticket_number}</label>
                                    <select
                                        id={`status-${t.id}`}
                                        value={t.status}
                                        onChange={(e) => changeStatus(t, e.target.value as DeskTicket['status'])}
                                        className={`rounded-full border-0 px-2 py-0.5 text-xs font-medium ${statusTone(t.status)}`}
                                    >
                                        {(['open', 'in_progress', 'pending', 'resolved', 'closed'] as const).map((s) => (
                                            <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                        ))}
                                    </select>
                                </>
                            ),
                        },
                    ]}
                    data={tickets}
                    loading={loading}
                    emptyTitle="No tickets"
                    emptyDescription={status === 'all' && !query ? 'No tickets in the live queue.' : 'No tickets match this filter.'}
                />
            </div>
        </AdminLayout>
    );
}
