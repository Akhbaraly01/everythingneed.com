import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Order {
    id: string;
    reference: string;
    user_name?: string;
    total: number;
    status: string;
    payment_status: string;
    items_count: number;
    created_at: string;
}

export default function AdminOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
        api.get<{ data: Order[] }>(`/api/admin/orders${params}`)
            .then((res) => setOrders(res.data))
            .catch(() => setOrders([]))
            .finally(() => setLoading(false));
    }, [statusFilter]);

    const updateStatus = async (orderId: string, status: string) => {
        try {
            await api.put(`/api/admin/orders/${orderId}/status`, { status });
            setOrders(orders.map((o) => o.id === orderId ? { ...o, status } : o));
        } catch {}
    };

    return (
        <AppLayout title="Manage Orders">
            <Head title="Manage Orders" />

            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Orders</h1>

                <div className="flex flex-wrap gap-2">
                    {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
                        <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${
                            statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700'
                        }`}>{s}</button>
                    ))}
                </div>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading...</p></div>
                ) : orders.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No orders</h3>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3">Reference</th>
                                    <th className="px-4 py-3">Customer</th>
                                    <th className="px-4 py-3">Items</th>
                                    <th className="px-4 py-3">Total</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Payment</th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {orders.map((o) => (
                                    <tr key={o.id}>
                                        <td className="px-4 py-3 font-mono text-xs">{o.reference}</td>
                                        <td className="px-4 py-3 text-sm">{o.user_name}</td>
                                        <td className="px-4 py-3 text-sm">{o.items_count}</td>
                                        <td className="px-4 py-3 font-semibold">{formatCurrency(o.total)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                                                o.status === 'delivered' ? 'bg-green-100 text-green-800' : o.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                            }`}>{o.status}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs font-medium ${
                                                o.payment_status === 'paid' ? 'text-green-600' : o.payment_status === 'refunded' ? 'text-orange-600' : 'text-gray-500'
                                            }`}>{o.payment_status}</span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(o.created_at)}</td>
                                        <td className="px-4 py-3">
                                            <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)}
                                                className="rounded border px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700">
                                                <option value="pending">Pending</option>
                                                <option value="processing">Processing</option>
                                                <option value="shipped">Shipped</option>
                                                <option value="delivered">Delivered</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
