import { statusTone } from '@/lib/lifecycle';
import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { api, errorMessage, rows } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import DataTable from '@/components/shared/DataTable';
import { MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

/** Real admin booking row (AdminDomainController::buildingBookings). */
interface Booking {
    id: string;
    worker_type: string;
    service_category: string;
    description?: string | null;
    address: string;
    scheduled_date: string;
    scheduled_time?: string | null;
    estimated_cost?: number | null;
    status: string;
    created_at: string;
    requester_name?: string | null;
    requester_email?: string | null;
}

interface Meta {
    page: number;
    per_page: number;
    total: number;
}

const STATUSES = ['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected'];

export default function AdminBuilding() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('all');
    const [page, setPage] = useState(1);

    useEffect(() => {
        setLoading(true);
        api.get<{ data: Booking[]; meta: Meta }>(`/api/admin/building/bookings?page=${page}&status=${status}`)
            .then((res) => { setBookings(rows<Booking>(res)); setMeta(res.meta); })
            .catch((e) => { setBookings([]); toast.error(errorMessage(e, 'Failed to load bookings')); })
            .finally(() => setLoading(false));
    }, [status, page]);

    return (
        <AdminLayout title="Building Services">
            <Head title="Building Services" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Building Service Bookings</h1>
                    {meta && <span className="text-sm text-gray-500">{meta.total} bookings</span>}
                </div>

                <div className="flex flex-wrap gap-2">
                    {STATUSES.map((s) => (
                        <button key={s} onClick={() => { setStatus(s); setPage(1); }}
                            className={`rounded-full px-3 py-1 text-sm font-medium ${status === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}>
                            {s.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                <DataTable
                    columns={[
                        {
                            key: 'service', header: 'Service', accessor: 'worker_type', sortable: true,
                            render: (b) => (
                                <>
                                    <p className="font-medium text-gray-900 dark:text-white">{b.worker_type}</p>
                                    <p className="text-xs text-gray-500">{b.service_category}</p>
                                </>
                            ),
                        },
                        {
                            key: 'requester', header: 'Requester', accessor: 'requester_name', sortable: true,
                            render: (b) => (
                                <>
                                    <p className="font-medium text-gray-900 dark:text-white">{b.requester_name}</p>
                                    <p className="text-xs text-gray-500">{b.requester_email}</p>
                                </>
                            ),
                        },
                        {
                            key: 'address', header: 'Address',
                            render: (b) => (
                                <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin className="h-3 w-3 shrink-0" />{b.address}</span>
                            ),
                        },
                        {
                            key: 'scheduled', header: 'Scheduled', accessor: 'scheduled_date', sortable: true,
                            render: (b) => (
                                <span className="text-xs text-gray-500">
                                    {b.scheduled_date}{b.scheduled_time ? ` ${b.scheduled_time}` : ''}
                                </span>
                            ),
                        },
                        {
                            key: 'estimate', header: 'Estimate', accessor: 'estimated_cost', sortable: true,
                            render: (b) => (
                                <span className="font-semibold">{b.estimated_cost != null ? formatCurrency(Number(b.estimated_cost)) : '—'}</span>
                            ),
                        },
                        {
                            key: 'status', header: 'Status', accessor: 'status', sortable: true,
                            render: (b) => (
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusTone(b.status)}`}>
                                    {b.status.replace('_', ' ')}
                                </span>
                            ),
                        },
                        {
                            key: 'requested', header: 'Requested', accessor: 'created_at', sortable: true,
                            render: (b) => <span className="text-xs text-gray-500">{formatDateTime(b.created_at)}</span>,
                        },
                    ]}
                    data={bookings}
                    loading={loading}
                    emptyTitle="No bookings found"
                />

                {meta && meta.total > meta.per_page && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Page {meta.page} · {meta.total} bookings</span>
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
