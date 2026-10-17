import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, HeartHandshake } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import { CARD_FALLBACK, listPaymentMethods, PaymentMethodOption } from '@/lib/payments';
import LoadingState, { ErrorState } from '@/components/shared/LoadingState';
import { Button } from '@/components/shared/Button';

interface AidDonation {
    id: string;
    amount: number;
    currency: string;
    status: string;
    donor?: { id?: string; name?: string } | null;
    created_at: string;
}

interface AidRequest {
    id: string;
    title: string;
    description: string;
    category?: string | null;
    goal_amount: number;
    raised_amount: number;
    currency: string;
    status: string;
    requester?: { id?: string; name?: string } | null;
    donations?: AidDonation[];
    images?: string[] | null;
    created_at: string;
}

export default function AidDetail({ aid_id }: { aid_id: string }) {
    const [aid, setAid] = useState<AidRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);
    const [methods, setMethods] = useState<PaymentMethodOption[]>([]);
    const [method, setMethod] = useState('card');
    const [amount, setAmount] = useState('');
    const [anonymous, setAnonymous] = useState(false);
    const [donating, setDonating] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        api.get<{ data: AidRequest }>(`/api/health/aid/${aid_id}`)
            .then((res) => setAid(res.data))
            .catch((e) => setError(errorMessage(e, 'Failed to load aid request')))
            .finally(() => setLoading(false));
    }, [aid_id]);

    useEffect(() => {
        load();
    }, [attempt, load]);

    useEffect(() => {
        listPaymentMethods()
            .then((m) => setMethods(m.length ? m : [CARD_FALLBACK]))
            .catch(() => setMethods([CARD_FALLBACK]));
    }, []);

    const donate = async () => {
        const value = Number(amount);
        if (!value || value < 1) {
            toast.error('Enter an amount of at least 1');
            return;
        }
        setDonating(true);
        try {
            await api.post(`/api/health/aid/${aid_id}/donate`, { amount: value, method, anonymous });
            toast.success('Donation received - thank you');
            setAmount('');
            setAnonymous(false);
            load();
        } catch (e) {
            toast.error(errorMessage(e, 'Donation failed'));
        } finally {
            setDonating(false);
        }
    };

    const pct =
        aid && Number(aid.goal_amount) > 0
            ? Math.min(100, Math.round((Number(aid.raised_amount) / Number(aid.goal_amount)) * 100))
            : 0;
    const acceptsDonations =
        aid && (aid.status === 'approved' || aid.status === 'funded');

    return (
        <AppLayout title={aid ? aid.title : 'Aid request'}>
            <Head title={aid ? aid.title : 'Aid request'} />
            <div className="mx-auto max-w-3xl space-y-6">
                <Link
                    href="/healthcare/aid"
                    className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                    <ArrowLeft className="h-4 w-4" /> All aid requests
                </Link>
                <div className="flex flex-wrap gap-2 text-sm">
                    <Link href="/healthcare" className="font-medium text-indigo-600 hover:underline">Healthcare</Link>
                    <Link href="/healthcare/bookings" className="font-medium text-indigo-600 hover:underline">Health Bookings</Link>
                </div>

                {loading ? (
                    <LoadingState message="Loading aid request..." />
                ) : error ? (
                    <ErrorState message={error} onRetry={() => setAttempt((n) => n + 1)} />
                ) : !aid ? (
                    <ErrorState message="Aid request not found" onRetry={() => setAttempt((n) => n + 1)} />
                ) : (
                    <>
                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            <div className="flex items-start justify-between gap-2">
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{aid.title}</h1>
                                <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium capitalize text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                    {aid.status}
                                </span>
                            </div>
                            {aid.category && (
                                <p className="mt-1 text-sm capitalize text-gray-500">{aid.category}</p>
                            )}
                            <p className="mt-4 whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
                                {aid.description}
                            </p>
                            {aid.images && aid.images.length > 0 && (
                                <div className="mt-4">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Evidence photos
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {aid.images.map((url, i) => (
                                            <a key={`${aid.id}-img-${i}`} href={url} target="_blank" rel="noreferrer">
                                                <img
                                                    src={url}
                                                    alt=""
                                                    loading="lazy"
                                                    className="h-20 w-20 rounded-lg border border-border object-cover hover:opacity-90"
                                                />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="mt-5">
                                <div className="h-3 w-full rounded-full bg-gray-100 dark:bg-gray-700">
                                    <div className="h-3 rounded-full bg-indigo-600" style={{ width: `${pct}%` }} />
                                </div>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                    {formatPrice(Number(aid.raised_amount), aid.currency)} raised of{' '}
                                    {formatPrice(Number(aid.goal_amount), aid.currency)} goal ({pct}%)
                                </p>
                            </div>
                            {aid.requester?.name && (
                                <p className="mt-3 text-xs text-gray-400">Requested by {aid.requester.name}</p>
                            )}
                        </div>

                        {acceptsDonations && (
                            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                    <HeartHandshake className="h-5 w-5 text-indigo-600" /> Donate
                                </h2>
                                <label className="mt-4 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Amount (USD)
                                    <input
                                        type="number"
                                        min={1}
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="25"
                                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                    />
                                </label>
                                <div className="mt-4 space-y-2">
                                    {methods.map((m) => (
                                        <label
                                            key={m.id}
                                            className={`flex items-center justify-between rounded-lg border p-3 ${
                                                method === m.id
                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                    : 'border-gray-200 dark:border-gray-700'
                                            } ${m.enabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                                        >
                                            <span className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name="donate-method"
                                                    value={m.id}
                                                    checked={method === m.id}
                                                    disabled={!m.enabled}
                                                    onChange={() => setMethod(m.id)}
                                                    className="text-indigo-600"
                                                />
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {m.label}
                                                </span>
                                            </span>
                                            {m.id === 'wallet' && m.available != null && (
                                                <span className="text-xs text-gray-500">
                                                    Balance {formatPrice(m.available)}
                                                </span>
                                            )}
                                        </label>
                                    ))}
                                </div>
                                <Button
                                    onClick={donate}
                                    loading={donating}
                                    size="lg"
                                    className="mt-4"
                                    fullWidth
                                >
                                    Donate
                                </Button>
                                <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 text-xs text-gray-500">
                                    <input
                                        type="checkbox"
                                        checked={anonymous}
                                        onChange={(e) => setAnonymous(e.target.checked)}
                                        className="h-3.5 w-3.5 rounded"
                                    />
                                    Donate anonymously (name hidden publicly)
                                </label>
                                <p className="mt-2 text-center text-xs text-gray-500">
                                    One donation per person per request. Sandbox - no real funds move.
                                </p>
                            </div>
                        )}

                        {aid.donations && aid.donations.length > 0 && (
                            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Donations ({aid.donations.length})
                                </h2>
                                <ul className="mt-3 divide-y dark:divide-gray-700">
                                    {aid.donations.map((d) => (
                                        <li key={d.id} className="flex items-center justify-between py-2 text-sm">
                                            <span className="text-gray-700 dark:text-gray-300">
                                                {d.donor?.name ?? 'Anonymous'}
                                            </span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {formatPrice(Number(d.amount), d.currency)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
