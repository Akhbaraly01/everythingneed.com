import { statusTone } from '@/lib/lifecycle';
import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { api, errorMessage, rows } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import DataTable from '@/components/shared/DataTable';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

/** Real admin subscription row (AdminDomainController::subscriptions). */
interface Subscription {
    id: string;
    status: 'active' | 'cancelled' | 'expired' | 'paused';
    starts_at?: string | null;
    ends_at?: string | null;
    cancelled_at?: string | null;
    created_at: string;
    user_name?: string | null;
    user_email?: string | null;
    plan_name?: string | null;
    plan_price?: number | string | null;
}

interface Meta {
    page: number;
    per_page: number;
    total: number;
}

export default function AdminSubscriptions() {
    const [subs, setSubs] = useState<Subscription[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('all');
    const [page, setPage] = useState(1);

    useEffect(() => {
        setLoading(true);
        api.get<{ data: Subscription[]; meta: Meta }>(`/api/admin/subscriptions?page=${page}&status=${status}`)
            .then((res) => { setSubs(rows<Subscription>(res)); setMeta(res.meta); })
            .catch((e) => { setSubs([]); toast.error(errorMessage(e, 'Failed to load subscriptions')); })
            .finally(() => setLoading(false));
    }, [status, page]);

    return (
        <AdminLayout title="Subscriptions">
            <Head title="Subscriptions" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscriptions</h1>
                    {meta && <span className="text-sm text-gray-500">{meta.total} subscriptions</span>}
                </div>

                <div className="flex flex-wrap gap-2">
                    {['all', 'active', 'cancelled', 'expired', 'paused'].map((s) => (
                        <button key={s} onClick={() => { setStatus(s); setPage(1); }}
                            className={`rounded-full px-3 py-1 text-sm font-medium ${status === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}>
                            {s}
                        </button>
                    ))}
                </div>

                <DataTable
                    columns={[
                        {
                            key: 'subscriber', header: 'Subscriber', accessor: 'user_name', sortable: true,
                            render: (s) => (
                                <>
                                    <p className="font-medium text-gray-900 dark:text-white">{s.user_name}</p>
                                    <p className="text-xs text-gray-500">{s.user_email}</p>
                                </>
                            ),
                        },
                        {
                            key: 'plan', header: 'Plan', accessor: 'plan_name', sortable: true,
                            render: (s) => (
                                <>
                                    <p className="font-medium text-gray-900 dark:text-white">{s.plan_name ?? '—'}</p>
                                    {s.plan_price != null && <p className="text-xs text-gray-500">${s.plan_price}</p>}
                                </>
                            ),
                        },
                        {
                            key: 'status', header: 'Status', accessor: 'status', sortable: true,
                            render: (s) => (
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusTone(s.status)}`}>{s.status}</span>
                            ),
                        },
                        {
                            key: 'starts', header: 'Starts', accessor: 'starts_at', sortable: true,
                            render: (s) => <span className="text-xs text-gray-500">{s.starts_at ? formatDateTime(s.starts_at) : '—'}</span>,
                        },
                        {
                            key: 'ends', header: 'Ends', accessor: 'ends_at', sortable: true,
                            render: (s) => <span className="text-xs text-gray-500">{s.ends_at ? formatDateTime(s.ends_at) : '—'}</span>,
                        },
                        {
                            key: 'cancelled', header: 'Cancelled',
                            render: (s) => <span className="text-xs text-gray-500">{s.cancelled_at ? formatDateTime(s.cancelled_at) : '—'}</span>,
                        },
                    ]}
                    data={subs}
                    loading={loading}
                    emptyTitle="No subscriptions found"
                />

                {meta && meta.total > meta.per_page && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Page {meta.page} · {meta.total} subscriptions</span>
                        <div className="flex gap-2">
                            <button disabled={meta.page <= 1} onClick={() => setPage(page - 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Previous</button>
                            <button disabled={meta.page * meta.per_page >= meta.total} onClick={() => setPage(page + 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Next</button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
