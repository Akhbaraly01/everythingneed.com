import { statusTone } from '@/lib/lifecycle';
import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { formatPrice } from '@/lib/currency';
import { CheckCircle, Package, Truck, MapPin, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ConfirmationOrder {
    id: string;
    reference: string;
    status: string;
    total: number;
    delivery_address?: string;
    created_at: string;
    items: Array<{ name: string; quantity: number; unit_price: number }>;
}

export default function PharmacyOrderConfirmation() {
    const [order, setOrder] = useState<ConfirmationOrder | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const match = window.location.pathname.match(/\/pharmacy\/orders\/([^/]+)/);
        const id = match?.[1];
        if (!id) {
            setLoading(false);
            return;
        }
        api.get<{ data: Record<string, unknown> }>(`/api/pharmacy/orders/${id}`)
            .then((res) => {
                const o = res.data ?? {};
                const items = Array.isArray(o.items) ? (o.items as Array<Record<string, unknown>>) : [];
                setOrder({
                    id: String(o.id ?? ''),
                    reference: String(o.order_number ?? o.id ?? ''),
                    status: String(o.status ?? 'pending'),
                    total: Number(o.total_amount ?? 0),
                    delivery_address:
                        o.delivery_address != null
                            ? String(o.delivery_address)
                            : o.shipping_address != null
                              ? String(o.shipping_address)
                              : undefined,
                    created_at: String(o.created_at ?? ''),
                    items: items.map((it) => ({
                        name: String(it.name ?? 'Medicine'),
                        quantity: Number(it.quantity ?? 1),
                        unit_price: Number(it.unit_price ?? it.price ?? 0),
                    })),
                });
            })
            .catch(() => setOrder(null))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AppLayout title="Order Confirmation">
            <Head title="Order Confirmed" />
            <div className="mx-auto max-w-2xl space-y-6">
                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">Loading order details…</p>
                    </div>
                ) : !order ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Package className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">Order not found</p>
                        <Link
                            href="/pharmacy"
                            className="mt-4 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                        >
                            Go to Pharmacy
                        </Link>
                    </div>
                ) : (
                    <div className="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>

                        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Order Placed Successfully!</h1>
                        <p className="mb-6 text-gray-500">Your order has been received and is being processed.</p>

                        <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                            <p className="text-sm text-gray-500">Order Number</p>
                            <p className="text-xl font-bold text-indigo-600">{order.reference}</p>
                            <p className="mt-1 text-xs text-gray-400">{formatDateTime(order.created_at)}</p>
                        </div>

                        <div className="space-y-3 text-left">
                            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                <span className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                                    <Package className="h-5 w-5 text-gray-400" /> Status
                                </span>
                                <span
                                    className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                                        statusTone(order.status)
                                    }`}
                                >
                                    {order.status}
                                </span>
                            </div>

                            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                <span className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                                    <Truck className="h-5 w-5 text-gray-400" /> Estimated Delivery
                                </span>
                                <span className="text-sm text-gray-500">2-3 business days</span>
                            </div>

                            {order.delivery_address && (
                                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                    <span className="mb-1 flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                                        <MapPin className="h-5 w-5 text-gray-400" /> Delivery Address
                                    </span>
                                    <p className="pl-7 text-sm text-gray-500">{order.delivery_address}</p>
                                </div>
                            )}

                            {order.items.length > 0 && (
                                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                    <p className="mb-2 font-medium text-gray-900 dark:text-white">Items</p>
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm py-1">
                                            <span>
                                                {item.quantity}x {item.name}
                                            </span>
                                            <span>{formatPrice(item.unit_price * item.quantity)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                <span className="font-medium text-gray-900 dark:text-white">Total Amount</span>
                                <span className="text-xl font-bold text-indigo-600">{formatPrice(order.total)}</span>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Link
                                href="/pharmacy"
                                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                            >
                                <ArrowLeft className="h-4 w-4" /> Continue Shopping
                            </Link>
                            <Link
                                href="/orders"
                                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                            >
                                View My Orders
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
