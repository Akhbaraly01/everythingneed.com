import AdminLayout from '@/layouts/AdminLayout';
import { Head, usePage } from '@inertiajs/react';
import { api, errorMessage, rows } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { PromptDialog } from '@/components/shared/Ui';
import { Scale, PackageX, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

/** Real dispute row (AdminDomainController::disputes). */
interface Dispute {
    id: string;
    subject: string;
    description?: string | null;
    status: 'open' | 'in_review' | 'resolved' | 'closed';
    resolution: 'none' | 'refund' | 'replacement' | 'credit' | 'dismissed';
    resolution_notes?: string | null;
    order_id?: string | null;
    order_number?: string | null;
    created_at: string;
    requester_name?: string | null;
    requester_email?: string | null;
}

/** Real refund row (AdminDomainController::refunds). */
interface Refund {
    id: string;
    amount: number;
    reason?: string | null;
    status: 'pending' | 'approved' | 'rejected' | 'completed' | 'succeeded' | 'failed';
    created_at: string;
    reference?: string | null;
    method?: string | null;
    refund_method?: string | null;
    payment_status?: string | null;
    payment_amount?: number | null;
    requested_by_name?: string | null;
    reviewed_by_name?: string | null;
    rejection_reason?: string | null;
    requested_at?: string | null;
    reviewed_at?: string | null;
}

/** Real RMA row (ReturnRequestController::adminIndex). */
interface ReturnRequest {
    id: string;
    order_id?: string | null;
    reason: string;
    description?: string | null;
    status: 'pending' | 'approved' | 'rejected' | 'received' | 'refunded';
    refund_amount?: number | string | null;
    admin_notes?: string | null;
    created_at: string;
    requester_name?: string | null;
    requester_email?: string | null;
}

interface Meta {
    page: number;
    per_page: number;
    total: number;
}

type Tab = 'disputes' | 'refunds' | 'returns';

const disputeTone: Record<string, string> = {
    open: 'bg-red-100 text-red-800',
    in_review: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-600',
};

const refundTone: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-green-100 text-green-800',
    succeeded: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
};

const returnTone: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    received: 'bg-blue-100 text-blue-800',
    refunded: 'bg-green-100 text-green-800',
};

