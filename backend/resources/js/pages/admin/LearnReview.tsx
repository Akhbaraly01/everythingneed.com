import AdminLayout from '@/layouts/AdminLayout';
import ConfirmDialog, { PromptDialog } from '@/components/shared/Ui';
import DataTable, { type Column } from '@/components/shared/DataTable';
import { statusTone } from '@/lib/lifecycle';
import { api, errorMessage, rows } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { Head, usePage } from '@inertiajs/react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Search, ShieldAlert, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

/** Review-queue row (LearnModerationController::queue). */
interface QueuePost {
    id: string;
    title: string;
    content: string;
    category?: string | null;
    status: string;
    sensitive_topic?: boolean;
    is_pinned?: boolean;
    submitted_at?: string | null;
    created_at: string;
    appeal_reason?: string | null;
    rejection_reason?: string | null;
    user?: { id: string; name: string };
    assignee?: { id: string; name: string } | null;
    reviewer?: { id: string; name: string } | null;
}

interface QueueMeta {
    current_page: number;
    last_page: number;
    total: number;
}

interface Counts {
    [status: string]: number;
}

interface ReportRow {
    id: string;
    reason: string;
    details?: string | null;
    status: string;
    created_at: string;
    user?: { id: string; name: string } | null;
    post?: { id: string; title: string; status: string; user?: { name: string } } | null;
}

const STATUS_TABS = [
    'queue',
    'pending',
    'under_review',
    'needs_information',
    'approved',
    'hidden',
    'rejected',
    'removed',
    'all',
] as const;
type StatusTab = (typeof STATUS_TABS)[number];

type AssigneeFilter = 'all' | 'me' | 'unassigned';

const REVIEW_ROLES = ['super_admin', 'administrator', 'learning_admin', 'learning_reviewer', 'moderator'];
const SENIOR_ROLES = ['super_admin', 'administrator', 'learning_admin'];

/**
 * Content review console (Learn 2.0): queue with tab counts, atomic claim,
 * approve/reject/needs-info/hide/restore/remove/pin plus the open report
 * inbox. Every action mirrors a server-enforced rule - the client only
 * hides what the tier cannot do, the API still refuses it.
 */
