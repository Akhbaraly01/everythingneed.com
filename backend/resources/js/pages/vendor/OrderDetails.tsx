import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { Package, User, MapPin, DollarSign, Clock } from 'lucide-react';

interface Order {
    id: string;
    order_number: string;
    product_name: string;
    quantity: number;
    total_price: number;
    status: string;
    shipping_address: string;
    notes: string;
    created_at: string;
    customer: { name: string; email: string };
}

export default function VendorOrderDetails({ order_id }: { order_id?: string }) {
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const id = order_id || (typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : undefined);

    useEffect(() => {
        if (id) {
            api.get<{ data: Order }>(`/api/vendor/orders/${id}`)
                .then((res) => setOrder(res.data))
                .catch(() => {})
                .finally(() => setLoading(false));
        } else setLoading(false);
    }, [id]);

    const updateStatus = async (status: string) => {
        if (!id) return;
        setUpdating(true);
        try {
            const res = await api.patch<{ data: Order }>(`/api/vendor/orders/${id}`, { status });
            setOrder(res.data);
            toast.success(`Order marked ${status.replace('_', ' ')}.`);
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to update status'));
        }
        setUpdating(false);
    };

    if (loading) return <AppLayout title="Order Details"><p className="p-12 text-center text-gray-500">Loading...</p></AppLayout>;
    if (!order) return <AppLayout title="Order Details"><p className="p-12 text-center text-red-500">Order not found</p></AppLayout>;

    return (
        <AppLayout title={`Order ${order.order_number}`}>
            <Head title={`Order ${order.order_number}`} />
            <div className="mx-auto max-w-3xl space-y-6">
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">#{order.order_number}</h1>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>{order.status}</span>
                    </div>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-2"><Clock className="h-3 w-3" /> {new Date(order.created_at).toLocaleString()}</p>
                </div>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-3">
                    <h2 className="font-semibold dark:text-white flex items-center gap-2"><Package className="h-4 w-4" /> Product</h2>
                    <p className="dark:text-gray-300">{order.product_name} × {order.quantity}</p>
                    <p className="font-bold dark:text-white flex items-center gap-1"><DollarSign className="h-4 w-4" /> {order.total_price}</p>
                </div>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-3">
                    <h2 className="font-semibold dark:text-white flex items-center gap-2"><User className="h-4 w-4" /> Customer</h2>
                    <p className="dark:text-gray-300">{order.customer?.name}</p>
                    <p className="text-sm text-gray-500">{order.customer?.email}</p>
                    <p className="text-sm dark:text-gray-300 flex items-center gap-1"><MapPin className="h-4 w-4" /> {order.shipping_address || 'No address'}</p>
                    {order.notes && <p className="text-sm bg-gray-50 p-3 rounded dark:bg-gray-700 dark:text-gray-300">{order.notes}</p>}
                </div>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h2 className="font-semibold dark:text-white mb-3">Update Status</h2>
                    <div className="flex flex-wrap gap-2">
                        {['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
                            <button key={s} disabled={updating || order.status === s} onClick={() => updateStatus(s)} className="rounded-full border px-4 py-1.5 text-sm capitalize hover:bg-blue-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300">
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