export default function AdminReturns() {
    const { auth } = usePage().props as unknown as { auth: { roles?: string[] } };
    const roles = auth?.roles ?? [];
    const canModerate = roles.some((r) => ['super_admin', 'administrator', 'moderator'].includes(r));
    const canRefunds = roles.some((r) => ['super_admin', 'administrator', 'finance_admin'].includes(r));
    const canReturns = roles.some((r) => ['super_admin', 'administrator', 'moderator', 'finance_admin'].includes(r));

    const initialTab: Tab = canModerate ? 'disputes' : 'refunds';
    const [tab, setTab] = useState<Tab>(initialTab);
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [refunds, setRefunds] = useState<Refund[]>([]);
    const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [dStatus, setDStatus] = useState('all');
    const [rStatus, setRStatus] = useState('all');
    const [retStatus, setRetStatus] = useState('all');
    const [page, setPage] = useState(1);
    const [promptFor, setPromptFor] = useState<{ d: Dispute; status: Dispute['status'] } | null>(null);
    const [returnPrompt, setReturnPrompt] = useState<{ r: ReturnRequest; action: 'approve' | 'reject' } | null>(null);
    const [refundPrompt, setRefundPrompt] = useState<{ r: Refund; action: 'approve' | 'reject' } | null>(null);

    useEffect(() => {
        setLoading(true);
        if (tab === 'disputes') {
            api.get<{ data: Dispute[]; meta: Meta }>(`/api/admin/disputes?page=${page}&status=${dStatus}`)
                .then((res) => { setDisputes(rows<Dispute>(res)); setMeta(res.meta); })
                .catch((e) => { setDisputes([]); toast.error(errorMessage(e, 'Failed to load disputes')); })
                .finally(() => setLoading(false));
        } else if (tab === 'returns') {
            api.get<{ data: ReturnRequest[]; meta: Meta }>(`/api/admin/returns?page=${page}&status=${retStatus}`)
                .then((res) => { setReturnRequests(rows<ReturnRequest>(res)); setMeta(res.meta); })
                .catch((e) => { setReturnRequests([]); toast.error(errorMessage(e, 'Failed to load returns')); })
                .finally(() => setLoading(false));
        } else {
            api.get<{ data: Refund[]; meta: Meta }>(`/api/admin/refunds?page=${page}&status=${rStatus}`)
                .then((res) => { setRefunds(rows<Refund>(res)); setMeta(res.meta); })
                .catch((e) => { setRefunds([]); toast.error(errorMessage(e, 'Failed to load refunds')); })
                .finally(() => setLoading(false));
        }
    }, [tab, page, dStatus, rStatus, retStatus]);

    const decide = async (d: Dispute, status: Dispute['status'], notes: string | null = null) => {
        try {
            await api.put(`/api/admin/disputes/${d.id}`, {
                status,
                resolution: d.resolution !== 'none' ? d.resolution : undefined,
                resolution_notes: notes,
            });
            setDisputes(disputes.map((x) => (x.id === d.id ? { ...x, status, resolution_notes: notes ?? x.resolution_notes } : x)));
            toast.success(`Dispute marked ${status}.`);
        } catch (e) {
            toast.error(errorMessage(e, 'Update failed'));
        }
    };

    /** Statuses that collect resolution notes first; the rest act immediately. */
    const requestDecide = (d: Dispute, status: Dispute['status']) => {
        if (status === 'resolved' || status === 'closed') {
            setPromptFor({ d, status });
        } else {
            void decide(d, status);
        }
    };

    const submitNotes = (notes: string) => {
        const target = promptFor;
        setPromptFor(null);
        if (target) void decide(target.d, target.status, notes || null);
    };

    /** RMA decision: approve issues the gateway refund server-side. */
    const decideReturn = async (r: ReturnRequest, action: 'approve' | 'reject', value: string) => {
        const body: Record<string, unknown> = { action };
        if (action === 'reject') {
            if (value.trim()) body.admin_notes = value.trim();
        } else if (value.trim()) {
            const amt = Number(value);
            if (!Number.isFinite(amt) || amt <= 0) {
                toast.error('Refund amount must be a positive number');
                return;
            }
            body.refund_amount = amt;
        }
        try {
            await api.put(`/api/admin/returns/${r.id}`, body);
            setReturnRequests(returnRequests.map((x) => (x.id === r.id
                ? { ...x, status: action === 'approve' ? 'refunded' : 'rejected', admin_notes: (body.admin_notes as string) ?? x.admin_notes }
                : x)));
            toast.success(action === 'approve' ? 'Return approved and refunded.' : 'Return rejected.');
        } catch (e) {
            toast.error(errorMessage(e, 'Decision failed'));
        }
    };

    /** Gap 3: support review of a refund REQUEST — approve pays same-method. */
    const decideRefund = async (r: Refund, action: 'approve' | 'reject', value: string) => {
        const body: Record<string, unknown> = { action };
        if (action === 'reject') {
            if (value.trim()) body.reason = value.trim();
        } else if (value.trim()) {
            const amt = Number(value);
            if (!Number.isFinite(amt) || amt <= 0) {
                toast.error('Refund amount must be a positive number');
                return;
            }
            body.amount = amt;
        }
        try {
            await api.put(`/api/admin/refunds/${r.id}`, body);
            setRefunds(refunds.map((x) => (x.id === r.id
                ? { ...x, status: action === 'approve' ? 'completed' : 'rejected', rejection_reason: (body.reason as string) ?? x.rejection_reason }
                : x)));
            toast.success(action === 'approve' ? 'Refund approved and processed.' : 'Refund request rejected.');
        } catch (e) {
            toast.error(errorMessage(e, 'Decision failed'));
        }
    };

    const list = tab === 'disputes' ? disputes : tab === 'returns' ? returnRequests : refunds;

    return (
        <AdminLayout title="Returns & Disputes">
            <Head title="Returns & Disputes" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Returns & Disputes</h1>
                    {meta && <span className="text-sm text-gray-500">{meta.total} records</span>}
                </div>

                <div className="flex gap-2">
                    {canModerate && (
                        <button onClick={() => { setTab('disputes'); setPage(1); }}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ${tab === 'disputes' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                            <Scale className="h-4 w-4" /> Disputes
                        </button>
                    )}
                    {canRefunds && (
                        <button onClick={() => { setTab('refunds'); setPage(1); }}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ${tab === 'refunds' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                            <PackageX className="h-4 w-4" /> Refunds
                        </button>
                    )}
                    {canReturns && (
                        <button onClick={() => { setTab('returns'); setPage(1); }}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ${tab === 'returns' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                            <RotateCcw className="h-4 w-4" /> Returns
                        </button>
                    )}
                </div>

                {tab === 'disputes' && canModerate && (
                    <div className="flex flex-wrap gap-2">
                        {['all', 'open', 'in_review', 'resolved', 'closed'].map((s) => (
                            <button key={s} onClick={() => { setDStatus(s); setPage(1); }}
                                className={`rounded-full px-3 py-1 text-sm font-medium ${dStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}>
                                {s.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                )}

                {tab === 'refunds' && canRefunds && (
                    <div className="flex flex-wrap gap-2">
                        {['all', 'pending', 'approved', 'rejected', 'completed'].map((s) => (
                            <button key={s} onClick={() => { setRStatus(s); setPage(1); }}
                                className={`rounded-full px-3 py-1 text-sm font-medium ${rStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}>
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                {tab === 'returns' && canReturns && (
                    <div className="flex flex-wrap gap-2">
                        {['all', 'pending', 'approved', 'rejected', 'received', 'refunded'].map((s) => (
                            <button key={s} onClick={() => { setRetStatus(s); setPage(1); }}
                                className={`rounded-full px-3 py-1 text-sm font-medium ${retStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}>
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading...</p></div>
                ) : list.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Scale className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">Nothing matches this filter</p>
                    </div>
                ) : tab === 'disputes' ? (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3">Subject</th>
                                    <th className="px-4 py-3">Requester</th>
                                    <th className="px-4 py-3">Order</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Resolution</th>
                                    <th className="px-4 py-3">Filed</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {disputes.map((d) => (
                                    <tr key={d.id}>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900 dark:text-white">{d.subject}</p>
                                            <p className="max-w-[260px] truncate text-xs text-gray-500">{d.description}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-gray-900 dark:text-white">{d.requester_name}</p>
                                            <p className="text-xs text-gray-500">{d.requester_email}</p>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{d.order_number ?? '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${disputeTone[d.status] ?? ''}`}>
                                                {d.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{d.resolution !== 'none' ? d.resolution : '—'}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(d.created_at)}</td>
                                        <td className="px-4 py-3">
                                            {(d.status === 'open' || d.status === 'in_review') && (
                                                <div className="flex gap-1.5">
                                                    {d.status === 'open' && (
                                                        <button onClick={() => requestDecide(d, 'in_review')}
                                                            className="rounded-lg bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-500">Review</button>
                                                    )}
                                                    <button onClick={() => requestDecide(d, 'resolved')} title="Resolve"
                                                        className="rounded p-1 text-green-600 hover:bg-green-50"><CheckCircle className="h-4 w-4" /></button>
                                                    <button onClick={() => requestDecide(d, 'closed')} title="Close"
                                                        className="rounded p-1 text-gray-500 hover:bg-gray-100"><XCircle className="h-4 w-4" /></button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : tab === 'returns' ? (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3">Requester</th>
                                    <th className="px-4 py-3">Order</th>
                                    <th className="px-4 py-3">Reason</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Refund</th>
                                    <th className="px-4 py-3">Filed</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {returnRequests.map((r) => (
                                    <tr key={r.id}>
                                        <td className="px-4 py-3">
                                            <p className="text-gray-900 dark:text-white">{r.requester_name}</p>
                                            <p className="text-xs text-gray-500">{r.requester_email}</p>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.order_id?.slice(0, 8) ?? '—'}</td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900 dark:text-white">{r.reason}</p>
                                            <p className="max-w-[240px] truncate text-xs text-gray-500">{r.description ?? r.admin_notes}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${returnTone[r.status] ?? ''}`}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-semibold">{r.refund_amount ? formatCurrency(Number(r.refund_amount)) : '—'}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(r.created_at)}</td>
                                        <td className="px-4 py-3">
                                            {r.status === 'pending' && (
                                                <div className="flex gap-1.5">
                                                    <button onClick={() => setReturnPrompt({ r, action: 'approve' })}
                                                        title="Approve and refund"
                                                        className="rounded p-1 text-green-600 hover:bg-green-50"><CheckCircle className="h-4 w-4" /></button>
                                                    <button onClick={() => setReturnPrompt({ r, action: 'reject' })}
                                                        title="Reject"
                                                        className="rounded p-1 text-red-600 hover:bg-red-50"><XCircle className="h-4 w-4" /></button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3">Payment</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="px-4 py-3">Reason</th>
                                    <th className="px-4 py-3">Requested by</th>
                                    <th className="px-4 py-3">Payment Status</th>
                                    <th className="px-4 py-3">Refund Status</th>
                                    <th className="px-4 py-3">Requested</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {refunds.map((r) => (
                                    <tr key={r.id}>
                                        <td className="px-4 py-3">
                                            <p className="font-mono text-xs text-gray-500">{r.reference ?? '—'}</p>
                                            <p className="text-xs text-gray-500">{r.method}{r.refund_method && r.refund_method !== r.method ? ` → ${r.refund_method}` : ''}</p>
                                        </td>
                                        <td className="px-4 py-3 font-semibold">{formatCurrency(Number(r.amount))}</td>
                                        <td className="max-w-[260px] px-4 py-3 text-xs text-gray-500">
                                            {r.reason || '—'}
                                            {r.status === 'rejected' && r.rejection_reason && (
                                                <p className="text-red-500">Rejected: {r.rejection_reason}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{r.requested_by_name ?? '—'}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{r.payment_status}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${refundTone[r.status] ?? ''}`}>{r.status}</span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(r.requested_at ?? r.created_at)}</td>
                                        <td className="px-4 py-3">
                                            {r.status === 'pending' && (
                                                <div className="flex gap-1.5">
                                                    <button onClick={() => setRefundPrompt({ r, action: 'approve' })}
                                                        title="Approve & pay same-method"
                                                        className="rounded p-1 text-green-600 hover:bg-green-50"><CheckCircle className="h-4 w-4" /></button>
                                                    <button onClick={() => setRefundPrompt({ r, action: 'reject' })}
                                                        title="Reject"
                                                        className="rounded p-1 text-red-600 hover:bg-red-50"><XCircle className="h-4 w-4" /></button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <PromptDialog
                    open={promptFor !== null}
                    title={promptFor?.status === 'closed' ? 'Close dispute' : 'Resolve dispute'}
                    description={promptFor ? `“${promptFor.d.subject}” — resolution notes (optional).` : undefined}
                    placeholder="Resolution notes..."
                    confirmLabel={promptFor?.status === 'closed' ? 'Close' : 'Resolve'}
                    onSubmit={submitNotes}
                    onCancel={() => setPromptFor(null)}
                />

                <PromptDialog
                    open={returnPrompt !== null}
                    title={returnPrompt?.action === 'approve' ? 'Approve & refund return' : 'Reject return request'}
                    description={returnPrompt
                        ? `“${returnPrompt.r.reason}” — ${returnPrompt.action === 'approve' ? 'refund amount (blank = full payment)' : 'rejection reason (optional)'}`
                        : undefined}
                    placeholder={returnPrompt?.action === 'approve' ? 'e.g. 20.00' : 'Reason...'}
                    confirmLabel={returnPrompt?.action === 'approve' ? 'Approve & refund' : 'Reject'}
                    onSubmit={(v) => {
                        const target = returnPrompt;
                        setReturnPrompt(null);
                        if (target) void decideReturn(target.r, target.action, v);
                    }}
                    onCancel={() => setReturnPrompt(null)}
                />

                <PromptDialog
                    open={refundPrompt !== null}
                    title={refundPrompt?.action === 'approve' ? 'Approve refund request' : 'Reject refund request'}
                    description={refundPrompt
                        ? `“${refundPrompt.r.reason ?? 'No reason given'}” — ${refundPrompt.action === 'approve' ? 'pays back via the original method. Amount override (blank = full):' : 'rejection reason (optional):'}`
                        : undefined}
                    placeholder={refundPrompt?.action === 'approve' ? 'e.g. 20.00' : 'Reason...'}
                    confirmLabel={refundPrompt?.action === 'approve' ? 'Approve & pay' : 'Reject'}
                    onSubmit={(v) => {
                        const target = refundPrompt;
                        setRefundPrompt(null);
                        if (target) void decideRefund(target.r, target.action, v);
                    }}
                    onCancel={() => setRefundPrompt(null)}
                />

                {meta && meta.total > meta.per_page && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Page {meta.page} · {meta.total} records</span>
                        <div className="flex gap-2">
                            <button disabled={meta.page <= 1} onClick={() => setPage(page - 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Previous</button>
                            <button disabled={meta.page * meta.per_page >= meta.total} onClick={() => setPage(page + 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Next</button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
