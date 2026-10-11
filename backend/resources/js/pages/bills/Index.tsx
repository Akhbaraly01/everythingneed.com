import { statusTone } from '@/lib/lifecycle';
import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { formatDateTime } from '@/lib/utils';
import { formatPrice } from '@/lib/currency';
import { Receipt, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ApiError, api, errorMessage } from '@/lib/api';

interface BillService {
    id: string;
    label: string;
    countries: string[];
    currencies: string[];
    fields: string[];
    min_amount: number;
    enabled: boolean;
    available: boolean;
    unavailable_reasons: string[];
}

interface BillPurchase {
    id: string;
    service: string;
    country: string;
    currency: string;
    amount: number;
    status: string;
    reference: string;
    account_masked: Record<string, string>;
    provider_reference?: string | null;
    wallet_refunded: boolean;
    created_at: string;
}

const COUNTRIES = ['NG', 'GH', 'KE'];
const CURRENCIES = ['NGN', 'GHS', 'KES', 'USD'];

const fieldLabel = (field: string) => field.replace(/_/g, ' ');

export default function BillsPage() {
    const [services, setServices] = useState<BillService[]>([]);
    const [history, setHistory] = useState<BillPurchase[]>([]);
    const [loading, setLoading] = useState(true);
    const [country, setCountry] = useState('NG');
    const [currency, setCurrency] = useState('NGN');
    const [serviceId, setServiceId] = useState('airtime');
    const [amount, setAmount] = useState('');
    const [fields, setFields] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [kycBlocked, setKycBlocked] = useState(false);
    const [receipt, setReceipt] = useState<BillPurchase | null>(null);

    const load = () => {
        setLoading(true);
        Promise.all([
            api.get<{ data: BillService[] }>(`/api/bills/services?country=${country}&currency=${currency}`),
            api.get<{ data: BillPurchase[] }>('/api/bills/purchases?per_page=10'),
        ])
            .then(([svc, hist]) => {
                setServices(svc.data);
                setHistory(hist.data);
            })
            .catch((e) => setError(errorMessage(e, 'Failed to load bill services')))
            .finally(() => setLoading(false));
    };

    useEffect(load, [country, currency]);

    const service = services.find((s) => s.id === serviceId) ?? null;
    const fieldNames = (service?.fields ?? []).filter((f) => f !== 'amount');

    const purchase = async () => {
        const value = parseFloat(amount);
        if (isNaN(value) || value <= 0 || !service) return;
        setProcessing(true);
        setError(null);
        setKycBlocked(false);
        setReceipt(null);
        try {
            const res = await api.post<{ data: BillPurchase }>('/api/bills/purchase', {
                service: serviceId,
                country,
                currency,
                amount: value,
                account_fields: fields,
                idempotency_key: typeof crypto !== 'undefined' && 'randomUUID' in crypto
                    ? crypto.randomUUID()
                    : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            });
            setReceipt(res.data);
            setAmount('');
            setFields({});
            load();
        } catch (e) {
            setError(errorMessage(e, 'Purchase failed'));
            setKycBlocked(e instanceof ApiError && e.status === 403);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AppLayout title="Bills & Utilities">
            <Head title="Bills & Utilities" />
            <div className="mx-auto max-w-3xl space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bills & Utilities</h1>
                <p className="text-sm text-gray-500">
                    Airtime, data, electricity, internet and TV — paid from your wallet balance.
                    Unavailable services explain exactly why.
                </p>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">Loading bill services...</p>
                    </div>
                ) : (
                    <>
                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Country</label>
                                    <select value={country} onChange={(e) => setCountry(e.target.value)}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
                                        {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Currency</label>
                                    <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
                                        {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Service</label>
                                <select value={serviceId} onChange={(e) => { setServiceId(e.target.value); setFields({}); setReceipt(null); }}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
                                    {services.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.label}{s.available ? '' : ' (unavailable)'}
                                        </option>
                                    ))}
                                </select>
                                {service && !service.available && (
                                    <p className="mt-2 rounded-lg bg-yellow-50 p-3 text-xs text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                                        Unavailable: {service.unavailable_reasons.join('; ')}
                                    </p>
                                )}
                            </div>

                            {service?.available && (
                                <div className="mt-4 space-y-4">
                                    {fieldNames.map((field) => (
                                        <div key={field}>
                                            <label className="block text-sm font-medium capitalize text-gray-700 dark:text-gray-300">
                                                {fieldLabel(field)}
                                            </label>
                                            <input
                                                type="text"
                                                value={fields[field] ?? ''}
                                                onChange={(e) => setFields({ ...fields, [field]: e.target.value })}
                                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                                            />
                                        </div>
                                    ))}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Amount ({currency}, min {service.min_amount})
                                        </label>
                                        <input
                                            type="number"
                                            min={service.min_amount}
                                            step="0.01"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                                        />
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
                                    {error}
                                    {kycBlocked && (
                                        <Link href="/kyc" className="mt-1 block font-medium underline">
                                            Verify your identity to unlock bill payments
                                        </Link>
                                    )}
                                </div>
                            )}
                            {receipt && (
                                <div className="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-300">
                                    <p className="font-semibold">
                                        {receipt.status === 'succeeded' ? 'Purchase successful' : `Purchase ${receipt.status}`} · {receipt.reference}
                                    </p>
                                    <p className="mt-1 text-xs">
                                        {Object.entries(receipt.account_masked).map(([k, v]) => `${fieldLabel(k)}: ${v}`).join(' · ')}
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={purchase}
                                disabled={processing || !service?.available || !amount || parseFloat(amount) <= 0}
                                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                            >
                                <Zap className="h-4 w-4" />
                                {processing ? 'Processing...' : 'Pay from wallet'}
                            </button>
                        </div>

                        <div className="rounded-lg bg-white shadow dark:bg-gray-800">
                            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent purchases</h3>
                            </div>
                            {history.length === 0 ? (
                                <div className="p-12 text-center">
                                    <Receipt className="mx-auto h-12 w-12 text-gray-400" />
                                    <p className="mt-4 text-gray-500">No bill purchases yet</p>
                                </div>
                            ) : (
                                <div className="divide-y dark:divide-gray-700">
                                    {history.map((p) => (
                                        <div key={p.id} className="flex items-center justify-between px-6 py-4">
                                            <div>
                                                <p className="text-sm font-medium capitalize text-gray-900 dark:text-white">
                                                    {p.service} · {p.country}
                                                </p>
                                                <p className="text-xs text-gray-500">{p.reference} · {formatDateTime(p.created_at)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatPrice(p.amount)}</p>
                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusTone(p.status)}`}>
                                                    {p.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
