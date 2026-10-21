import { statusTone } from '@/lib/lifecycle';
import AppLayout from '@/layouts/AppLayout';
import { Head, usePage } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { formatPrice } from '@/lib/currency';
import { PromptDialog } from '@/components/shared/Ui';
import { CreditCard, RefreshCcw, Undo2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import Pagination from '@/components/shared/Pagination';

interface RefundInfo {
    id: string;
    amount: number | string;
    status: string;
    reason?: string | null;
    rejection_reason?: string | null;
    requested_at?: string | null;
    created_at: string;
}

interface Payment {
    id: string;
    amount: number;
    currency: string;
    status: string;
    description?: string;
    method?: string;
    created_at: string;
    refunds?: RefundInfo[];
}

interface PaymentsResponse {
    data: Payment[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
}

const EMPTY_META = { current_page: 1, last_page: 1, per_page: 15, total: 0 };

const refundTone: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-green-100 text-green-800',
    succeeded: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
};

export default function PaymentsIndex() {
    const { url } = usePage();

    const path = useMemo(() => url.split('?')[0] || '/payments', [url]);
    const params = useMemo(() => new URLSearchParams(url.split('?')[1] ?? ''), [url]);
    const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1);

    const [payments, setPayments] = useState<Payment[]>([]);
    const [meta, setMeta] = useState(EMPTY_META);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryTick, setRetryTick] = useState(0);
    const [refundFor, setRefundFor] = useState<Payment | null>(null);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        api.get<PaymentsResponse>('/api/payments', { params: { page } })
            .then((res) => {
                setPayments(res.data ?? []);
                setMeta(res.meta ?? { ...EMPTY_META, current_page: page });
            })
            .catch((e) => {
                setError(errorMessage(e, 'Failed to load payments'));
                setPayments([]);
            })
            .finally(() => setLoading(false));
    }, [page]);

    useEffect(() => { load(); }, [load, retryTick]);

    const hrefFor = (target: number) => `${path}?page=${target}`;

    const requestRefund = async (payment: Payment, value: string) => {
        try {
            await api.post(`/api/payments/${payment.id}/refund-request`, {
                reason: value.trim() || undefined,
                idempotency_key: `self-${payment.id}`,
            });
            toast.success('Refund request submitted — support will review it.');
            load();
        } catch (e) {
            toast.error(errorMessage(e, 'Refund request failed'));
        }
    };

    const canRequestRefund = (p: Payment) =>
        (p.status === 'succeeded' || p.status === 'partially_refunded')
        && !(p.refunds ?? []).some((r) => r.status === 'pending' || r.status === 'approved' || r.status === 'completed' || r.status === 'succeeded');

    return (
        <AppLayout title="Payments">
            <Head title="Payments" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment History</h1>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : error ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-red-600 font-medium">{error}</p>
                        <button onClick={() => setRetryTick((t) => t + 1)} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                            <RefreshCcw className="h-4 w-4" /> Retry
                        </button>
                    </div>
                ) : payments.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">No payments yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {payments.map((p) => (
                            <div key={p.id} className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{p.description ?? 'Payment'}</p>
                                        <p className="text-xs text-gray-500">{formatDateTime(p.created_at)}{p.method ? ` · ${p.method}` : ''}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {canRequestRefund(p) && (
                                            <button
                                                onClick={() => setRefundFor(p)}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800"
                                            >
                                                <Undo2 className="h-3.5 w-3.5" /> Request refund
                                            </button>
                                        )}
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(p.status)}`}>{p.status}</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{formatPrice(p.amount)}</span>
                                    </div>
                                </div>
                                {(p.refunds ?? []).length > 0 && (
                                    <div className="mt-3 space-y-1 border-t pt-3 dark:border-gray-700">
                                        {(p.refunds ?? []).map((r) => (
                                            <div key={r.id} className="flex items-center justify-between text-xs">
                                                <span className="text-gray-500">
                                                    Refund {formatPrice(Number(r.amount))}
                                                    {r.requested_at ? ` · requested ${formatDateTime(r.requested_at)}` : ''}
                                                </span>
                                                <span className="flex items-center gap-2">
                                                    {r.status === 'rejected' && r.rejection_reason && (
                                                        <span className="text-red-500">{r.rejection_reason}</span>
                                                    )}
                                                    <span className={`rounded-full px-2 py-0.5 font-medium ${refundTone[r.status] ?? 'bg-gray-100 text-gray-600'}`}>{r.status}</span>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <Pagination currentPage={meta.current_page} lastPage={meta.last_page} hrefFor={hrefFor} />

                <PromptDialog
                    open={refundFor !== null}
                    title="Request a refund"
                    description={refundFor ? `Refund for ${formatPrice(refundFor.amount)} — support reviews every request before money moves back (same method you paid with).` : undefined}
                    placeholder="Reason (optional)..."
                    confirmLabel="Submit request"
                    onSubmit={(v) => {
                        const target = refundFor;
                        setRefundFor(null);
                        if (target) void requestRefund(target, v);
                    }}
                    onCancel={() => setRefundFor(null)}
                />
            </div>
        </AppLayout>
    );
}
