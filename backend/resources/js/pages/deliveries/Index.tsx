import { statusTone } from '@/lib/lifecycle';
import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { Truck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface QueueDelivery {
    id: string;
    status: 'assigned' | 'picked_up' | 'in_transit';
    pickup_address?: string | null;
    delivery_address?: string | null;
    notes?: string | null;
    assigned_at?: string | null;
    order?: { id: string; order_number?: string; status?: string; total_amount?: number };
}

interface HistoryDelivery {
    id: string;
    status: 'delivered' | 'failed';
    delivered_at?: string | null;
    order?: { order_number?: string };
}

const NEXT: Record<QueueDelivery['status'], Array<{ value: string; label: string }>> = {
    assigned: [{ value: 'picked_up', label: 'Mark picked up' }],
    picked_up: [{ value: 'in_transit', label: 'Mark in transit' }],
    in_transit: [
        { value: 'delivered', label: 'Mark delivered' },
        { value: 'failed', label: 'Mark failed' },
    ],
};

/**
 * Plan G2 rider workspace: active assigned queue with strict one-step
 * transitions, plus completed history. Non-riders get the honest empty
 * state (the old page read a stats object as a list and always broke).
 */
export default function DeliveriesIndex() {
    const [queue, setQueue] = useState<QueueDelivery[]>([]);
    const [history, setHistory] = useState<HistoryDelivery[]>([]);
    const [loading, setLoading] = useState(true);
    const [notRider, setNotRider] = useState(false);
    const [joinForm, setJoinForm] = useState({ full_name: '', phone: '', vehicle_type: 'motorbike' });
    const [joining, setJoining] = useState(false);

    const load = () => {
        setLoading(true);
        Promise.all([
            api.get<{ data: QueueDelivery[] }>('/api/delivery/queue'),
            api.get<{ data: HistoryDelivery[] }>('/api/delivery/history'),
        ])
            .then(([q, h]) => {
                setQueue(Array.isArray(q.data) ? q.data : []);
                setHistory(Array.isArray(h.data) ? h.data : []);
            })
            .catch((e) => {
                const status = (e as { status?: number })?.status;
                if (status === 404) {
                    // Not a registered delivery manager: honest empty state.
                    setNotRider(true);
                    setQueue([]);
                    setHistory([]);
                } else {
                    toast.error(errorMessage(e, 'Failed to load deliveries'));
                }
            })
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const advance = async (id: string, status: string) => {
        try {
            await api.post(`/api/delivery/${id}/transition`, { status });
            toast.success('Delivery updated.');
            load();
        } catch (e) {
            toast.error(errorMessage(e, 'Could not update delivery'));
        }
    };

    const joinAsRider = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinForm.full_name.trim() || !joinForm.phone.trim()) {
            toast.error('Add your name and phone number.');
            return;
        }
        setJoining(true);
        try {
            await api.post('/api/delivery/managers', joinForm);
            toast.success('Welcome aboard! New assignments appear below.');
            setNotRider(false);
            load();
        } catch (err) {
            toast.error(errorMessage(err, 'Could not register as rider'));
        } finally {
            setJoining(false);
        }
    };

    return (
        <AppLayout title="My Deliveries">
            <Head title="My Deliveries" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Deliveries</h1>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : notRider ? (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <Truck className="mx-auto h-12 w-12 text-gray-400" />
                        <h2 className="mt-4 text-center text-lg font-semibold text-gray-900 dark:text-white">
                            Become a delivery rider
                        </h2>
                        <p className="mt-1 text-center text-sm text-gray-500">
                            Register once. Assigned orders appear in your queue below.
                        </p>
                        <form onSubmit={(e) => void joinAsRider(e)} className="mx-auto mt-4 max-w-md space-y-3">
                            <input
                                value={joinForm.full_name}
                                onChange={(e) => setJoinForm({ ...joinForm, full_name: e.target.value })}
                                placeholder="Full name"
                                aria-label="Full name"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                            <input
                                value={joinForm.phone}
                                onChange={(e) => setJoinForm({ ...joinForm, phone: e.target.value })}
                                placeholder="Phone number"
                                aria-label="Phone number"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                            <select
                                value={joinForm.vehicle_type}
                                onChange={(e) => setJoinForm({ ...joinForm, vehicle_type: e.target.value })}
                                aria-label="Vehicle type"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="motorbike">Motorbike</option>
                                <option value="bicycle">Bicycle</option>
                                <option value="car">Car</option>
                                <option value="van">Van</option>
                            </select>
                            <button
                                type="submit"
                                disabled={joining}
                                className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                            >
                                {joining ? 'Registering...' : 'Register as rider'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <>
                        <section>
                            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                                Assigned queue{queue.length > 0 ? ` (${queue.length})` : ''}
                            </h2>
                            {queue.length === 0 ? (
                                <p className="text-sm text-gray-500">No active deliveries. New assignments appear here.</p>
                            ) : (
                                <div className="space-y-4">
                                    {queue.map((d) => (
                                        <div key={d.id} className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    {d.order?.order_number && (
                                                        <p className="text-sm text-gray-500">Order #{d.order.order_number}</p>
                                                    )}
                                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusTone(d.status)}`}>
                                                        {d.status.replace(/_/g, ' ')}
                                                    </span>
                                                    {d.pickup_address && <p className="mt-1 text-xs text-gray-400">From: {d.pickup_address}</p>}
                                                    {d.delivery_address && <p className="text-xs text-gray-400">To: {d.delivery_address}</p>}
                                                    {d.notes && <p className="mt-1 text-xs text-gray-500">{d.notes}</p>}
                                                </div>
                                                <div className="flex shrink-0 flex-col gap-2">
                                                    {NEXT[d.status]?.map((action) => (
                                                        <button
                                                            key={action.value}
                                                            type="button"
                                                            onClick={() => void advance(d.id, action.value)}
                                                            className={`rounded-lg px-3 py-1 text-xs font-medium text-white ${
                                                                action.value === 'failed'
                                                                    ? 'bg-red-600 hover:bg-red-500'
                                                                    : 'bg-indigo-600 hover:bg-indigo-500'
                                                            }`}
                                                        >
                                                            {action.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section>
                            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">History</h2>
                            {history.length === 0 ? (
                                <p className="text-sm text-gray-500">No completed deliveries yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {history.map((d) => (
                                        <div key={d.id} className="flex items-center justify-between rounded-lg bg-white p-3 text-sm shadow dark:bg-gray-800">
                                            <span className="text-gray-500">
                                                {d.order?.order_number ? `Order #${d.order.order_number}` : 'Delivery'}
                                            </span>
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusTone(d.status)}`}>
                                                {d.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
