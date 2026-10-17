import AppLayout from '@/layouts/AppLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { NEED_STATUS_LABELS, acceptedOffer, needStatusClasses } from '@/lib/needs';
import { Button } from '@/components/shared/Button';
import { AlertTriangle, ArrowLeft, CreditCard, Receipt } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { NeedRequestDetail } from '@/types';

/**
 * Spec S14 /needs/my-needs/{id}/payment: shows the payment state, the
 * amount (server-owned, from the accepted offer) and the pay action.
 * Failures surface the gateway's real reason (spec S98).
 */
export default function MyNeedPayment({ need_id }: { need_id: string }) {
    const { auth } = usePage().props as { auth?: { user?: { id: string } } };
    const [need, setNeed] = useState<NeedRequestDetail | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => {
        api.get<{ data: NeedRequestDetail }>(`/api/need-requests/${need_id}`)
            .then((res) => setNeed(res.data))
            .catch((e) => setError(errorMessage(e, 'Could not load payment state')));
    }, [need_id]);

    useEffect(() => {
        load();
    }, [load]);

    const isOwner = !!need && auth?.user?.id === need.user_id;
    const offer = need ? acceptedOffer(need) : undefined;
    const s = need?.status;
    const canPay = isOwner && (s === 'accepted' || s === 'payment_pending') && !!offer;

    const pay = async () => {
        setBusy(true);
        setError(null);
        setSuccess(null);
        try {
            const res = await api.post<{ message?: string }>(`/api/need-requests/${need_id}/pay`, { method: 'card' });
            setSuccess(res.message ?? 'Payment successful');
            load();
        } catch (e) {
            setError(errorMessage(e, 'Payment failed'));
        }
        setBusy(false);
    };

    return (
        <AppLayout title="Payment">
            <Head title="Payment" />
            <div className="mx-auto max-w-2xl space-y-6 px-3 py-4">
                <Link href={`/needs/my-needs/${need_id}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4" /> Back to need
                </Link>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                        <CreditCard className="h-5 w-5 text-indigo-500" /> Payment
                    </h1>
                    {need && (
                        <p className="mt-1 text-sm text-gray-500">
                            {need.title} ·{' '}
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${needStatusClasses(need.status)}`}>
                                {NEED_STATUS_LABELS[need.status]}
                            </span>
                        </p>
                    )}

                    {!need && !error && <p className="mt-4 text-sm text-gray-500">Loading...</p>}

                    {error && (
                        <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                            {error}
                        </p>
                    )}
                    {success && (
                        <p role="status" className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            {success}
                        </p>
                    )}

                    {need && (
                        <div className="mt-5 space-y-4">
                            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Amount due</p>
                                {offer ? (
                                    <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                                        {need.currency} {offer.price}
                                    </p>
                                ) : (
                                    <p className="mt-1 text-sm text-gray-500">No accepted offer yet - an amount appears once an offer is accepted.</p>
                                )}
                            </div>

                            {canPay && (
                                <Button
                                    type="button"
                                    onClick={pay}
                                    loading={busy}
                                    data-testid="need-pay-button"
                                    size="lg"
                                    fullWidth
                                >
                                    {`Pay ${need.currency} ${offer?.price}`}
                                </Button>
                            )}

                            {need.payment && (
                                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900/40">
                                    <p className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-200">
                                        <Receipt className="h-4 w-4 text-green-500" /> Receipt
                                    </p>
                                    <dl className="mt-2 space-y-1 text-sm">
                                        <div className="flex justify-between"><dt className="text-gray-500">Reference</dt><dd className="font-mono">{need.payment.reference}</dd></div>
                                        <div className="flex justify-between"><dt className="text-gray-500">Amount</dt><dd>{need.payment.currency} {need.payment.amount}</dd></div>
                                        <div className="flex justify-between"><dt className="text-gray-500">Status</dt><dd className="capitalize">{need.payment.status}</dd></div>
                                        <div className="flex justify-between"><dt className="text-gray-500">Date</dt><dd>{need.payment.created_at ? new Date(need.payment.created_at).toLocaleString() : '-'}</dd></div>
                                    </dl>
                                </div>
                            )}

                            {s === 'completed' && !need.payment && (
                                <p className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                    This need was completed without an online payment - the amount was settled off-platform.
                                </p>
                            )}

                            {isOwner && ['paid', 'in_progress', 'fulfilled'].includes(s ?? '') && (
                                <Link
                                    href={`/needs/my-needs/${need.id}`}
                                    className="block text-center text-sm font-medium text-indigo-600 hover:underline"
                                >
                                    Paid - track delivery or raise a dispute from the overview
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
