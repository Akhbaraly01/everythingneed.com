import { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { api, ApiError, errorMessage } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { PromptDialog } from '@/components/shared/Ui';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, ShieldCheck, PackageSearch, History, Plus, X } from 'lucide-react';

interface PendingProduct {
    id: string;
    name: string;
    category: string;
    price: string | number;
    stock_quantity: number;
    created_at: string;
    vendor_name?: string | null;
}

interface Decision {
    id: string;
    product_name: string;
    reason?: string | null;
    created_at: string;
}

interface ApprovalStepRow {
    id: string;
    step_order: number;
    approver_role: string | null;
    status: string;
    decided_by?: string | null;
    decided_at?: string | null;
    comment?: string | null;
}

interface ApprovalRequestRow {
    id: string;
    type: string;
    title: string;
    status: 'pending' | 'approved' | 'rejected';
    current_step: number;
    subject_type?: string | null;
    subject_id?: string | null;
    decided_at?: string | null;
    created_at: string;
    steps: ApprovalStepRow[];
    requester?: { name: string } | null;
}

interface Props {
    pending: PendingProduct[];
    recentDecisions: Decision[];
    requests: ApprovalRequestRow[];
}

const labelize = (role: string): string =>
    role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const stepTone = (status: string): string => {
    if (status === 'approved') return 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200';
    if (status === 'rejected') return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-200';
    if (status === 'skipped') return 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400';
    return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200';
};

