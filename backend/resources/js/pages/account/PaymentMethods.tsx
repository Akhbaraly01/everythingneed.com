import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { CreditCard, Trash2, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/lib/api';

interface SavedMethod {
    id: string;
    type: string;
    last_four?: string | null;
    brand?: string | null;
    is_default?: boolean;
    created_at: string;
}

interface AvailableMethod {
    id: string;
    label: string;
    enabled: boolean;
    available?: number;
}

export default function PaymentMethods() {
    const [saved, setSaved] = useState<SavedMethod[]>([]);
    const [available, setAvailable] = useState<AvailableMethod[]>([]);
    const [mode, setMode] = useState('sandbox');
    const [loading, setLoading] = useState(true);
    const [type, setType] = useState('card');
    const [lastFour, setLastFour] = useState('');
    const [brand, setBrand] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        Promise.all([
            api.get<{ data: SavedMethod[] }>('/api/payment-methods'),
            api.get<{ data: { mode: string; methods: AvailableMethod[] } }>('/api/payments/methods'),
        ])
            .then(([savedRes, availRes]) => {
                setSaved(Array.isArray(savedRes.data) ? savedRes.data : []);
                setAvailable(availRes.data.methods ?? []);
                setMode(availRes.data.mode ?? 'sandbox');
            })
            .catch((e) => setError(errorMessage(e, 'Failed to load payment methods')))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const save = async () => {
        if (!/^\d{4}$/.test(lastFour)) {
            setError('Last four must be exactly 4 digits.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await api.post('/api/payment-methods', { type, last_four: lastFour, brand: brand.trim() || undefined });
            setLastFour('');
            setBrand('');
            load();
        } catch (e) {
            setError(errorMessage(e, 'Could not save payment method'));
        } finally {
            setSaving(false);
        }
    };

    const remove = async (id: string) => {
        setError(null);
        try {
            await api.del(`/api/payment-methods/${id}`);
            load();
        } catch (e) {
            setError(errorMessage(e, 'Could not remove payment method'));
        }
    };

    return (
        <AppLayout title="Payment Methods">
            <Head title="Payment Methods" />
            <div className="mx-auto max-w-2xl space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Methods</h1>
                <p className="text-sm text-gray-500">
                    Only references are stored here (type, brand, last four) — full card details stay
                    with the payment provider. Mode: <span className="font-semibold">{mode}</span>.
                </p>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">Loading payment methods...</p>
                    </div>
                ) : (
                    <>
                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Available right now</h2>
                            <ul className="mt-3 space-y-2">
                                {available.map((method) => (
                                    <li key={method.id} className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                                            {method.id === 'wallet' ? <Wallet className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                                            {method.label}
                                        </span>
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${method.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                            {method.enabled ? 'Enabled' : 'Unavailable'}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Saved references</h2>
                            {saved.length === 0 ? (
                                <p className="mt-2 text-sm text-gray-500">No saved payment methods yet.</p>
                            ) : (
                                <ul className="mt-3 divide-y dark:divide-gray-700">
                                    {saved.map((method) => (
                                        <li key={method.id} className="flex items-center justify-between py-3">
                                            <div>
                                                <p className="text-sm font-medium capitalize text-gray-900 dark:text-white">
                                                    {method.brand ? `${method.brand} ` : ''}{method.type} ···· {method.last_four}
                                                </p>
                                                {method.is_default && <p className="text-xs text-gray-500">Default</p>}
                                            </div>
                                            <button onClick={() => remove(method.id)}
                                                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">
                                                <Trash2 className="h-3 w-3" /> Remove
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Save a reference</h2>
                            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                                    <select value={type} onChange={(e) => setType(e.target.value)}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
                                        <option value="card">Card</option>
                                        <option value="bank">Bank account</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last four</label>
                                    <input value={lastFour} onChange={(e) => setLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        placeholder="4242" inputMode="numeric"
                                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Brand (optional)</label>
                                    <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Visa"
                                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" />
                                </div>
                            </div>
                            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
                            <button onClick={save} disabled={saving}
                                className="mt-4 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
                                {saving ? 'Saving...' : 'Save reference'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
