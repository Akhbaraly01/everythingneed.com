import AppLayout from '@/layouts/AppLayout';
import { Head, router, usePage } from '@inertiajs/react';
import {  api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/currency';
import { CreditCard, Check, RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import ConfirmDialog from '@/components/shared/Ui';

interface Plan {
    id: string;
    name: string;
    description?: string;
    price: number;
    interval: string;
    features: string[];
}

interface ActiveSubscription {
    id: string;
    status: string;
    expires_at?: string | null;
    plan?: { name?: string };
}

export default function SubscriptionsIndex() {
    const { auth } = usePage().props as { auth?: { user?: { id: string } } };
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeError, setActiveError] = useState<string | null>(null);
    const [subscribing, setSubscribing] = useState<string | null>(null);
    const [method, setMethod] = useState('card');
    const [active, setActive] = useState<ActiveSubscription | null>(null);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    const load = () => {
        setLoading(true);
        setError(null);
        api.get<{ data: Plan[] }>('/api/plans')
            .then((res) => setPlans(res.data))
            .catch((e) => {
                setError(errorMessage(e, 'Failed to load plans'));
                setPlans([]);
            })
            .finally(() => setLoading(false));
        if (auth?.user) {
            setActiveError(null);
            api.get<{ data: ActiveSubscription | null }>('/api/my-subscription')
                .then((res) => setActive(res.data))
                .catch((e) => {
                    setActiveError(errorMessage(e, "Failed to load your subscription status"));
                    setActive(null);
                });
        }
    };

    useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSubscribe = async (planId: string) => {
        if (!auth?.user) { router.visit('/login'); return; }
        setSubscribing(planId);
        try {
            await api.post('/api/subscribe', { plan_id: planId, payment_method: method });
            const res = await api.get<{ data: ActiveSubscription | null }>('/api/my-subscription');
            setActive(res.data);
            toast.success('Subscribed successfully!');
        } catch (e) {
            toast.error(errorMessage(e, 'Failed'));
        }
        setSubscribing(null);
    };

    const handleCancel = async () => {
        setCancelling(true);
        try {
            await api.post('/api/unsubscribe');
            setActive(null);
            setConfirmCancel(false);
            toast.success('Subscription cancelled.');
        } catch (e) {
            toast.error(errorMessage(e, 'Could not cancel subscription'));
        } finally {
            setCancelling(false);
        }
    };

    return (
        <AppLayout title="Subscriptions">
            <Head title="Subscriptions" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription Plans</h1>
                <p className="text-sm text-gray-500">Choose a plan that works for you</p>

                {activeError && (
                    <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                        <p className="font-medium">{activeError}</p>
                        <p className="mt-1">Your subscription has not been changed — we just couldn't read its status.</p>
                        <button onClick={load} className="mt-2 inline-flex items-center gap-2 font-medium text-amber-900 dark:text-amber-100">
                            <RefreshCcw className="h-4 w-4" /> Retry
                        </button>
                    </div>
                )}

                {active && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                        <p className="text-sm text-green-800 dark:text-green-200">
                            Active: <strong>{active.plan?.name ?? 'Plan'}</strong>
                            {active.expires_at ? ` · renews ${new Date(active.expires_at).toLocaleDateString()}` : ''}
                        </p>
                        <button
                            type="button"
                            onClick={() => setConfirmCancel(true)}
                            className="rounded-lg border border-red-300 px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-700"
                        >
                            Cancel subscription
                        </button>
                    </div>
                )}

                <label className="flex max-w-xs items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    Pay with
                    <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                        className="rounded-lg border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="card">Card</option>
                        <option value="wallet">Wallet balance</option>
                    </select>
                </label>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : error ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-red-600 font-medium">{error}</p>
                        <button onClick={load} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                            <RefreshCcw className="h-4 w-4" /> Retry
                        </button>
                    </div>
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
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{formatPrice(plan.price)}</span>
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

                <ConfirmDialog
                    open={confirmCancel}
                    title="Cancel subscription?"
                    description="Your plan stays active until the end of the paid period."
                    confirmLabel="Yes, cancel"
                    danger
                    busy={cancelling}
                    onConfirm={() => void handleCancel()}
                    onCancel={() => setConfirmCancel(false)}
                />
            </div>
        </AppLayout>
    );
}
