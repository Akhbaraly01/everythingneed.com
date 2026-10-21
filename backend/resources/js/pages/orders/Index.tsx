import { statusTone } from '@/lib/lifecycle';
import { EmptyState } from '@/components/shared/Ui';
import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api';
import type { MedicineOrder } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { formatPrice } from '@/lib/currency';
import { Package, Eye, XCircle } from 'lucide-react';
import Pagination from '@/components/shared/Pagination';

interface OrdersProps {
    orders: {
        data: MedicineOrder[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export default function Orders({ orders }: OrdersProps) {
    const list = orders?.data ?? [];
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    const cancelOrder = async (orderId: string) => {
        setCancellingId(orderId);
        try {
            await api.post(`/api/product-orders/${orderId}/cancel`, {});
            toast.success('Order cancelled');
            router.reload({ only: ['orders'] });
        } catch (e) {
            toast.error(errorMessage(e, 'Could not cancel this order'));
        } finally {
            setCancellingId(null);
        }
    };

    return (
        <AppLayout title="My Orders">
            <Head title="Orders" />

            <div className="space-y-6">
                {list.length === 0 ? (
                    <EmptyState
                        icon={<Package className="h-10 w-10 text-gray-300" />}
                        title="No orders yet"
                        description="Start shopping to see your orders here."
                        action={
                            <Link href="/products" className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                                Browse Products
                            </Link>
                        }
                    />
                ) : (
                    <div className="space-y-4">
                        {list.map((order) => (
                            <div key={order.id} className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Order #{order.order_number}
                                        </h3>
                                        <p className="text-sm text-gray-500">{formatDateTime(order.created_at)}</p>
                                    </div>
                                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusTone(order.status)}`}>
                                        {order.status}
                                    </span>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {order.items?.length ?? 0} items
                                        </p>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                                            {formatPrice(order.total_amount)}
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
                                        {['pending', 'paid'].includes(order.status) && (
                                            <button
                                                type="button"
                                                disabled={cancellingId === order.id}
                                                onClick={() => cancelOrder(order.id)}
                                                className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                <XCircle className="h-4 w-4" />
                                                {cancellingId === order.id ? 'Cancelling…' : 'Cancel'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <Pagination
                    currentPage={orders?.current_page ?? 1}
                    lastPage={orders?.last_page ?? 1}
                    hrefFor={(page) => `/orders?page=${page}`}
                />
            </div>
        </AppLayout>
    );
}
