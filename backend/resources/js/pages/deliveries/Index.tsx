import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { Truck, Package, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Delivery {
    id: string;
    order_reference?: string;
    status: string;
    driver_name?: string;
    pickup_address?: string;
    delivery_address?: string;
    estimated_delivery?: string;
    created_at: string;
}

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    picked_up: 'bg-blue-100 text-blue-800',
    in_transit: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
};

export default function DeliveriesIndex() {
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ data: Delivery[] }>('/api/delivery/my')
            .then((res) => setDeliveries(res.data))
            .catch(() => setDeliveries([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AppLayout title="My Deliveries">
            <Head title="My Deliveries" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Deliveries</h1>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : deliveries.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Truck className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">No deliveries yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {deliveries.map((d) => (
                            <div key={d.id} className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                <div className="flex items-start justify-between">
                                    <div>
                                        {d.order_reference && <p className="text-sm text-gray-500">Order #{d.order_reference}</p>}
                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[d.status] ?? 'bg-gray-100 text-gray-800'}`}>{d.status.replace(/_/g, ' ')}</span>
                                        {d.driver_name && <p className="mt-1 text-sm text-gray-600">Driver: {d.driver_name}</p>}
                                        {d.pickup_address && <p className="text-xs text-gray-400">From: {d.pickup_address}</p>}
                                        {d.delivery_address && <p className="text-xs text-gray-400">To: {d.delivery_address}</p>}
                                    </div>
                                    {d.estimated_delivery && <p className="text-xs text-gray-500">ETA: {d.estimated_delivery}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
