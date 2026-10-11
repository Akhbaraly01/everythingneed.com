import { statusTone } from '@/lib/lifecycle';
import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api';
import type { Order } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { formatPrice } from '@/lib/currency';
import { Package, Truck, CheckCircle, Clock, XCircle, ArrowLeft, Ban, Handshake } from 'lucide-react';
import Image from '@/components/shared/Image';

interface OrderShowProps {
    order: Order;
}

const statusIcons: Record<string, typeof Package> = {
    pending: Clock,
    paid: CheckCircle,
    confirmed: CheckCircle,
    processing: Package,
    shipped: Truck,
    delivered: CheckCircle,
    completed: CheckCircle,
    cancelled: XCircle,
    returned: XCircle,
    refund_requested: Clock,
    refunded: XCircle,
    disputed: Ban,
};

export default function OrderShow({ order }: OrderShowProps) {
    const StatusIcon = statusIcons[order.status] ?? Package;
    const [busy, setBusy] = useState<string | null>(null);

    const cancelOrder = async () => {
        setBusy('cancel');
        try {
            await api.post(`/api/product-orders/${order.id}/cancel`, {});
            toast.success('Order cancelled - stock restored');
            router.reload();
        } catch (e) {
            toast.error(errorMessage(e, 'Could not cancel this order'));
        } finally {
            setBusy(null);
        }
    };

    const completeOrder = async () => {
        setBusy('complete');
        try {
            await api.post(`/api/product-orders/${order.id}/complete`, {});
            toast.success('Order marked as completed');
            router.reload();
        } catch (e) {
            toast.error(errorMessage(e, 'Could not complete this order'));
        } finally {
            setBusy(null);
        }
    };

    return (
        <AppLayout>
            <Head title={`Order #${order.order_number}`} />

            <div className="space-y-8">
                <Link href="/orders" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4" />
                    Back to orders
                </Link>

                {/* Header */}
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order #{order.order_number}</h1>
                            <p className="mt-1 text-sm text-gray-500">Placed on {formatDateTime(order.created_at)}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${statusTone(order.status)}`}>
                            <StatusIcon className="h-4 w-4" />
                            {order.status}
                        </span>
                    </div>
                </div>

                {/* Items */}
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Items</h2>
                    <div className="mt-4 divide-y dark:divide-gray-700">
                        {order.items?.map((item) => (
                            <div key={item.id} className="flex items-center gap-4 py-4">
                                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                    {item.product?.image_url ? (
                                        <Image src={item.product.image_url} alt={item.product_name} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-gray-400">
                                            <Package className="h-6 w-6" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 dark:text-white">{item.product_name}</p>
                                    {item.variant?.name && (
                                        <p className="text-sm text-gray-500">{item.variant.name}</p>
                                    )}
                                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                </div>
                                <p className="font-semibold text-gray-900 dark:text-white">{formatPrice(item.total_price)}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Summary */}
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Order Summary</h2>
                    <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="text-gray-900 dark:text-white">{formatPrice(order.subtotal)}</span>
                        </div>
                        {order.discount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Discount</span>
                                <span className="text-green-600">-{formatPrice(order.discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Shipping</span>
                            <span className="text-gray-900 dark:text-white">{formatPrice(order.shipping_fee)}</span>
                        </div>
                        {Number(order.tax ?? 0) > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Tax</span>
                                <span className="text-gray-900 dark:text-white">{formatPrice(Number(order.tax))}</span>
                            </div>
                        )}
                        <div className="flex justify-between border-t border-gray-200 pt-2 text-lg font-bold dark:border-gray-700">
                            <span className="text-gray-900 dark:text-white">Total</span>
                            <span className="text-gray-900 dark:text-white">{formatPrice(order.total_amount)}</span>
                        </div>
                    </div>
                </div>

                {/* Shipping */}
                {order.shipping_address && (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Shipping Address</h2>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">{order.shipping_address}</p>
                        {order.shipping_city && <p className="text-gray-600 dark:text-gray-400">{order.shipping_city}, {order.shipping_country}</p>}
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                    <Link href={`/orders/${order.id}/tracking`} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Track Order</Link>
                    {['pending', 'paid'].includes(order.status) && (
                        <button
                            type="button"
                            onClick={cancelOrder}
                            disabled={busy !== null}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                        >
                            <XCircle className="h-4 w-4" />
                            {busy === 'cancel' ? 'Cancelling…' : 'Cancel order'}
                        </button>
                    )}
                    {order.status === 'delivered' && (
                        <button
                            type="button"
                            onClick={completeOrder}
                            disabled={busy !== null}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                            <Handshake className="h-4 w-4" />
                            {busy === 'complete' ? 'Saving…' : 'Mark as received'}
                        </button>
                    )}
                    {['delivered', 'completed'].includes(order.status) && (
                        <Link href={`/orders/returns?order=${order.id}`} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">Request Return</Link>
                    )}
                    {!['cancelled', 'refunded'].includes(order.status) && (
                        <Link href={`/orders/disputes?order=${order.id}`} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">Open Dispute</Link>
                    )}
                    <Link href={`/reviews/create?type=product&id=${order.items?.[0]?.product_id || ''}`} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">Write Review</Link>
                </div>

                {/* Tracking */}
                {order.tracking && order.tracking.length > 0 && (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tracking</h2>
                        <div className="mt-4 space-y-4">
                            {order.tracking.map((t) => (
                                <div key={t.id} className="flex items-start gap-3">
                                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{t.status}</p>
                                        {t.status_message && <p className="text-sm text-gray-500">{t.status_message}</p>}
                                        <p className="text-xs text-gray-400">{formatDateTime(t.created_at)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
