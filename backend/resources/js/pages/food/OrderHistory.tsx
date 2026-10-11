import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { useEffect, useState } from 'react';
import { Clock, CheckCircle, XCircle, Truck, ChefHat, RefreshCcw } from 'lucide-react';

interface FoodOrder {
    id: string;
    order_number: string;
    restaurant: { name: string };
    total_amount: number;
    status: string;
    created_at: string;
    delivery_address: string;
    estimated_delivery_time: string;
}

const STATUS_MAP: Record<string, { label: string; icon: typeof Clock; color: string }> = {
    pending: { label: 'Pending', icon: Clock, color: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30' },
    confirmed: { label: 'Confirmed', icon: CheckCircle, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30' },
    preparing: { label: 'Preparing', icon: ChefHat, color: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30' },
    out_for_delivery: { label: 'Out for Delivery', icon: Truck, color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30' },
    delivered: { label: 'Delivered', icon: CheckCircle, color: 'text-green-500 bg-green-100 dark:bg-green-900/30' },
    cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-red-500 bg-red-100 dark:bg-red-900/30' },
};

export default function FoodOrderHistory() {
    const [orders, setOrders] = useState<FoodOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        setError(null);
        api.get<{ data: FoodOrder[] }>('/api/food/orders')
            .then((res) => setOrders(res.data))
            .catch((e) => {
                setError(errorMessage(e, 'Failed to load food orders'));
                setOrders([]);
            })
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    return (
        <AppLayout title="Food Orders">
            <Head title="Food Orders" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Food Orders</h1>
                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : error ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-red-600 font-medium">{error}</p>
                        <button onClick={load} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                            <RefreshCcw className="h-4 w-4" /> Retry
                        </button>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <ChefHat className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">No orders yet</p>
                        <Link href="/food" className="mt-4 inline-block text-blue-600 hover:underline">Browse Restaurants</Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => {
                            const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
                            const Icon = status.icon;
                            return (
                                <Link
                                    key={order.id}
                                    href={`/food/orders/${order.id}`}
                                    className="block rounded-lg bg-white p-4 shadow hover:ring-2 hover:ring-blue-500 dark:bg-gray-800"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">{order.restaurant.name}</p>
                                            <p className="text-sm text-gray-500">#{order.order_number}</p>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${status.color}`}>
                                            <Icon className="h-3 w-3" /> {status.label}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-sm">
                                        <span className="text-gray-500">{new Date(order.created_at).toLocaleDateString()}</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">${order.total_amount}</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
