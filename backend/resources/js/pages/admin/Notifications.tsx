import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { api, errorMessage, rows } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import DataTable from '@/components/shared/DataTable';
import { CheckCircle, Circle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

/** Real platform notification row (AdminDomainController::notifications). */
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

export default function AdminNotifications() {
    const [items, setItems] = useState<Notification[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [read, setRead] = useState('all');
    const [page, setPage] = useState(1);

    useEffect(() => {
        setLoading(true);
        api.get<{ data: Notification[]; meta: Meta }>(`/api/admin/notifications?page=${page}&is_read=${read}`)
            .then((res) => { setItems(rows<Notification>(res)); setMeta(res.meta); })
            .catch((e) => { setItems([]); toast.error(errorMessage(e, 'Failed to load notifications')); })
            .finally(() => setLoading(false));
    }, [read, page]);

    return (
        <AdminLayout title="Notifications">
            <Head title="Notifications" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Notifications</h1>
                    {meta && <span className="text-sm text-gray-500">{meta.total} notifications</span>}
                </div>

                <div className="flex flex-wrap gap-2">
                    {['all', 'unread', 'read'].map((r) => (
                        <button key={r} onClick={() => { setRead(r); setPage(1); }}
                            className={`rounded-full px-3 py-1 text-sm font-medium ${read === r ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}>
                            {r}
                        </button>
                    ))}
                </div>

                <DataTable
                    columns={[
                        {
                            key: 'status', header: 'Status',
                            render: (n) => (n.is_read
                                ? <CheckCircle className="h-4 w-4 text-green-600" />
                                : <Circle className="h-4 w-4 text-blue-600" />),
                        },
                        { key: 'title', header: 'Title', accessor: 'title', sortable: true },
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
                    ]}
                    data={items}
                    loading={loading}
                    emptyTitle="No notifications found"
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
        </AdminLayout>
    );
}
