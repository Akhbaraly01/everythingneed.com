import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import type { Order } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Package, Truck, CheckCircle, Clock, XCircle, ArrowLeft } from 'lucide-react';

interface OrderShowProps {
    order: Order;
}

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-indigo-100 text-indigo-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
};

const statusIcons: Record<string, typeof Package> = {
    pending: Clock,
    confirmed: CheckCircle,
    processing: Package,
    shipped: Truck,
    delivered: CheckCircle,
    cancelled: XCircle,
};

export default function OrderShow({ order }: OrderShowProps) {
    const StatusIcon = statusIcons[order.status] ?? Package;

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
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${statusColors[order.status] ?? 'bg-gray-100 text-gray-800'}`}>
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
                                    {(item as any).product?.image_url ? (
                                        <img src={(item as any).product.image_url} alt={item.product_name} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-gray-400">
                                            <Package className="h-6 w-6" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 dark:text-white">{item.product_name}</p>
                                    {(item as any).variant?.name && (
                                        <p className="text-sm text-gray-500">{(item as any).variant.name}</p>
                                    )}
                                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                </div>
                                <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(item.total_price)}</p>
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
                            <span className="text-gray-900 dark:text-white">{formatCurrency(order.subtotal)}</span>
                        </div>
                        {order.discount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Discount</span>
                                <span className="text-green-600">-{formatCurrency(order.discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Shipping</span>
                            <span className="text-gray-900 dark:text-white">{formatCurrency(order.shipping_fee)}</span>
                        </div>
                        <div className="flex justify-between border-t border-gray-200 pt-2 text-lg font-bold dark:border-gray-700">
                            <span className="text-gray-900 dark:text-white">Total</span>
                            <span className="text-gray-900 dark:text-white">{formatCurrency(order.total_amount)}</span>
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
                    <Link href={`/orders/returns?order=${order.id}`} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">Request Return</Link>
                    <Link href={`/orders/disputes?order=${order.id}`} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">Open Dispute</Link>
                    <Link href={`/reviews/create?type=product&id=${(order.items?.[0] as any)?.product_id || ''}`} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">Write Review</Link>
                </div>

                {/* Tracking */}
                {order.tracking && (order.tracking as any[]).length > 0 && (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tracking</h2>
                        <div className="mt-4 space-y-4">
                            {(order.tracking as any[]).map((t: any) => (
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