export default function AdminApprovals({ pending, recentDecisions, requests }: Props) {
    const [busyId, setBusyId] = useState<string | null>(null);
    const [rejectFor, setRejectFor] = useState<PendingProduct | null>(null);
    const [tab, setTab] = useState<'queue' | 'requests'>('queue');

    // Requests tab state: pending rows come from the server prop; other
    // filters are fetched through the engine API (native client-fetch style).
    const [rows, setRows] = useState<ApprovalRequestRow[]>(requests);
    const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
    const [roles, setRoles] = useState<string[]>([]);
    // The roles directory requires can:manageUsers - marketplace_admin,
    // platform_ops and moderators reach this page but not that endpoint.
    // The builder still works via "Any approver"; explain instead of a
    // silently empty dropdown.
    const [rolesBlocked, setRolesBlocked] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [newType, setNewType] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [newSteps, setNewSteps] = useState<(string | null)[]>([]);
    const [stepRole, setStepRole] = useState('');
    const [rejectRequest, setRejectRequest] = useState<ApprovalRequestRow | null>(null);

    useEffect(() => { setRows(requests); }, [requests]);

    useEffect(() => {
        if (tab !== 'requests') return;
        if (filter === 'pending') return;
        api.get<{ data: ApprovalRequestRow[] }>(
            `/api/admin/approval-requests?per_page=50${filter === 'all' ? '' : `&status=${filter}`}`,
        )
            .then((res) => setRows(res.data ?? []))
            .catch((e) => toast.error(errorMessage(e, 'Failed to load requests')));
    }, [tab, filter]);

    useEffect(() => {
        if (tab !== 'requests' || roles.length > 0 || rolesBlocked) return;
        api.get<{ data: { role: string }[] }>('/api/admin/roles')
            .then((res) => setRoles((res.data ?? []).map((r) => r.role)))
            .catch((e) => {
                setRoles([]);
                if (e instanceof ApiError && e.status === 403) setRolesBlocked(true);
            });
    }, [tab, roles.length, rolesBlocked]);

    const decide = async (id: string, action: 'approve' | 'reject', reason: string | null = null) => {
        setBusyId(id);
        try {
            await api.post(`/api/admin/products/${id}/${action}`,
                action === 'reject' ? { reason: reason || null } : {});
            toast.success(action === 'approve' ? 'Approved and published' : 'Rejected');
            router.reload({ only: ['pending', 'recentDecisions'] as never });
        } catch (err) {
            toast.error(errorMessage(err, 'Action failed'));
        } finally {
            setBusyId(null);
        }
    };

    const submitRejection = (reason: string) => {
        const target = rejectFor;
        setRejectFor(null);
        if (target) void decide(target.id, 'reject', reason || null);
    };

    const decideRequest = async (id: string, approve: boolean, comment: string | null = null) => {
        setBusyId(id);
        try {
            await api.post(`/api/admin/approval-requests/${id}/${approve ? 'approve' : 'reject'}`, { comment });
            toast.success(approve ? 'Step approved.' : 'Request rejected.');
            if (filter === 'pending') router.reload({ only: ['requests'] as never });
            else setRows((prev) => prev.filter((r) => r.id !== id));
        } catch (err) {
            toast.error(errorMessage(err, 'Action failed'));
        } finally {
            setBusyId(null);
        }
    };

    const submitRequestRejection = (comment: string) => {
        const target = rejectRequest;
        setRejectRequest(null);
        if (target) void decideRequest(target.id, false, comment || null);
    };

    const createRequest = async () => {
        if (!newType.trim() || !newTitle.trim() || newSteps.length === 0) return;
        setBusyId('new');
        try {
            await api.post('/api/admin/approval-requests', {
                type: newType.trim(),
                title: newTitle.trim(),
                approver_roles: newSteps,
            });
            toast.success('Approval request created.');
            setCreateOpen(false);
            setNewType('');
            setNewTitle('');
            setNewSteps([]);
            setFilter('pending');
            router.reload({ only: ['requests'] as never });
        } catch (err) {
            toast.error(errorMessage(err, 'Could not create request'));
        } finally {
            setBusyId(null);
        }
    };

    const addStep = () => {
        setNewSteps([...newSteps, stepRole === '__any__' ? null : stepRole]);
        setStepRole('');
    };

    return (
        <AdminLayout title="Admin · Approvals">
            <Head title="Product approvals" />
            <div className="mx-auto max-w-5xl px-4 py-8">
                <div className="mb-6 flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100">
                        <ShieldCheck className="h-6 w-6 text-amber-600" />
                    </span>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Approvals</h1>
                        <p className="text-sm text-gray-500">Product submissions and multi-step approval requests</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6 flex gap-2" role="tablist" aria-label="Approval views">
                    <button
                        role="tab"
                        aria-selected={tab === 'queue'}
                        onClick={() => setTab('queue')}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === 'queue' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'}`}
                    >
                        Product queue ({pending.length})
                    </button>
                    <button
                        role="tab"
                        aria-selected={tab === 'requests'}
                        onClick={() => setTab('requests')}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === 'requests' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'}`}
                    >
                        Requests ({rows.filter((r) => r.status === 'pending').length})
                    </button>
                </div>

                {tab === 'queue' ? (
                    <>
                        {/* Queue */}
                        {pending.length === 0 ? (
                            <div className="mb-8 rounded-xl border border-dashed border-gray-300 p-14 text-center dark:border-gray-600">
                                <PackageSearch className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                                <p className="font-medium text-gray-900 dark:text-white">Queue is clear</p>
                                <p className="text-sm text-gray-500">New vendor submissions will appear here.</p>
                            </div>
                        ) : (
                            <div className="mb-8 space-y-3">
                                {pending.map((p) => (
                                    <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{p.name}</p>
                                            <p className="mt-0.5 text-xs text-gray-500">
                                                {p.vendor_name ?? 'Unknown vendor'} · {p.category} · stock {p.stock_quantity}
                                            </p>
                                            <p className="text-[11px] text-gray-400">submitted {formatDateTime(p.created_at)}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-bold text-indigo-600">{formatCurrency(Number(p.price))}</span>
                                            <button
                                                disabled={busyId === p.id}
                                                onClick={() => decide(p.id, 'approve')}
                                                className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                            >
                                                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                                            </button>
                                            <button
                                                disabled={busyId === p.id}
                                                onClick={() => setRejectFor(p)}
                                                className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50"
                                            >
                                                <XCircle className="h-3.5 w-3.5" /> Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <PromptDialog
                            open={rejectFor !== null}
                            title={`Reject ${rejectFor?.name ?? 'product'}`}
                            description="The reason is stored in the audit trail (optional)."
                            placeholder="Why is this submission rejected?"
                            confirmLabel="Reject"
                            danger
                            busy={busyId === rejectFor?.id}
                            onSubmit={submitRejection}
                            onCancel={() => setRejectFor(null)}
                        />

                        {/* Recent rejections (audit trail) */}
                        <h2 className="mb-3 flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                            <History className="h-5 w-5" /> Recent rejections
                        </h2>
                        {recentDecisions.length === 0 ? (
                            <p className="rounded-xl bg-gray-50 p-5 text-center text-sm text-gray-400 dark:bg-gray-700/40">No rejections recorded.</p>
                        ) : (
                            <ul className="space-y-2">
                                {recentDecisions.map((d) => (
                                    <li key={d.id} className="rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-800">
                                        <span className="font-medium text-gray-900 dark:text-white">{d.product_name}</span>
                                        {d.reason && <span className="text-gray-500"> — “{d.reason}”</span>}
                                        <span className="ml-2 text-xs text-gray-400">{formatDateTime(d.created_at)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                ) : (
                    <>
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex gap-2" role="group" aria-label="Filter approval requests">
                                {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        aria-pressed={filter === f}
                                        className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'}`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCreateOpen(true)}
                                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                            >
                                <Plus className="h-3.5 w-3.5" /> New request
                            </button>
                        </div>

                        {rows.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-600">
                                <ShieldCheck className="mx-auto mb-3 h-9 w-9 text-gray-300" />
                                <p className="font-medium text-gray-900 dark:text-white">No {filter === 'all' ? '' : filter} approval requests</p>
                                <p className="text-sm text-gray-500">Create a multi-step request to route a decision through approver roles.</p>
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {rows.map((r) => (
                                    <li key={r.id} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{r.title}</p>
                                                <p className="mt-0.5 text-xs text-gray-500">
                                                    <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium dark:bg-gray-700">{r.type}</span>
                                                    {' · '}requested by {r.requester?.name ?? 'system'} · {formatDateTime(r.created_at)}
                                                    {r.status === 'pending' && ` · step ${r.current_step} of ${r.steps.length}`}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${stepTone(r.status === 'pending' ? 'pending' : r.status)}`}>
                                                    {r.status}
                                                </span>
                                                {r.status === 'pending' && (
                                                    <>
                                                        <button
                                                            disabled={busyId === r.id}
                                                            onClick={() => void decideRequest(r.id, true)}
                                                            className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                                        >
                                                            <CheckCircle2 className="h-3.5 w-3.5" /> Approve step
                                                        </button>
                                                        <button
                                                            disabled={busyId === r.id}
                                                            onClick={() => setRejectRequest(r)}
                                                            className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50"
                                                        >
                                                            <XCircle className="h-3.5 w-3.5" /> Reject
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <ol className="mt-3 flex flex-wrap gap-2">
                                            {r.steps.map((s) => (
                                                <li key={s.id} className={`rounded-lg px-2.5 py-1 text-xs ${stepTone(s.status)} ${r.status === 'pending' && s.step_order === r.current_step ? 'ring-1 ring-indigo-400' : ''}`}>
                                                    <span className="font-semibold">{s.step_order}.</span>{' '}
                                                    {s.approver_role ? labelize(s.approver_role) : 'Any approver'}
                                                    {s.status !== 'pending' && ` — ${s.status}`}
                                                    {s.comment && ` · “${s.comment}”`}
                                                </li>
                                            ))}
                                        </ol>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                )}

                {/* Create request dialog */}
                {createOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
                        <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                            <div className="mb-4 flex items-start justify-between">
                                <div>
                                    <h2 className="font-semibold text-gray-900 dark:text-white">New approval request</h2>
                                    <p className="text-xs text-gray-500">Steps decide in order; each step is gated on its approver role.</p>
                                </div>
                                <button onClick={() => setCreateOpen(false)} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label htmlFor="req-type" className="mb-1 block text-xs font-medium text-gray-500">Type (lowercase slug)</label>
                                    <input
                                        id="req-type"
                                        value={newType}
                                        onChange={(e) => setNewType(e.target.value)}
                                        placeholder="e.g. payout.exception"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="req-title" className="mb-1 block text-xs font-medium text-gray-500">Title</label>
                                    <input
                                        id="req-title"
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        placeholder="What needs approval?"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="req-role" className="mb-1 block text-xs font-medium text-gray-500">Add approver step</label>
                                    <div className="flex gap-2">
                                        <select
                                            id="req-role"
                                            value={stepRole}
                                            onChange={(e) => setStepRole(e.target.value)}
                                            className="min-w-0 flex-1 rounded-lg border border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        >
                                            <option value="">Select role…</option>
                                            <option value="__any__">Any approver (no role gate)</option>
                                            {roles.map((r) => (
                                                <option key={r} value={r}>{labelize(r)}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={addStep}
                                            disabled={!stepRole || newSteps.length >= 10}
                                            className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    {rolesBlocked && (
                                        <p className="mt-1 text-xs text-gray-500">
                                            Role directory unavailable for your role — pick “Any approver” or ask an administrator to add steps.
                                        </p>
                                    )}
                                    {newSteps.length > 0 && (
                                        <ol className="mt-2 flex flex-wrap gap-1.5">
                                            {newSteps.map((s, i) => (
                                                <li key={`${i}-${s ?? 'any'}`} className="flex items-center gap-1 rounded-full bg-indigo-50 py-0.5 pl-2.5 pr-1 text-[11px] font-medium text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200">
                                                    {i + 1}. {s ? labelize(s) : 'Any approver'}
                                                    <button
                                                        onClick={() => setNewSteps(newSteps.filter((_, idx) => idx !== i))}
                                                        aria-label={`Remove step ${i + 1}`}
                                                        className="rounded-full p-0.5 hover:bg-indigo-200 disabled:opacity-40"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </li>
                                            ))}
                                        </ol>
                                    )}
                                </div>
                            </div>

                            <div className="mt-5 flex justify-end gap-2">
                                <button onClick={() => setCreateOpen(false)} className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    Cancel
                                </button>
                                <button
                                    onClick={() => void createRequest()}
                                    disabled={!newType.trim() || !newTitle.trim() || newSteps.length === 0 || busyId === 'new'}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {busyId === 'new' ? 'Creating…' : 'Create'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <PromptDialog
                    open={rejectRequest !== null}
                    title={`Reject ${rejectRequest?.title ?? 'request'}`}
                    description="Rejecting ends the request and skips the remaining steps (optional comment)."
                    placeholder="Reason (optional)"
                    confirmLabel="Reject request"
                    danger
                    busy={busyId === rejectRequest?.id}
                    onSubmit={submitRequestRejection}
                    onCancel={() => setRejectRequest(null)}
                />
            </div>
        </AdminLayout>
    );
}
