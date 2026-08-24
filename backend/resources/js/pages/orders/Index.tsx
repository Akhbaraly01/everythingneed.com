import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import type { MedicineOrder } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Package, Eye, XCircle } from 'lucide-react';

interface OrdersProps {
    orders: {
        data: MedicineOrder[];
        meta: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        };
    };
}

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-indigo-100 text-indigo-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
};

export default function Orders({ orders }: OrdersProps) {
    return (
        <AppLayout title="My Orders">
            <Head title="Orders" />

            <div className="space-y-6">
                {orders.data.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Package className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No orders yet</h3>
                        <p className="mt-2 text-gray-500">Start shopping to see your orders here.</p>
                        <Link
                            href="/products"
                            className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                        >
                            Browse Products
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.data.map((order) => (
                            <div key={order.id} className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Order #{order.order_number}
                                        </h3>
                                        <p className="text-sm text-gray-500">{formatDateTime(order.created_at)}</p>
                                    </div>
                                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[order.status] ?? 'bg-gray-100 text-gray-800'}`}>
                                        {order.status}
                                    </span>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {order.items?.length ?? 0} items
                                        </p>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                                            {formatCurrency(order.total_amount)}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/orders/${order.id}`}
                                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                                        >
                                            <Eye className="h-4 w-4" />
                                            View
                                        </Link>
                                        {['pending', 'confirmed'].includes(order.status) && (
                                            <Link
                                                href={`/orders/${order.id}/cancel`}
                                                method="post"
                                                className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                                            >
                                                <XCircle className="h-4 w-4" />
                                                Cancel
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
