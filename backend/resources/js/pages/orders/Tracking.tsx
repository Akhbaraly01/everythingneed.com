import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import { Package, Truck, CheckCircle, Clock, MapPin } from 'lucide-react';

interface Tracking {
    id: string;
    status: string;
    status_message: string;
    estimated_delivery: string;
    location_lat: number;
    location_lng: number;
    created_at: string;
    updated_at: string;
}

const STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function OrderTracking({ order_id }: { order_id?: string }) {
    const [tracking, setTracking] = useState<Tracking | null>(null);
    const [history, setHistory] = useState<Tracking[]>([]);
    const [loading, setLoading] = useState(true);
    const id = order_id || (typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : undefined);

    useEffect(() => {
        if (id) {
            api.get<{ data: Tracking; history: Tracking[] }>(`/api/orders/${id}/tracking`)
                .then((res) => { setTracking(res.data); setHistory((res as any).history || []); })
                .catch(() => {})
                .finally(() => setLoading(false));
        } else setLoading(false);
    }, [id]);

    if (loading) return <AppLayout title="Order Tracking"><p className="p-12 text-center text-gray-500">Loading...</p></AppLayout>;
    if (!tracking) return <AppLayout title="Order Tracking"><p className="p-12 text-center text-red-500">Tracking not found</p></AppLayout>;

    const currentStep = STEPS.indexOf(tracking.status);

    return (
        <AppLayout title="Order Tracking">
            <Head title="Order Tracking" />
            <div className="mx-auto max-w-2xl space-y-6">
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Order Tracking</h1>
                    <div className="flex items-center justify-between">
                        {STEPS.map((step, i) => (
                            <div key={step} className="flex items-center">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${i <= currentStep ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500 dark:bg-gray-700'}`}>{i <= currentStep ? <CheckCircle className="h-4 w-4" /> : i + 1}</div>
                                {i < STEPS.length - 1 && <div className={`h-1 w-8 sm:w-12 ${i < currentStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />}
                            </div>
                        ))}
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-gray-500">{STEPS.map((s) => <span key={s} className="capitalize">{s}</span>)}</div>
                    {tracking.status_message && <p className="mt-4 text-sm bg-blue-50 p-3 rounded dark:bg-blue-900/20 dark:text-blue-300">{tracking.status_message}</p>}
                    {tracking.estimated_delivery && <p className="mt-2 text-sm text-gray-500 flex items-center gap-1"><Clock className="h-4 w-4" /> Estimated delivery: {new Date(tracking.estimated_delivery).toLocaleString()}</p>}
                </div>

                {history.length > 0 && (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="font-semibold dark:text-white mb-3">History</h2>
                        <div className="space-y-3">
                            {history.map((h) => (
                                <div key={h.id} className="flex gap-3 border-l-2 border-blue-500 pl-4 py-1">
                                    <div><p className="font-medium capitalize dark:text-white">{h.status}</p><p className="text-sm text-gray-500">{h.status_message}</p><p className="text-xs text-gray-400">{new Date(h.created_at).toLocaleString()}</p></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
