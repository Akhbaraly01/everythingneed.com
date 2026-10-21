import AdminLayout from '@/layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import DataTable from '@/components/shared/DataTable';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ORDER_STATUSES, settableOptionsFor } from '@/lib/orderStatus';
import { statusTone } from '@/lib/lifecycle';
import { useAuthPermissions } from '@/lib/permissions';

interface Order {
    id: string;
    order_number: string;
    customer_name?: string | null;
    vendor_name?: string | null;
    total_price: number;
    status: string;
    created_at: string;
}

export default function AdminOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const { can } = useAuthPermissions();
    const canUpdate = can('orders.orders.update');

    useEffect(() => {
        setLoading(true);
        const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
        api.get<{ data: Order[] }>(`/api/admin/orders${params}`)
            .then((res) => setOrders(Array.isArray(res.data) ? res.data : []))
            .catch((e) => {
                setOrders([]);
                toast.error(errorMessage(e, 'Failed to load orders'));
            })
            .finally(() => setLoading(false));
    }, [statusFilter]);

    const updateStatus = async (orderId: string, status: string) => {
        const previous = orders;
        setOrders(orders.map((o) => (o.id === orderId ? { ...o, status } : o)));
        try {
            await api.put(`/api/admin/orders/${orderId}/status`, { status });
            toast.success('Order status updated.');
        } catch (e) {
            setOrders(previous);
            toast.error(errorMessage(e, 'Failed to update status'));
        }
    };

    return (
        <AdminLayout title="Manage Orders">
            <Head title="Manage Orders" />

            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Orders</h1>

                <div className="flex flex-wrap gap-2" role="group" aria-label="Filter orders by status">
                    {['all', ...ORDER_STATUSES].map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            aria-pressed={statusFilter === s}
                            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${
                                statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                <DataTable
                    columns={[
                        {
                            key: 'number', header: 'Order #', accessor: 'order_number', sortable: true,
                            render: (o) => (
                                <Link href={`/admin/orders/${o.id}`} className="font-mono text-xs text-indigo-600 hover:underline">
                                    {o.order_number}
                                </Link>
                            ),
                        },
                        {
                            key: 'customer', header: 'Customer', accessor: 'customer_name', sortable: true,
                            render: (o) => <span className="text-sm">{o.customer_name ?? '—'}</span>,
                        },
                        {
                            key: 'vendor', header: 'Vendor', accessor: 'vendor_name', sortable: true,
                            render: (o) => <span className="text-sm">{o.vendor_name ?? '—'}</span>,
                        },
                        {
                            key: 'total', header: 'Total', accessor: 'total_price', sortable: true,
                            render: (o) => <span className="font-semibold">{formatCurrency(Number(o.total_price ?? 0))}</span>,
                        },
                        {
                            key: 'status', header: 'Status', accessor: 'status', sortable: true,
                            render: (o) => (
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusTone(o.status)}`}>
                                    {o.status}
                                </span>
                            ),
                        },
                        {
                            key: 'date', header: 'Date', accessor: 'created_at', sortable: true,
                            render: (o) => <span className="text-xs text-gray-500">{formatDateTime(o.created_at)}</span>,
                        },
                        {
                            key: 'actions', header: 'Actions',
                            render: (o) => {
                                if (!canUpdate) {
                                    return <span className="text-xs text-gray-400">View only</span>;
                                }

                                const options = settableOptionsFor(o.status).filter((s) => s !== o.status);
                                return (
                                    <>
                                        <label className="sr-only" htmlFor={`status-${o.id}`}>Status for order {o.order_number}</label>
                                        <select
                                            id={`status-${o.id}`}
                                            value={o.status}
                                            disabled={options.length === 0}
                                            onChange={(e) => updateStatus(o.id, e.target.value)}
                                            className="rounded border px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        >
                                            {/* Only legal transitions (order state machine); 'paid' is provider-owned. */}
                                            {o.status === 'paid' && <option value="paid">paid (locked)</option>}
                                            {options.length === 0 && o.status !== 'paid' && (
                                                <option value={o.status}>{o.status} (final)</option>
                                            )}
                                            {options.map((s) => (
                                                <option key={s} value={s}>
                                                    {s}
                                                </option>
                                            ))}
                                        </select>
                                    </>
                                );
                            },
                        },
                    ]}
                    data={orders}
                    loading={loading}
                    emptyTitle="No orders"
                    emptyDescription={statusFilter === 'all' ? 'No orders have been placed yet.' : `No orders with status "${statusFilter}".`}
                />
            </div>
        </AdminLayout>
    );
}