export default function AdminLearnReview() {
    const { auth } = usePage().props as unknown as { auth: { id?: string; roles?: string[] } | null };
    const roles = auth?.roles ?? [];
    const isSenior = SENIOR_ROLES.some((r) => roles.includes(r));
    const isReviewer = REVIEW_ROLES.some((r) => roles.includes(r));

    const [view, setView] = useState<'queue' | 'reports'>('queue');
    const [status, setStatus] = useState<StatusTab>('queue');
    const [assignee, setAssignee] = useState<AssigneeFilter>('all');
    const [sort, setSort] = useState<'oldest' | 'newest'>('oldest');
    const [search, setSearch] = useState('');
    const [q, setQ] = useState('');
    const [page, setPage] = useState(1);

    const [items, setItems] = useState<QueuePost[]>([]);
    const [meta, setMeta] = useState<QueueMeta | null>(null);
    const [counts, setCounts] = useState<Counts>({});
    const [loading, setLoading] = useState(true);

    const [reportStatus, setReportStatus] = useState<'open' | 'resolved' | 'dismissed' | 'all'>('open');
    const [reports, setReports] = useState<ReportRow[]>([]);
    const [reportsMeta, setReportsMeta] = useState<QueueMeta | null>(null);
    const [reportsLoading, setReportsLoading] = useState(true);
    const [reportsPage, setReportsPage] = useState(1);

    const [busyId, setBusyId] = useState<string | null>(null);
    const [approveFor, setApproveFor] = useState<QueuePost | null>(null);
    const [rejectFor, setRejectFor] = useState<QueuePost | null>(null);
    const [needsInfoFor, setNeedsInfoFor] = useState<QueuePost | null>(null);
    const [hideFor, setHideFor] = useState<QueuePost | null>(null);
    const [removeFor, setRemoveFor] = useState<QueuePost | null>(null);

    const loadQueue = useCallback(() => {
        setLoading(true);
        const params = new URLSearchParams();
        params.set('status', status);
        params.set('assignee', assignee);
        params.set('sort', sort);
        params.set('page', String(page));
        if (q) params.set('q', q);

        api.get<{ data: QueuePost[]; meta: QueueMeta; counts: Counts }>(`/api/learn/posts-queue?${params}`)
            .then((res) => {
                setItems(rows<QueuePost>(res));
                setMeta(res.meta);
                setCounts(res.counts ?? {});
            })
            .catch((e) => {
                setItems([]);
                setMeta(null);
                toast.error(errorMessage(e, 'Failed to load the review queue'));
            })
            .finally(() => setLoading(false));
    }, [status, assignee, sort, page, q]);

    const loadReports = useCallback(() => {
        setReportsLoading(true);
        const params = new URLSearchParams();
        params.set('status', reportStatus);
        params.set('page', String(reportsPage));
        api.get<{ data: ReportRow[]; meta: QueueMeta }>(`/api/learn/reports?${params}`)
            .then((res) => {
                setReports(rows<ReportRow>(res));
                setReportsMeta(res.meta);
            })
            .catch((e) => {
                setReports([]);
                setReportsMeta(null);
                toast.error(errorMessage(e, 'Failed to load reports'));
            })
            .finally(() => setReportsLoading(false));
    }, [reportStatus, reportsPage]);

    useEffect(() => {
        if (view === 'queue') loadQueue();
        else loadReports();
    }, [view, loadQueue, loadReports]);

    const searchNow = (e: FormEvent) => {
        e.preventDefault();
        setPage(1);
        setQ(search.trim());
    };

    /** Shared wrapper: runs one moderation call, then refreshes the list. */
    const act = async (
        post: QueuePost,
        path: string,
        label: string,
        body?: Record<string, unknown>,
        successMessage?: string,
    ) => {
        setBusyId(post.id);
        try {
            await api.post(`/api/learn/posts/${post.id}/${path}`, body ?? {});
            toast.success(successMessage ?? `${label} done.`);
            loadQueue();
        } catch (e) {
            toast.error(errorMessage(e, `Could not ${label.toLowerCase()}`));
        } finally {
            setBusyId(null);
        }
    };

    const claim = (post: QueuePost) => void act(post, 'claim', 'Claim', undefined, 'Claimed. This post is now assigned to you.');
    const approve = (post: QueuePost) => {
        setApproveFor(null);
        void act(post, 'approve', 'Approve', undefined, 'Post approved and published.');
    };
    const reject = (reason: string) => {
        const target = rejectFor;
        setRejectFor(null);
        if (target) void act(target, 'reject', 'Reject', { reason: reason || undefined }, 'Post rejected.');
    };
    const needsInfo = (note: string) => {
        const target = needsInfoFor;
        setNeedsInfoFor(null);
        if (target) void act(target, 'needs-info', 'Request changes', { note: note || undefined }, 'Author asked for changes.');
    };
    const hide = (reason: string) => {
        const target = hideFor;
        setHideFor(null);
        if (target) void act(target, 'hide', 'Hide', { reason: reason || undefined }, 'Post hidden from the feed.');
    };
    const restore = (post: QueuePost) => void act(post, 'restore', 'Restore', undefined, 'Post restored.');
    const remove = () => {
        const target = removeFor;
        setRemoveFor(null);
        if (target) void act(target, 'remove', 'Remove', undefined, 'Post removed.');
    };
    const togglePin = (post: QueuePost) =>
        void act(post, 'pin', 'Pin', undefined, post.is_pinned ? 'Post unpinned.' : 'Post pinned to the top of the feed.');

    const handleReport = async (report: ReportRow, action: 'resolve' | 'dismiss') => {
        setBusyId(report.id);
        try {
            await api.post(`/api/learn/reports/${report.id}/resolve`, { action });
            toast.success(action === 'resolve' ? 'Report resolved.' : 'Report dismissed.');
            loadReports();
        } catch (e) {
            toast.error(errorMessage(e, 'Could not update report'));
        } finally {
            setBusyId(null);
        }
    };

    const canModerate = (post: QueuePost): boolean => isReviewer && post.status !== 'removed' && post.status !== 'draft';

    const rowActions = (post: QueuePost) => {
        const queued = ['pending', 'under_review', 'needs_information'].includes(post.status);
        const mine = post.assignee?.id === auth?.id;
        const blocked = busyId === post.id;

        return (
            <div className="flex flex-wrap gap-1.5">
                {queued && canModerate(post) && !post.assignee && (
                    <button
                        type="button"
                        disabled={blocked}
                        onClick={() => claim(post)}
                        className="flex items-center gap-1 rounded-md bg-slate-700 px-2 py-1 text-xs font-semibold text-white hover:bg-slate-600 disabled:opacity-50"
                    >
                        <UserCheck className="h-3 w-3" /> Claim
                    </button>
                )}
                {queued && canModerate(post) && mine && (
                    <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        Yours
                    </span>
                )}
                {queued && canModerate(post) && (
                    <>
                        <button
                            type="button"
                            disabled={blocked}
                            onClick={() => setApproveFor(post)}
                            className="rounded-md bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-50"
                        >
                            Approve
                        </button>
                        <button
                            type="button"
                            disabled={blocked}
                            onClick={() => setRejectFor(post)}
                            className="rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50"
                        >
                            Reject
                        </button>
                        <button
                            type="button"
                            disabled={blocked}
                            onClick={() => setNeedsInfoFor(post)}
                            className="rounded-md bg-orange-500 px-2 py-1 text-xs font-semibold text-white hover:bg-orange-400 disabled:opacity-50"
                        >
                            Request changes
                        </button>
                    </>
                )}
                {post.status === 'approved' && canModerate(post) && (
                    <>
                        <button
                            type="button"
                            disabled={blocked}
                            onClick={() => setHideFor(post)}
                            className="rounded-md bg-amber-600 px-2 py-1 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
                        >
                            Hide
                        </button>
                        {isSenior && (
                            <button
                                type="button"
                                disabled={blocked}
                                onClick={() => togglePin(post)}
                                className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
                            >
                                {post.is_pinned ? 'Unpin' : 'Pin'}
                            </button>
                        )}
                        <button
                            type="button"
                            disabled={blocked}
                            onClick={() => setRemoveFor(post)}
                            className="rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900"
                        >
                            Remove
                        </button>
                    </>
                )}
                {post.status === 'hidden' && canModerate(post) && (
                    <>
                        <button
                            type="button"
                            disabled={blocked}
                            onClick={() => restore(post)}
                            className="rounded-md bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-50"
                        >
                            Restore
                        </button>
                        <button
                            type="button"
                            disabled={blocked}
                            onClick={() => setRemoveFor(post)}
                            className="rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900"
                        >
                            Remove
                        </button>
                    </>
                )}
                {post.status === 'rejected' && canModerate(post) && (
                    <button
                        type="button"
                        disabled={blocked}
                        onClick={() => setApproveFor(post)}
                        className="rounded-md bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-50"
                    >
                        Approve
                    </button>
                )}
                {!canModerate(post) && <span className="text-xs text-gray-400">No actions</span>}
            </div>
        );
    };

    const queueColumns: Column<QueuePost>[] = [
        {
            key: 'post',
            header: 'Post',
            render: (row) => (
                <>
                    <p className="font-medium text-gray-900 dark:text-white">
                        {row.title}
                        {row.is_pinned ? <span className="ml-1 text-xs text-indigo-500">· pinned</span> : null}
                    </p>
                    <p className="text-xs text-gray-500">
                        {row.user?.name ?? 'Learner'}
                        {' · '}
                        {row.category ?? 'general'}
                        {row.submitted_at ? ` · ${formatDateTime(row.submitted_at)}` : ''}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-gray-300">{row.content}</p>
                    {row.sensitive_topic && (
                        <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                            <ShieldAlert className="h-3 w-3" /> Health / finance / legal - senior approval required
                        </p>
                    )}
                    {row.appeal_reason && (
                        <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-400">Appeal: {row.appeal_reason}</p>
                    )}
                    {row.rejection_reason && row.status === 'rejected' && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">Rejected: {row.rejection_reason}</p>
                    )}
                </>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            accessor: 'status',
            sortable: true,
            render: (row) => (
                <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusTone(row.status)}`}>
                    {row.status.replace(/_/g, ' ')}
                </span>
            ),
        },
        {
            key: 'assignee',
            header: 'Assigned to',
            render: (row) => (
                <span className="text-xs text-gray-600 dark:text-gray-300">{row.assignee?.name ?? <span className="text-gray-400">Unassigned</span>}</span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (row) => rowActions(row),
        },
    ];

    const reportColumns: Column<ReportRow>[] = [
        {
            key: 'reported',
            header: 'Reported post',
            render: (row) => (
                <>
                    <p className="font-medium text-gray-900 dark:text-white">{row.post?.title ?? 'Post deleted'}</p>
                    <p className="text-xs text-gray-500">by {row.post?.user?.name ?? 'unknown'}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-gray-300">{row.details || row.reason}</p>
                </>
            ),
        },
        {
            key: 'reason',
            header: 'Reason',
            accessor: 'reason',
            sortable: true,
            render: (row) => <span className="capitalize text-xs">{row.reason}</span>,
        },
        {
            key: 'reporter',
            header: 'Reported by',
            render: (row) => <span className="text-xs text-gray-600 dark:text-gray-300">{row.user?.name ?? '—'}</span>,
        },
        {
            key: 'when',
            header: 'Received',
            accessor: 'created_at',
            sortable: true,
            render: (row) => <span className="text-xs text-gray-500">{formatDateTime(row.created_at)}</span>,
        },
        {
            key: 'status',
            header: 'Status',
            accessor: 'status',
            render: (row) => (
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusTone(row.status)}`}>
                    {row.status}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (row) =>
                row.status === 'open' && isReviewer ? (
                    <div className="flex flex-wrap gap-1.5">
                        <button
                            type="button"
                            disabled={busyId === row.id}
                            onClick={() => void handleReport(row, 'resolve')}
                            className="rounded-md bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-50"
                        >
                            Resolve
                        </button>
                        <button
                            type="button"
                            disabled={busyId === row.id}
                            onClick={() => void handleReport(row, 'dismiss')}
                            className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
                        >
                            Dismiss
                        </button>
                    </div>
                ) : (
                    <span className="text-xs text-gray-400">Closed</span>
                ),
        },
    ];

    const countLabel = (tab: StatusTab) => {
        if (tab === 'queue') return (counts.pending ?? 0) + (counts.under_review ?? 0) + (counts.needs_information ?? 0);
        if (tab === 'all') return Object.values(counts).reduce((a, b) => a + b, 0);
        return counts[tab] ?? 0;
    };

    return (
        <AdminLayout title="Content Review">
            <Head title="Content Review" />

            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Knowledge Feed Review</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            {isSenior
                                ? 'Senior reviewer: you can approve sensitive topics, pin and reassign.'
                                : 'Reviewer: queue, claim and decide. Sensitive topics need a senior reviewer.'}
                        </p>
                    </div>
                    <div className="flex rounded-lg border border-gray-200 p-1 dark:border-gray-700">
                        {(['queue', 'reports'] as const).map((v) => (
                            <button
                                key={v}
                                type="button"
                                onClick={() => setView(v)}
                                className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize ${
                                    view === v ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-900 dark:text-gray-300'
                                }`}
                            >
                                {v === 'queue' ? 'Queue' : 'Reports'}
                            </button>
                        ))}
                    </div>
                </div>

                {view === 'queue' && (
                    <>
                        <div className="flex flex-wrap gap-2">
                            {STATUS_TABS.map((t) => {
                                const label = t === 'queue' ? 'Queue' : t.replace(/_/g, ' ');
                                const badge = countLabel(t);
                                return (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => {
                                            setStatus(t);
                                            setPage(1);
                                        }}
                                        className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${
                                            status === t
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        {label}
                                        {typeof badge === 'number' && badge > 0 ? ` (${badge})` : ''}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <form onSubmit={searchNow} className="flex gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search title or content..."
                                        aria-label="Search queue"
                                        className="w-64 rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm dark:border-gray-600 dark:bg-gray-700"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 dark:bg-gray-600"
                                >
                                    Search
                                </button>
                            </form>
                            <select
                                value={assignee}
                                onChange={(e) => {
                                    setAssignee(e.target.value as AssigneeFilter);
                                    setPage(1);
                                }}
                                aria-label="Assignee filter"
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                            >
                                <option value="all">All assignments</option>
                                <option value="unassigned">Unassigned</option>
                                <option value="me">Assigned to me</option>
                            </select>
                            <select
                                value={sort}
                                onChange={(e) => {
                                    setSort(e.target.value as 'oldest' | 'newest');
                                    setPage(1);
                                }}
                                aria-label="Sort order"
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                            >
                                <option value="oldest">Oldest first (SLA)</option>
                                <option value="newest">Newest first</option>
                            </select>
                        </div>

                        <DataTable
                            columns={queueColumns}
                            data={items}
                            loading={loading}
                            emptyTitle="Queue is empty"
                            emptyDescription="Nothing matches this filter. New submissions appear here automatically."
                        />

                        {meta && meta.last_page > 1 && (
                            <div className="flex items-center justify-between text-sm text-gray-500">
                                <span>
                                    Page {meta.current_page} of {meta.last_page} · {meta.total} posts
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        disabled={meta.current_page <= 1}
                                        onClick={() => setPage(page - 1)}
                                        className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        disabled={meta.current_page >= meta.last_page}
                                        onClick={() => setPage(page + 1)}
                                        className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {view === 'reports' && (
                    <>
                        <div className="flex flex-wrap gap-2">
                            {(['open', 'resolved', 'dismissed', 'all'] as const).map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => {
                                        setReportStatus(s);
                                        setReportsPage(1);
                                    }}
                                    className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${
                                        reportStatus === s
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>

                        <DataTable
                            columns={reportColumns}
                            data={reports}
                            loading={reportsLoading}
                            emptyTitle="No reports"
                            emptyDescription="Nothing reported with this status."
                        />

                        {reportsMeta && reportsMeta.last_page > 1 && (
                            <div className="flex items-center justify-between text-sm text-gray-500">
                                <span>
                                    Page {reportsMeta.current_page} of {reportsMeta.last_page} · {reportsMeta.total} reports
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        disabled={reportsMeta.current_page <= 1}
                                        onClick={() => setReportsPage(reportsPage - 1)}
                                        className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        disabled={reportsMeta.current_page >= reportsMeta.last_page}
                                        onClick={() => setReportsPage(reportsPage + 1)}
                                        className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <ConfirmDialog
                open={approveFor !== null}
                title="Approve and publish?"
                description={
                    approveFor
                        ? approveFor.sensitive_topic && !isSenior
                            ? 'This is a health/finance/legal topic and needs a senior reviewer.'
                            : `"${approveFor.title}" will become visible in the public feed.`
                        : undefined
                }
                confirmLabel="Approve"
                busy={busyId !== null}
                onConfirm={() => approveFor && approve(approveFor)}
                onCancel={() => setApproveFor(null)}
            />

            <PromptDialog
                open={rejectFor !== null}
                title="Reject post"
                description={rejectFor ? `Tell ${rejectFor.user?.name ?? 'the author'} why "${rejectFor.title}" cannot be published.` : undefined}
                placeholder="Why is this post rejected?"
                confirmLabel="Reject"
                danger
                busy={busyId !== null}
                onSubmit={reject}
                onCancel={() => setRejectFor(null)}
            />

            <PromptDialog
                open={needsInfoFor !== null}
                title="Request changes"
                description={
                    needsInfoFor
                        ? `What does ${needsInfoFor.user?.name ?? 'the author'} need to add or fix before this can be published?`
                        : undefined
                }
                placeholder="What needs more information?"
                confirmLabel="Send request"
                busy={busyId !== null}
                onSubmit={needsInfo}
                onCancel={() => setNeedsInfoFor(null)}
            />

            <PromptDialog
                open={hideFor !== null}
                title="Hide from the feed"
                description={hideFor ? `Hide "${hideFor.title}"? The author is notified and you can restore it later.` : undefined}
                placeholder="Reason shown to the author (optional)"
                confirmLabel="Hide"
                danger
                busy={busyId !== null}
                onSubmit={hide}
                onCancel={() => setHideFor(null)}
            />

            <ConfirmDialog
                open={removeFor !== null}
                title="Remove this post?"
                description={removeFor ? `"${removeFor.title}" will be removed and the author notified. This is audited.` : undefined}
                confirmLabel="Remove"
                danger
                busy={busyId !== null}
                onConfirm={remove}
                onCancel={() => setRemoveFor(null)}
            />
        </AdminLayout>
    );
}
