import { statusTone } from '@/lib/lifecycle';
import AppLayout from '@/layouts/AppLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils';
import { formatPrice } from '@/lib/currency';
import { RotateCcw, ArrowLeft, Plus, X, RefreshCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/shared/Button';

interface ReturnRequest {
    id: string;
    order_id: string;
    reason: string;
    description?: string;
    status: string;
    refund_amount?: number;
    admin_notes?: string;
    created_at: string;
    order?: { id: string; order_number: string; total_amount: number };
}

interface ReturnsResponse {
    data: ReturnRequest[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
}

interface CustomerOrder {
    id: string;
    order_number: string;
    status: string;
    total_amount: number;
    created_at: string;
}

const RETURNABLE = ['delivered', 'completed'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ReturnsPage() {
    const { url } = usePage();
    const [returns, setReturns] = useState<ReturnRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [orderId, setOrderId] = useState('');
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [orders, setOrders] = useState<CustomerOrder[]>([]);

    // "Request Return" links arrive as /orders/returns?order={uuid}.
    const prefilledOrderId = useMemo(() => {
        const query = url.split('?')[1] ?? '';
        return new URLSearchParams(query).get('order') ?? '';
    }, [url]);

    useEffect(() => {
        if (prefilledOrderId) {
            setOrderId(prefilledOrderId);
            setShowForm(true);
        }
    }, [prefilledOrderId]);

    const fetchReturns = () => {
        setLoading(true);
        setError(null);
        api.get<ReturnsResponse>('/api/returns')
            .then((res) => setReturns(res.data))
            .catch((e) => {
                setError(errorMessage(e, 'Failed to load returns'));
                setReturns([]);
            })
            .finally(() => setLoading(false));
    };

    const fetchOrders = () => {
        api.get<{ data: CustomerOrder[] }>('/api/product-orders', { params: { per_page: 50 } })
            .then((res) => setOrders((res.data ?? []).filter((o) => RETURNABLE.includes(o.status))))
            .catch(() => setOrders([]));
    };

    useEffect(() => { fetchReturns(); fetchOrders(); }, []);

    const createReturn = async () => {
        if (!orderId.trim() || !reason.trim()) return;
        setSubmitting(true);
        try {
            await api.post('/api/returns', { order_id: orderId.trim(), reason, description: description || undefined });
            setShowForm(false);
            setOrderId('');
            setReason('');
            setDescription('');
            fetchReturns();
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to create return request'));
        } finally {
            setSubmitting(false);
        }
    };

    const orderIdValid = UUID_RE.test(orderId.trim());

    return (
        <AppLayout title="Returns">
            <Head title="My Returns" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Link href="/orders" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="h-4 w-4" /> Back to Orders
                    </Link>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setShowForm(true)}
                    >
                        <Plus className="h-4 w-4" /> Request Return
                    </Button>
                </div>

                {/* Create return modal */}
                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Request Return</h3>
                                <Button variant="icon" iconOnly size="sm" aria-label="Close" onClick={() => setShowForm(false)}><X className="h-5 w-5" /></Button>
                            </div>
                            <div className="mt-4 space-y-4">
                                {orders.length > 0 && (
                                    <div>
                                        <label htmlFor="return-order-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Your orders</label>
                                        <select
                                            id="return-order-select"
                                            value=""
                                            onChange={(e) => e.target.value && setOrderId(e.target.value)}
                                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
                                        >
                                            <option value="">Select an order to return</option>
                                            {orders.map((o) => (
                                                <option key={o.id} value={o.id}>
                                                    #{o.order_number} · {formatPrice(o.total_amount)} · {o.status}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label htmlFor="return-order-id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Order ID *
                                        {prefilledOrderId && orderId === prefilledOrderId && (
                                            <span className="ml-2 text-xs font-normal text-gray-500">(prefilled)</span>
                                        )}
                                    </label>
                                    <input
                                        id="return-order-id"
                                        type="text"
                                        value={orderId}
                                        onChange={(e) => setOrderId(e.target.value)}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
                                        placeholder="Paste order ID"
                                    />
                                    {orderId.trim() !== '' && !orderIdValid && (
                                        <p className="mt-1 text-sm text-red-600">Enter the order UUID (for example 6f1c…-…-…).</p>
                                    )}
                                    {prefilledOrderId && orderId === prefilledOrderId && (
                                        <p className="mt-1 text-xs text-gray-500">Taken from the order you opened this page from.</p>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="return-reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reason *</label>
                                    <select id="return-reason" value={reason} onChange={(e) => setReason(e.target.value)}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700">
                                        <option value="">Select reason</option>
                                        <option value="damaged">Item arrived damaged</option>
                                        <option value="wrong_item">Wrong item received</option>
                                        <option value="not_as_described">Not as described</option>
                                        <option value="defective">Product defective</option>
                                        <option value="changed_mind">Changed my mind</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="return-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                                    <textarea id="return-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
                                        placeholder="Additional details..." />
                                </div>
                            </div>
                            <div className="mt-6 flex gap-3">
                                <Button variant="ghost" size="sm" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
                                <Button variant="primary" size="sm" className="flex-1" onClick={createReturn} disabled={submitting || !orderIdValid || !reason.trim()}>
                                    {submitting ? 'Submitting...' : 'Submit Request'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading...</p></div>
                ) : error ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-red-600 font-medium">{error}</p>
                        <Button variant="outline" size="sm" onClick={fetchReturns} className="mt-4">
                            <RefreshCcw className="h-4 w-4" /> Retry
                        </Button>
                    </div>
                ) : returns.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <RotateCcw className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No return requests</h3>
                        <p className="mt-2 text-gray-500">You haven't requested any returns yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {returns.map((ret) => (
                            <div key={ret.id} className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Order #{ret.order?.order_number ?? ret.order_id.slice(0, 8)}
                                        </p>
                                        <p className="mt-1 font-medium text-gray-900 dark:text-white">{ret.reason}</p>
                                        {ret.description && <p className="mt-1 text-sm text-gray-500">{ret.description}</p>}
                                        <p className="mt-1 text-xs text-gray-400">{formatDateTime(ret.created_at)}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusTone(ret.status)}`}>
                                            {ret.status}
                                        </span>
                                        {ret.refund_amount != null && (
                                            <p className="mt-2 text-sm font-semibold text-green-600">Refund: {formatPrice(ret.refund_amount)}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
