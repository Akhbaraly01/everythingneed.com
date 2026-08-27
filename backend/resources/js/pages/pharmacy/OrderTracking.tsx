import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Pill, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PharmacyOrder {
    id: string;
    reference: string;
    status: string;
    total: number;
    items: Array<{ name: string; quantity: number; unit_price: number }>;
    shipping_address?: string;
    tracking_number?: string;
    created_at: string;
}

export default function PharmacyOrderTracking() {
    const [order, setOrder] = useState<PharmacyOrder | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const path = window.location.pathname;
        const id = path.split('/').pop();
        api.get<PharmacyOrder>(`/api/orders/pharmacy/${id}`)
            .then((res) => setOrder(res.data))
            .catch(() => setOrder(null))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AppLayout>
            <Head title="Pharmacy Order" />
            <div className="max-w-2xl mx-auto space-y-6">
                <Link href="/pharmacy" className="text-sm text-gray-500 hover:text-gray-700">&larr; Back to Pharmacy</Link>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : !order ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Pill className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">Order not found</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            <p className="text-sm text-gray-500">Order #{order.reference}</p>
                            <div className="flex items-center justify-between">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(order.total)}</h1>
                                <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                                    order.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                }`}>{order.status}</span>
                            </div>
                        </div>

                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Items</h2>
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm py-1">
                                    <span>{item.quantity}x {item.name}</span>
                                    <span>{formatCurrency(item.unit_price * item.quantity)}</span>
                                </div>
                            ))}
                        </div>

                        {order.tracking_number && (
                            <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                <p className="text-sm text-gray-500">Tracking Number</p>
                                <p className="font-mono font-semibold text-gray-900 dark:text-white">{order.tracking_number}</p>
                            </div>
                        )}

                        {order.shipping_address && (
                            <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                <p className="text-sm text-gray-500">Shipping Address</p>
                                <p className="text-gray-900 dark:text-white">{order.shipping_address}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
