import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { api, ApiError } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Handshake, Wallet, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface Offer {
    id: string;
    offer_number?: string;
    amount: number | string;
    message?: string;
    status: string;
    created_at: string;
}

interface RequestRow {
    id: string;
    request_number: string;
    title: string;
    description?: string;
    budget_min?: number | string;
    budget_max?: number | string;
    location?: string;
    deadline?: string;
    status: 'pending' | 'reviewing' | 'offered' | 'accepted' | 'paid' | 'in_progress' | 'completed' | 'cancelled';
    created_at: string;
    category_name?: string;
    offers?: Offer[];
}

interface Props {
    requests: { data: RequestRow[]; current_page: number; last_page: number; total: number };
}

const statusStyles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    reviewing: 'bg-sky-100 text-sky-800',
    offered: 'bg-indigo-100 text-indigo-800',
    accepted: 'bg-teal-100 text-teal-800',
    paid: 'bg-purple-100 text-purple-800',
    in_progress: 'bg-cyan-100 text-cyan-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-700',
};

export default function MyServiceRequests({ requests }: Props) {
    const [busyId, setBusyId] = useState<string | null>(null);

    const act = async (id: string, fn: () => Promise<unknown>, msg: string) => {
        setBusyId(id);
        try {
            await fn();
            toast.success(msg);
            router.reload({ only: ['requests'] });
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Action failed');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <AppLayout title="My requests">
            <Head title="My service requests" />
            <div className="mx-auto max-w-4xl px-4 py-8">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Requests</h1>
                        <p className="text-sm text-gray-500">{requests.total} requests across all services — offers, payment and progress in one place</p>
                    </div>
                    <Link href="/needs/request" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                        New request
                    </Link>
                </div>

                {requests.data.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 p-16 text-center dark:border-gray-600">
                        <Handshake className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                        <p className="font-medium text-gray-900 dark:text-white">No requests yet</p>
                        <p className="mb-4 text-sm text-gray-500">Tell us what you need and customer service will source offers for you.</p>
                        <Link href="/needs/request" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">Create a request</Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {requests.data.map((r) => {
                            const pendingOffer = r.offers?.find((o) => o.status === 'pending');
                            return (
                                <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-mono text-[11px] text-gray-400">{r.request_number}</span>
                                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[r.status]}`}>{r.status.replace('_', ' ')}</span>
                                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">{r.category_name}</span>
                                            </div>
                                            <h3 className="mt-1 font-semibold text-gray-900 dark:text-white">{r.title}</h3>
                                            <p className="mt-0.5 line-clamp-1 text-sm text-gray-500">{r.description}</p>
                                            <p className="mt-1 text-xs text-gray-400">
                                                Budget {[r.budget_min && formatCurrency(Number(r.budget_min)), r.budget_max && `– ${formatCurrency(Number(r.budget_max))}`].filter(Boolean).join(' ') || 'Flexible'}
                                                {r.deadline ? ` · due ${formatDate(r.deadline)}` : ''}
                                                {r.location ? ` · 📍 ${r.location}` : ''}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Incoming offer */}
                                    {pendingOffer && (
                                        <div className="mb-3 rounded-lg border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-900/50 dark:bg-indigo-950/30">
                                            <p className="mb-2 text-sm font-medium text-indigo-900 dark:text-indigo-200">
                                                <Handshake className="mr-1 inline h-4 w-4" />
                                                Offer received: {formatCurrency(Number(pendingOffer.amount))}
                                                {pendingOffer.message && <span className="font-normal"> — “{pendingOffer.message}”</span>}
                                            </p>
                                            <button
                                                disabled={busyId === r.id}
                                                onClick={() => act(r.id,
                                                    () => api.post(`/api/need-requests/${r.id}/offers/${pendingOffer.id}/accept`),
                                                    'Offer accepted — proceed to payment')}
                                                className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                                            >
                                                Accept offer
                                            </button>
                                        </div>
                                    )}

                                    {/* Lifecycle actions */}
                                    <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3 dark:border-gray-700">
                                        {r.status === 'accepted' && (
                                            <button
                                                disabled={busyId === r.id}
                                                onClick={() => act(r.id, () => api.post(`/api/need-requests/${r.id}/pay`), 'Payment recorded')}
                                                className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700"
                                            >
                                                <Wallet className="h-3.5 w-3.5" /> Pay now
                                            </button>
                                        )}
                                        {(r.status === 'reviewing') && <span className="text-xs text-sky-600">⏳ Customer service is sourcing the best offer…</span>}
                                        {(r.status === 'in_progress') && <span className="text-xs text-cyan-700">Fulfilment in progress.</span>}
                                        {(r.status === 'completed') && <span className="text-xs text-green-600">✓ Completed — thank you!</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {requests.last_page > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-3">
                        {requests.current_page > 1 && (
                            <Link href={`/requests?page=${requests.current_page - 1}`} preserveState className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white"><ChevronLeft className="h-4 w-4" /></Link>
                        )}
                        <span className="text-sm text-gray-600 dark:text-gray-300">Page {requests.current_page} of {requests.last_page}</span>
                        {requests.current_page < requests.last_page && (
                            <Link href={`/requests?page=${requests.current_page + 1}`} preserveState className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white"><ArrowRight className="h-4 w-4" /></Link>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
