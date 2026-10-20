import { statusTone } from '@/lib/lifecycle';
import AdminLayout from '@/layouts/AdminLayout';
import { Head, usePage } from '@inertiajs/react';
import { api, errorMessage, rows } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import DataTable from '@/components/shared/DataTable';
import { useConfirm } from '@/lib/confirm';
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
    const ask = useConfirm();
    const roles = (usePage().props.auth as { roles?: string[] } | null)?.roles ?? [];
    const canManage = roles.some((r) => ['super_admin', 'administrator', 'building_admin'].includes(r));
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<string | null>(null);
    const [status, setStatus] = useState('all');
    const [page, setPage] = useState(1);

    useEffect(() => {
        setLoading(true);
        api.get<{ data: Booking[]; meta: Meta }>(`/api/admin/building/bookings?page=${page}&status=${status}`)
            .then((res) => { setBookings(rows<Booking>(res)); setMeta(res.meta); })
            .catch((e) => { setBookings([]); toast.error(errorMessage(e, 'Failed to load bookings')); })
            .finally(() => setLoading(false));
    }, [status, page]);

    const transition = async (b: Booking, next: 'confirmed' | 'in_progress' | 'completed' | 'cancelled') => {
        if (next === 'completed' || next === 'cancelled') {
            const ok = await ask({
                title: next === 'cancelled' ? 'Cancel this booking?' : 'Mark this booking completed?',
                description: next === 'cancelled'
                    ? `The ${b.worker_type} booking for ${b.requester_name ?? 'this customer'} is closed and cannot be reopened.`
                    : 'Completion is terminal in the admin console.',
                confirmLabel: next === 'cancelled' ? 'Cancel booking' : 'Mark completed',
                danger: next === 'cancelled',
            });
            if (!ok) return;
        }

        setBusy(b.id);
        try {
            await api.post(`/api/building-services/bookings/${b.id}/transition`, { status: next });
            setBookings((prev) => prev.map((x) => x.id === b.id ? { ...x, status: next } : x));
            toast.success(`Booking ${next.replace('_', ' ')}.`);
        } catch (e) {
            toast.error(errorMessage(e, 'Status update failed'));
        } finally {
            setBusy(null);
        }
    };

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
                        {
                            key: 'actions', header: 'Actions',
                            render: (b) => {
                                if (!canManage) {
                                    return <span className="text-xs text-gray-400">View only</span>;
                                }
                                if (b.status === 'completed' || b.status === 'cancelled' || b.status === 'rejected') {
                                    return <span className="text-xs text-gray-400">Closed</span>;
                                }
                                return (
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {b.status === 'pending' && (
                                            <button disabled={busy === b.id} onClick={() => void transition(b, 'confirmed')}
                                                className="rounded-lg bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-40">
                                                Confirm
                                            </button>
                                        )}
                                        {b.status === 'confirmed' && (
                                            <button disabled={busy === b.id} onClick={() => void transition(b, 'in_progress')}
                                                className="rounded-lg bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40">
                                                Start
                                            </button>
                                        )}
                                        {b.status === 'in_progress' && (
                                            <button disabled={busy === b.id} onClick={() => void transition(b, 'completed')}
                                                className="rounded-lg bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-40">
                                                Complete
                                            </button>
                                        )}
                                        <button disabled={busy === b.id} onClick={() => void transition(b, 'cancelled')}
                                            className="rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 dark:border-red-900 dark:hover:bg-red-950/30">
                                            Cancel
                                        </button>
                                    </div>
                                );
                            },
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
