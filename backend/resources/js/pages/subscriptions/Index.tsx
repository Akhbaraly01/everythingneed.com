import AppLayout from '@/layouts/AppLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { CreditCard, Check } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Plan {
    id: string;
    name: string;
    description?: string;
    price: number;
    interval: string;
    features: string[];
}

export default function SubscriptionsIndex() {
    const { auth } = usePage().props as { auth?: { user?: { id: string } } };
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [subscribing, setSubscribing] = useState<string | null>(null);

    useEffect(() => {
        api.get<{ data: Plan[] }>('/api/plans')
            .then((res) => setPlans(res.data))
            .catch(() => setPlans([]))
            .finally(() => setLoading(false));
    }, []);

    const handleSubscribe = async (planId: string) => {
        if (!auth?.user) { router.visit('/login'); return; }
        setSubscribing(planId);
        try {
            await api.post('/api/subscribe', { plan_id: planId });
            alert('Subscribed successfully!');
        } catch (e: any) {
            alert(e.message ?? 'Failed');
        }
        setSubscribing(null);
    };

    return (
        <AppLayout title="Subscriptions">
            <Head title="Subscriptions" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription Plans</h1>
                <p className="text-sm text-gray-500">Choose a plan that works for you</p>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : plans.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No plans available</h3>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {plans.map((plan) => (
                            <div key={plan.id} className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                                <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
                                <div className="mt-4">
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(plan.price)}</span>
                                    <span className="text-sm text-gray-500">/{plan.interval}</span>
                                </div>
                                <ul className="mt-4 space-y-2">
                                    {(plan.features ?? []).map((f, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <Check className="h-4 w-4 text-green-500" /> {f}
                                        </li>
                                    ))}
                                </ul>
                                <button onClick={() => handleSubscribe(plan.id)} disabled={subscribing === plan.id}
                                    className="mt-6 w-full rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
                                    {subscribing === plan.id ? 'Subscribing...' : 'Subscribe'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
