import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { api, ApiError } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { ShoppingCart, Truck, PackageCheck, ChevronLeft, ChevronRight } from 'lucide-react';

interface VendorOrderRow {
    id: string;
    order_number: string;
    product_name: string;
    quantity: number;
    total_price: number | string;
    status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
    shipping_address?: string;
    created_at: string;
    customer?: { name: string } | null;
}

interface Props {
    orders: { data: VendorOrderRow[]; current_page: number; last_page: number; total: number };
}

const statusStyles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    confirmed: 'bg-blue-100 text-blue-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-700',
};

export default function VendorOrders({ orders }: Props) {
    const [busyId, setBusyId] = useState<string | null>(null);

    const transition = async (order: VendorOrderRow, action: 'accept' | 'ship' | 'deliver', label: string) => {
        setBusyId(order.id);
        try {
            await api.post(`/api/vendor/orders/${order.id}/${action}`);
            toast.success(label);
            router.reload({ only: ['orders'] });
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Action failed');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <AppLayout title="Vendor orders">
            <Head title="Incoming orders" />
            <div className="mx-auto max-w-5xl px-4 py-8">
                <div className="mb-6 flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100"><ShoppingCart className="h-6 w-6 text-blue-600" /></span>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
                        <p className="text-sm text-gray-500">{orders.total} orders received</p>
                    </div>
                </div>

                {orders.data.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 p-16 text-center dark:border-gray-600">
                        <ShoppingCart className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                        <p className="font-medium text-gray-900 dark:text-white">No orders yet</p>
                        <p className="text-sm text-gray-500">When customers buy your products they'll appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {orders.data.map((o) => (
                            <div key={o.id} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{o.product_name} × {o.quantity}</p>
                                        <p className="mt-0.5 text-xs text-gray-500">
                                            {o.order_number} · {o.customer?.name ?? 'Guest'} · {formatDate(o.created_at)}
                                        </p>
                                        {o.shipping_address && <p className="mt-1 text-xs text-gray-400">📍 {o.shipping_address}</p>}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[o.status]}`}>{o.status}</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(Number(o.total_price))}</span>
                                    </div>
                                </div>

                                {/* Lifecycle actions */}
                                <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3 dark:border-gray-700">
                                    {o.status === 'pending' && (
                                        <button
                                            disabled={busyId === o.id}
                                            onClick={() => transition(o, 'accept', 'Order confirmed')}
                                            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                                        >
                                            <PackageCheck className="h-3.5 w-3.5" /> Accept order
                                        </button>
                                    )}
                                    {o.status === 'confirmed' && (
                                        <button
                                            disabled={busyId === o.id}
                                            onClick={() => transition(o, 'ship', 'Marked as shipped')}
                                            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                                        >
                                            <Truck className="h-3.5 w-3.5" /> Mark shipped
                                        </button>
                                    )}
                                    {o.status === 'shipped' && (
                                        <button
                                            disabled={busyId === o.id}
                                            onClick={() => transition(o, 'deliver', 'Marked as delivered')}
                                            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                                        >
                                            <PackageCheck className="h-3.5 w-3.5" /> Mark delivered
                                        </button>
                                    )}
                                    {(o.status === 'delivered' || o.status === 'cancelled') && (
                                        <span className="text-xs text-gray-400">Nothing to do — order {o.status}.</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {orders.last_page > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-3">
                        {orders.current_page > 1 && (
                            <Link href={`/vendor/orders?page=${orders.current_page - 1}`} preserveState className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white">
                                <ChevronLeft className="h-4 w-4" />
                            </Link>
                        )}
                        <span className="text-sm text-gray-600 dark:text-gray-300">Page {orders.current_page} of {orders.last_page}</span>
                        {orders.current_page < orders.last_page && (
                            <Link href={`/vendor/orders?page=${orders.current_page + 1}`} preserveState className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white">
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
