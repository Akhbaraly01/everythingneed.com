import { statusTone } from '@/lib/lifecycle';
import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { api, errorMessage, rows } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import ConfirmDialog, { PromptDialog } from '@/components/shared/Ui';
import DataTable from '@/components/shared/DataTable';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuthPermissions } from '@/lib/permissions';

/** Real kyc_verifications row + requester (AdminKycController::index). */
interface KycRow {
    id: string;
    status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'requires_action';
    document_type?: string | null;
    document_number?: string | null;
    full_name?: string | null;
    attempts?: number;
    verified_at?: string | null;
    rejection_reason?: string | null;
    submitted_at?: string | null;
    reviewed_at?: string | null;
    created_at: string;
    user_name?: string | null;
    user_email?: string | null;
}

interface Meta {
    page: number;
    per_page: number;
    total: number;
}

const STATUS_TABS = ['all', 'pending', 'submitted', 'requires_action', 'approved', 'rejected'] as const;
type StatusTab = (typeof STATUS_TABS)[number];

export default function AdminKyc() {
    const { can } = useAuthPermissions();
    const canReview = can('kyc.applications.review');
    const [items, setItems] = useState<KycRow[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<StatusTab>('all');
    const [page, setPage] = useState(1);
    const [approveFor, setApproveFor] = useState<KycRow | null>(null);
    const [rejectFor, setRejectFor] = useState<KycRow | null>(null);
    const [requestFor, setRequestFor] = useState<KycRow | null>(null);

    const load = () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        params.set('status', status);
        params.set('page', String(page));
        api.get<{ data: KycRow[]; meta: Meta }>(`/api/admin/kyc?${params}`)
            .then((res) => {
                setItems(rows<KycRow>(res));
                setMeta(res.meta);
            })
            .catch((e) => {
                setItems([]);
                toast.error(errorMessage(e, 'Failed to load KYC queue'));
            })
            .finally(() => setLoading(false));
    };

    // Reloads on tab/page changes only; the search box submits via searchNow().
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(load, [status, page]);


    const searchNow = (e: FormEvent) => {
        e.preventDefault();
        setPage(1);
        load();
    };

    const review = async (row: KycRow, newStatus: 'approved' | 'rejected' | 'requires_action', rejectionReason: string | null = null) => {
        try {
            await api.post(`/api/kyc/${row.id}/review`, {
                status: newStatus,
                rejection_reason: rejectionReason,
            });
            setItems(items.map((x) => (x.id === row.id ? { ...x, status: newStatus, rejection_reason: rejectionReason } : x)));
            toast.success(`KYC ${newStatus}.`);
        } catch (e) {
            toast.error(errorMessage(e, 'Review failed'));
        }
    };

    const confirmApprove = (row: KycRow) => {
        setApproveFor(null);
        void review(row, 'approved');
    };

    const submitRejection = (reason: string) => {
        const target = rejectFor;
        setRejectFor(null);
        if (target) void review(target, 'rejected', reason || 'No reason provided');
    };

    const submitChangeRequest = (reason: string) => {
        const target = requestFor;
        setRequestFor(null);
        if (target && reason.trim()) void review(target, 'requires_action', reason);
    };

    return (
        <AdminLayout title="KYC Review">
            <Head title="KYC Review" />

            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">KYC Review Queue</h1>

                <div className="flex flex-wrap items-center gap-2">
                    {STATUS_TABS.map((t) => (
                        <button key={t} onClick={() => { setStatus(t); setPage(1); }}
                            className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${
                                status === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                            {t}
                        </button>
                    ))}
                </div>

                <form onSubmit={searchNow} className="flex gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email or document number..."
                            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm dark:border-gray-600 dark:bg-gray-700" />
                    </div>
                    <button type="submit" className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 dark:bg-gray-600">Search</button>
                </form>

                <DataTable
                    columns={[
                        {
                            key: 'user', header: 'User', accessor: 'user_name', sortable: true,
                            render: (row) => (
                                <>
                                    <div className="font-medium text-gray-900 dark:text-white">{row.user_name ?? '—'}</div>
                                    <div className="text-xs text-gray-500">{row.user_email ?? '—'}</div>
                                    {row.full_name && <div className="text-xs text-gray-500">{row.full_name}</div>}
                                </>
                            ),
                        },
                        {
                            key: 'document', header: 'Document',
                            render: (row) => (
                                <>
                                    <div className="capitalize text-xs text-gray-500">{row.document_type ?? '—'}</div>
                                    <div className="text-xs text-gray-500">{row.document_number ?? '—'}</div>
                                    <div className="mt-1 flex gap-2">
                                        <a href={`/api/kyc/${row.id}/documents/front`} target="_blank" rel="noreferrer" className="text-blue-600 underline">Front</a>
                                        <a href={`/api/kyc/${row.id}/documents/back`} target="_blank" rel="noreferrer" className="text-blue-600 underline">Back</a>
                                    </div>
                                </>
                            ),
                        },
                        {
                            key: 'status', header: 'Status', accessor: 'status', sortable: true,
                            render: (row) => (
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusTone(row.status)}`}>
                                    {row.status}
                                </span>
                            ),
                        },
                        {
                            key: 'submitted', header: 'Submitted', accessor: 'submitted_at', sortable: true,
                            render: (row) => (
                                <span className="text-xs text-gray-500">{row.submitted_at ? formatDateTime(row.submitted_at) : formatDateTime(row.created_at)}</span>
                            ),
                        },
                        {
                            key: 'reason', header: 'Rejection Reason',
                            render: (row) => <span className="text-xs text-gray-500">{row.rejection_reason || '—'}</span>,
                        },
                        {
                            key: 'actions', header: 'Actions',
                            render: (row) => {
                                if (!canReview) {
                                    return <span className="text-xs text-gray-400">View only</span>;
                                }

                                return (
                                    (row.status === 'pending' || row.status === 'submitted' || row.status === 'requires_action') ? (
                                        <div className="flex flex-wrap gap-2">
                                            <button onClick={() => setApproveFor(row)}
                                                className="flex items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-green-500">
                                                <CheckCircle className="h-3 w-3" /> Approve
                                            </button>
                                            <button onClick={() => setRejectFor(row)}
                                                className="flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-500">
                                                <XCircle className="h-3 w-3" /> Reject
                                            </button>
                                            <button onClick={() => setRequestFor(row)}
                                                className="flex items-center gap-1 rounded-lg bg-orange-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-orange-400">
                                                Request changes
                                            </button>
                                        </div>
                                    ) : <span className="text-xs text-gray-400">Reviewed</span>
                                );
                            },
                        },
                    ]}
                    data={items}
                    loading={loading}
                    emptyTitle="No KYC submissions"
                    emptyDescription="Nothing matches this filter."
                />

                <ConfirmDialog
                    open={approveFor !== null}
                    title="Approve KYC?"
                    description={approveFor ? `Approve identity verification for ${approveFor.user_name ?? approveFor.user_email ?? 'this user'}?` : undefined}
                    confirmLabel="Approve"
                    onConfirm={() => approveFor && confirmApprove(approveFor)}
                    onCancel={() => setApproveFor(null)}
                />

                <PromptDialog
                    open={rejectFor !== null}
                    title="Reject KYC"
                    description={rejectFor ? `Rejection reason for ${rejectFor.user_name ?? rejectFor.user_email ?? 'this user'} (max 500 chars).` : undefined}
                    placeholder="Why is this verification rejected?"
                    confirmLabel="Reject"
                    danger
                    onSubmit={submitRejection}
                    onCancel={() => setRejectFor(null)}
                />

                <PromptDialog
                    open={requestFor !== null}
                    title="Request changes"
                    description={requestFor ? `Tell ${requestFor.user_name ?? requestFor.user_email ?? 'this user'} exactly what to fix. They can resubmit afterwards.` : undefined}
                    placeholder="What does the user need to fix?"
                    confirmLabel="Send request"
                    onSubmit={submitChangeRequest}
                    onCancel={() => setRequestFor(null)}
                />

                {meta && (meta.total > meta.per_page) && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Page {meta.page} · {meta.total} submissions</span>
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
