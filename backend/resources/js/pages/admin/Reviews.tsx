import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { api, errorMessage, rows } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import ConfirmDialog from '@/components/shared/Ui';
import DataTable from '@/components/shared/DataTable';
import { useConfirm } from '@/lib/confirm';
import { CheckCircle2, EyeOff, Flag, Star, Trash2, ShieldAlert, Undo2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

/** Real reviews row (ReviewModerationController::index - sees every status). */
interface Review {
    id: string;
    reviewable_type: string;
    reviewable_id: string;
    rating: number;
    title?: string | null;
    comment?: string | null;
    is_verified_purchase?: boolean;
    status?: string;
    moderated_at?: string | null;
    created_at: string;
    user?: { id: string; name: string; email: string } | null;
}

interface Meta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

/** Report queue row (ReviewModerationController::reports). */
interface ReviewReportRow {
    id: string;
    review_id: string;
    reason: string;
    status: 'open' | 'reviewed' | 'dismissed';
    created_at: string;
    review?: {
        id: string;
        reviewable_type?: string;
        rating: number;
        title?: string | null;
        comment?: string | null;
        status?: string;
        user?: { id: string; name: string } | null;
    } | null;
    reporter?: { id: string; name: string } | null;
}

const TYPES = ['all', 'product', 'vendor', 'doctor', 'hotel', 'restaurant', 'course', 'property', 'expert'];
const STATUSES = ['all', 'approved', 'hidden', 'rejected'];
const REPORT_STATUSES = ['open', 'reviewed', 'dismissed', 'all'];

const STATUS_STYLES: Record<string, string> = {
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    hidden: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    pending: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
};

const REPORT_STATUS_STYLES: Record<string, string> = {
    open: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    reviewed: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    dismissed: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

export default function AdminReviews() {
    const ask = useConfirm();
    const [view, setView] = useState<'reviews' | 'reports'>('reviews');
    const [reviews, setReviews] = useState<Review[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [type, setType] = useState('all');
    const [status, setStatus] = useState('all');
    const [page, setPage] = useState(1);
    const [deleteFor, setDeleteFor] = useState<Review | null>(null);
    const [busy, setBusy] = useState(false);

    const [reports, setReports] = useState<ReviewReportRow[]>([]);
    const [reportMeta, setReportMeta] = useState<Meta | null>(null);
    const [reportStatus, setReportStatus] = useState('open');
    const [reportPage, setReportPage] = useState(1);
    const [reportLoading, setReportLoading] = useState(false);
    const [reportBusy, setReportBusy] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        const qs = new URLSearchParams({ page: String(page), per_page: '15' });
        // Expert reviews live in their own table - same console gate, own endpoint.
        const endpoint = type === 'expert' ? '/api/admin/expert-reviews' : '/api/admin/reviews';
        if (type !== 'all' && type !== 'expert') qs.set('reviewable_type', type);
        if (status !== 'all' && type !== 'expert') qs.set('status', status);
        api.get<{ data: Review[]; meta: Meta }>(`${endpoint}?${qs}`)
            .then((res) => {
                const list = rows<Review & { user_name?: string }>(res).map((r) =>
                    type === 'expert'
                        ? {
                            ...r,
                            reviewable_type: 'expert',
                            status: 'approved',
                            user: r.user ?? (r.user_name ? { id: '', name: r.user_name, email: '' } : null),
                        }
                        : r,
                );
                setReviews(list);
                setMeta(res.meta);
            })
            .catch((e) => { setReviews([]); toast.error(errorMessage(e, 'Failed to load reviews')); })
            .finally(() => setLoading(false));
    }, [type, status, page]);

    useEffect(() => {
        if (view !== 'reports') return;
        setReportLoading(true);
        const qs = new URLSearchParams({ page: String(reportPage), per_page: '15' });
        if (reportStatus !== 'all') qs.set('status', reportStatus);
        api.get<{ data: ReviewReportRow[]; meta: Meta }>(`/api/admin/reviews/reports?${qs}`)
            .then((res) => {
                setReports(rows<ReviewReportRow>(res));
                setReportMeta(res.meta);
            })
            .catch((e) => {
                setReports([]);
                toast.error(errorMessage(e, 'Failed to load review reports'));
            })
            .finally(() => setReportLoading(false));
    }, [view, reportStatus, reportPage]);

    /** Idempotent moderation transition (L-B.5) - hidden rows can come back. */
    const moderate = async (r: Review, next: 'approved' | 'hidden' | 'rejected') => {
        setBusy(true);
        try {
            const res = await api.post<{ data: Review }>(`/api/admin/reviews/${r.id}/status`, { status: next });
            setReviews(reviews.map((x) => (x.id === r.id ? { ...x, ...res.data } : x)));
            toast.success(`Review ${next}.`);
        } catch (e) {
            toast.error(errorMessage(e, 'Moderation failed'));
        } finally {
            setBusy(false);
        }
    };

    const remove = async (r: Review) => {
        setBusy(true);
        try {
            // Expert reviews live in their own table with their own endpoint.
            const url = r.reviewable_type === 'expert'
                ? `/api/admin/expert-reviews/${r.id}`
                : `/api/admin/reviews/${r.id}`;
            await api.del(url);
            setReviews(reviews.filter((x) => x.id !== r.id));
            toast.success('Review deleted.');
        } catch (e) {
            toast.error(errorMessage(e, 'Delete failed'));
        } finally {
            setBusy(false);
            setDeleteFor(null);
        }
    };

    /** Close a report queue case: dismiss keeps the review, uphold hides it. */
    const decideReport = async (r: ReviewReportRow, decision: 'dismiss' | 'uphold') => {
        const ok = await ask({
            title: decision === 'uphold' ? 'Uphold report and hide review?' : 'Dismiss this report?',
            description: decision === 'uphold'
                ? 'The review is hidden immediately and the report is closed.'
                : 'The report is closed and the review stays visible.',
            confirmLabel: decision === 'uphold' ? 'Uphold & hide' : 'Dismiss',
            danger: decision === 'uphold',
        });
        if (!ok) return;

        setReportBusy(r.id);
        try {
            const res = await api.post<{ data: ReviewReportRow }>(
                `/api/admin/reviews/reports/${r.id}/decide`,
                { decision },
            );
            toast.success(decision === 'uphold' ? 'Report upheld; review hidden.' : 'Report dismissed.');
            if (reportStatus === 'open') {
                setReports((prev) => prev.filter((x) => x.id !== r.id));
                setReportMeta((prev) => prev ? { ...prev, total: Math.max(0, prev.total - 1) } : prev);
            } else {
                setReports((prev) => prev.map((x) => x.id === r.id ? { ...x, ...res.data } : x));
            }
        } catch (e) {
            toast.error(errorMessage(e, 'Report decision failed'));
        } finally {
            setReportBusy(null);
        }
    };

    return (
        <AdminLayout title="Reviews Moderation">
            <Head title="Reviews Moderation" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reviews Moderation</h1>
                    <span className="text-sm text-gray-500">
                        {view === 'reviews'
                            ? (meta ? `${meta.total} reviews` : '')
                            : (reportMeta ? `${reportMeta.total} reports` : '')}
                    </span>
                </div>

                <div className="flex gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" role="tablist" aria-label="Reviews console sections">
                    <button
                        role="tab"
                        aria-selected={view === 'reviews'}
                        onClick={() => setView('reviews')}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium ${view === 'reviews' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200'}`}
                    >
                        Reviews
                    </button>
                    <button
                        role="tab"
                        aria-selected={view === 'reports'}
                        onClick={() => setView('reports')}
                        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium ${view === 'reports' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200'}`}
                    >
                        <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                        Report queue
                    </button>
                </div>

                {view === 'reviews' && (
                    <>
                <div className="flex flex-wrap gap-2">
                    {TYPES.map((t) => (
                        <button key={t} onClick={() => { setType(t); setPage(1); }}
                            className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${type === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}>
                            {t}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase text-gray-500">Status</span>
                    {STATUSES.map((s) => (
                        <button key={s} onClick={() => { setStatus(s); setPage(1); }}
                            className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${status === s ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}>
                            {s}
                        </button>
                    ))}
                </div>

                <DataTable
                    columns={[
                        {
                            key: 'reviewer', header: 'Reviewer',
                            render: (r) => (
                                <>
                                    <p className="font-medium text-gray-900 dark:text-white">{r.user?.name ?? '—'}</p>
                                    <p className="text-xs text-gray-500">{r.user?.email}</p>
                                </>
                            ),
                        },
                        {
                            key: 'target', header: 'Target', accessor: 'reviewable_type', sortable: true,
                            render: (r) => (
                                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs capitalize text-gray-700 dark:bg-gray-700 dark:text-gray-300">{r.reviewable_type}</span>
                            ),
                        },
                        {
                            key: 'rating', header: 'Rating', accessor: 'rating', sortable: true,
                            render: (r) => (
                                <span className="flex items-center gap-0.5 text-amber-500">
                                    {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                                </span>
                            ),
                        },
                        {
                            key: 'comment', header: 'Comment',
                            render: (r) => (
                                <>
                                    {r.title && <span className="block font-semibold text-gray-900 dark:text-white">{r.title}</span>}
                                    <span className="text-xs text-gray-600 dark:text-gray-300">{r.comment || '—'}</span>
                                </>
                            ),
                        },
                        {
                            key: 'verified', header: 'Verified',
                            render: (r) => (r.is_verified_purchase
                                ? <ShieldAlert className="h-4 w-4 text-green-600" />
                                : <span className="text-gray-400">—</span>),
                        },
                        {
                            key: 'status', header: 'Status', accessor: 'status', sortable: true,
                            render: (r) => (
                                <span className={`rounded px-1.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[r.status ?? 'approved'] ?? ''}`}>
                                    {r.status ?? 'approved'}
                                </span>
                            ),
                        },
                        {
                            key: 'date', header: 'Date', accessor: 'created_at', sortable: true,
                            render: (r) => <span className="text-xs text-gray-500">{formatDateTime(r.created_at)}</span>,
                        },
                        {
                            key: 'actions', header: 'Actions',
                            render: (r) => (
                                <div className="flex items-center gap-1">
                                    {r.reviewable_type !== 'expert' && r.status !== 'hidden' && r.status !== 'rejected' && (
                                        <button onClick={() => moderate(r, 'hidden')} title="Hide review"
                                            className="rounded p-1 text-amber-600 hover:bg-amber-50"><EyeOff className="h-4 w-4" /></button>
                                    )}
                                    {r.reviewable_type !== 'expert' && (r.status === 'hidden' || r.status === 'rejected') && (
                                        <button onClick={() => moderate(r, 'approved')} title="Approve review"
                                            className="rounded p-1 text-green-600 hover:bg-green-50"><Undo2 className="h-4 w-4" /></button>
                                    )}
                                    <button onClick={() => setDeleteFor(r)} title="Delete review"
                                        className="rounded p-1 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            ),
                        },
                    ]}
                    data={reviews}
                    loading={loading}
                    emptyTitle="No reviews found"
                />

                <ConfirmDialog
                    open={deleteFor !== null}
                    title="Delete review?"
                    description={deleteFor ? `Delete this ${deleteFor.rating}-star review by ${deleteFor.user?.name ?? 'user'}? This is permanent for the reviewer.` : undefined}
                    confirmLabel="Delete"
                    danger
                    busy={busy}
                    onConfirm={() => deleteFor && remove(deleteFor)}
                    onCancel={() => setDeleteFor(null)}
                />

                {meta && meta.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Page {meta.current_page} of {meta.last_page}</span>
                        <div className="flex gap-2">
                            <button disabled={meta.current_page <= 1} onClick={() => setPage(page - 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Previous</button>
                            <button disabled={meta.current_page >= meta.last_page} onClick={() => setPage(page + 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Next</button>
                        </div>
                    </div>
                )}
                    </>
                )}

                {view === 'reports' && (
                    <>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold uppercase text-gray-500">Status</span>
                            {REPORT_STATUSES.map((s) => (
                                <button key={s} onClick={() => { setReportStatus(s); setReportPage(1); }}
                                    className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${reportStatus === s ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}>
                                    {s}
                                </button>
                            ))}
                        </div>

                        <DataTable
                            columns={[
                                {
                                    key: 'reporter', header: 'Reporter',
                                    render: (r) => (
                                        <>
                                            <p className="font-medium text-gray-900 dark:text-white">{r.reporter?.name ?? 'Unknown'}</p>
                                            <p className="text-xs text-gray-500">{formatDateTime(r.created_at)}</p>
                                        </>
                                    ),
                                },
                                {
                                    key: 'review', header: 'Reported review',
                                    render: (r) => (
                                        <>
                                            <span className="flex items-center gap-0.5 text-amber-500">
                                                {Array.from({ length: r.review?.rating ?? 0 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                                            </span>
                                            <span className="block text-xs text-gray-600 dark:text-gray-300">
                                                {r.review?.comment || r.review?.title || 'Review no longer available'}
                                            </span>
                                            {r.review?.reviewable_type && (
                                                <span className="mt-1 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[11px] capitalize text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                                    {r.review.reviewable_type}
                                                </span>
                                            )}
                                        </>
                                    ),
                                },
                                {
                                    key: 'reason', header: 'Reason',
                                    render: (r) => <span className="text-xs text-gray-600 dark:text-gray-300">{r.reason}</span>,
                                },
                                {
                                    key: 'status', header: 'Status', accessor: 'status', sortable: true,
                                    render: (r) => (
                                        <span className={`rounded px-1.5 py-0.5 text-xs font-medium capitalize ${REPORT_STATUS_STYLES[r.status] ?? ''}`}>
                                            {r.status}
                                        </span>
                                    ),
                                },
                                {
                                    key: 'actions', header: 'Actions',
                                    render: (r) => r.status === 'open' ? (
                                        <div className="flex items-center gap-2">
                                            <button
                                                disabled={reportBusy === r.id}
                                                onClick={() => void decideReport(r, 'dismiss')}
                                                className="rounded-lg border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                                            >
                                                Dismiss
                                            </button>
                                            <button
                                                disabled={reportBusy === r.id}
                                                onClick={() => void decideReport(r, 'uphold')}
                                                className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-40"
                                            >
                                                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                                                Uphold &amp; hide
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                            <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                                            Closed
                                        </span>
                                    ),
                                },
                            ]}
                            data={reports}
                            loading={reportLoading}
                            emptyTitle="No review reports"
                            emptyDescription={reportStatus === 'open' ? 'No open reports need a decision.' : `No ${reportStatus === 'all' ? '' : reportStatus + ' '}reports.`}
                        />

                        {reportMeta && reportMeta.last_page > 1 && (
                            <div className="flex items-center justify-between text-sm text-gray-500">
                                <span>Page {reportMeta.current_page} of {reportMeta.last_page}</span>
                                <div className="flex gap-2">
                                    <button disabled={reportMeta.current_page <= 1} onClick={() => setReportPage(reportPage - 1)}
                                        className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Previous</button>
                                    <button disabled={reportMeta.current_page >= reportMeta.last_page} onClick={() => setReportPage(reportPage + 1)}
                                        className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Next</button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
