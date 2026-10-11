import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import { UtensilsCrossed, ArrowLeft, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FoodOrderItem {
    name: string;
    quantity: number;
    unit_price: number;
}

interface FoodOrder {
    id: string;
    reference: string;
    restaurant_name: string;
    status: string;
    total: number;
    items: FoodOrderItem[];
    delivery_address?: string;
    estimated_delivery?: string;
    created_at: string;
}

export default function FoodOrderTracking() {
    const [order, setOrder] = useState<FoodOrder | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const path = window.location.pathname;
        const id = path.split('/').pop();
        api.get<{ data: FoodOrder }>(`/api/food/orders/${id}`)
            .then((res) => setOrder(res.data))
            .catch(() => setOrder(null))
            .finally(() => setLoading(false));
    }, []);

    const statusSteps = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
    const currentStep = order ? statusSteps.indexOf(order.status) : -1;

    return (
        <AppLayout>
            <Head title="Track Order" />
            <div className="max-w-2xl mx-auto space-y-6">
                <Link href="/food" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4" /> Back to Food
                </Link>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : !order ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <UtensilsCrossed className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">Order not found</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            <p className="text-sm text-gray-500">Order #{order.reference}</p>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{order.restaurant_name}</h1>
                            <p className="text-lg font-semibold text-indigo-600">{formatPrice(order.total)}</p>
                        </div>

                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Order Status</h2>
                            <div className="flex items-center justify-between">
                                {statusSteps.map((step, idx) => (
                                    <div key={step} className="flex flex-col items-center flex-1">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                            idx <= currentStep ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500 dark:bg-gray-700'
                                        }`}>{idx + 1}</div>
                                        <p className="mt-1 text-[10px] text-center text-gray-500 capitalize">{step.replace(/_/g, ' ')}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Items</h2>
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm py-1">
                                    <span>{item.quantity}x {item.name}</span>
                                    <span>{formatPrice(item.unit_price * item.quantity)}</span>
                                </div>
                            ))}
                        </div>

                        {order.delivery_address && (
                            <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800 flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="h-4 w-4" /> {order.delivery_address}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
