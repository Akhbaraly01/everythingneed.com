import { statusTone } from '@/lib/lifecycle';
import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils';
import { AlertTriangle, ArrowLeft, Plus, X, RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Dispute {
    id: string;
    order_id?: string;
    subject: string;
    description: string;
    status: string;
    resolution?: string;
    resolution_notes?: string;
    created_at: string;
    order?: { id: string; order_number: string; total_amount: number };
}

interface DisputesResponse {
    data: Dispute[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
}

export default function DisputesPage() {
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [orderId, setOrderId] = useState('');
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchDisputes = () => {
        setLoading(true);
        setError(null);
        api.get<DisputesResponse>('/api/disputes')
            .then((res) => setDisputes(res.data))
            .catch((e) => {
                setError(errorMessage(e, 'Failed to load disputes'));
                setDisputes([]);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchDisputes(); }, []);

    const createDispute = async () => {
        if (!subject.trim() || !description.trim()) return;
        setSubmitting(true);
        try {
            await api.post('/api/disputes', {
                order_id: orderId || undefined,
                subject,
                description,
            });
            setShowForm(false);
            setOrderId('');
            setSubject('');
            setDescription('');
            fetchDisputes();
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to create dispute'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AppLayout title="Disputes">
            <Head title="My Disputes" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Link href="/orders" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="h-4 w-4" /> Back to Orders
                    </Link>
                    <button
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                    >
                        <Plus className="h-4 w-4" /> Open Dispute
                    </button>
                </div>

                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Open Dispute</h3>
                                <button onClick={() => setShowForm(false)}><X className="h-5 w-5" /></button>
                            </div>
                            <div className="mt-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Order ID (optional)</label>
                                    <input type="text" value={orderId} onChange={(e) => setOrderId(e.target.value)}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
                                        placeholder="Paste order ID if related to an order" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject *</label>
                                    <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
                                        placeholder="Brief summary of the issue" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description *</label>
                                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
                                        placeholder="Describe the issue in detail..." />
                                </div>
                            </div>
                            <div className="mt-6 flex gap-3">
                                <button onClick={() => setShowForm(false)} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">Cancel</button>
                                <button onClick={createDispute} disabled={submitting || !subject.trim() || !description.trim()}
                                    className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
                                    {submitting ? 'Submitting...' : 'Submit Dispute'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading...</p></div>
                ) : error ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-red-600 font-medium">{error}</p>
                        <button onClick={fetchDisputes} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                            <RefreshCcw className="h-4 w-4" /> Retry
                        </button>
                    </div>
                ) : disputes.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No disputes</h3>
                        <p className="mt-2 text-gray-500">You haven't filed any disputes.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {disputes.map((d) => (
                            <div key={d.id} className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                <div className="flex items-start justify-between">
                                    <div>
                                        {d.order && <p className="text-sm text-gray-500">Order #{d.order.order_number}</p>}
                                        <p className="mt-1 font-medium text-gray-900 dark:text-white">{d.subject}</p>
                                        <p className="mt-1 text-sm text-gray-500">{d.description}</p>
                                        <p className="mt-1 text-xs text-gray-400">{formatDateTime(d.created_at)}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusTone(d.status)}`}>
                                            {d.status}
                                        </span>
                                        {d.resolution && (
                                            <p className="mt-2 text-sm text-gray-600">Resolved: {d.resolution}</p>
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
