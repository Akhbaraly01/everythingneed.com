import { statusTone } from '@/lib/lifecycle';
import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils';
import { formatPrice } from '@/lib/currency';
import { RotateCcw, ArrowLeft, Plus, X, RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
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

export default function ReturnsPage() {
    const [returns, setReturns] = useState<ReturnRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [orderId, setOrderId] = useState('');
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

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

    useEffect(() => { fetchReturns(); }, []);

    const createReturn = async () => {
        if (!orderId.trim() || !reason.trim()) return;
        setSubmitting(true);
        try {
            await api.post('/api/returns', { order_id: orderId, reason, description: description || undefined });
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
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Order ID *</label>
                                    <input type="text" value={orderId} onChange={(e) => setOrderId(e.target.value)}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
                                        placeholder="Paste order ID" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reason *</label>
                                    <select value={reason} onChange={(e) => setReason(e.target.value)}
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
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
                                        placeholder="Additional details..." />
                                </div>
                            </div>
                            <div className="mt-6 flex gap-3">
                                <Button variant="ghost" size="sm" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
                                <Button variant="primary" size="sm" className="flex-1" onClick={createReturn} disabled={submitting || !orderId.trim() || !reason.trim()}>
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
