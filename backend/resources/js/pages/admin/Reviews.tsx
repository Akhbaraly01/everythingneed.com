import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { api, errorMessage, rows } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import ConfirmDialog from '@/components/shared/Ui';
import DataTable from '@/components/shared/DataTable';
import { EyeOff, Star, Trash2, ShieldAlert, Undo2 } from 'lucide-react';
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

const TYPES = ['all', 'product', 'vendor', 'doctor', 'hotel', 'restaurant', 'course', 'property'];
const STATUSES = ['all', 'approved', 'hidden', 'rejected'];

const STATUS_STYLES: Record<string, string> = {
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    hidden: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    pending: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
};

export default function AdminReviews() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [type, setType] = useState('all');
    const [status, setStatus] = useState('all');
    const [page, setPage] = useState(1);
    const [deleteFor, setDeleteFor] = useState<Review | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        setLoading(true);
        const qs = new URLSearchParams({ page: String(page), per_page: '15' });
        if (type !== 'all') qs.set('reviewable_type', type);
        if (status !== 'all') qs.set('status', status);
        api.get<{ data: Review[]; meta: Meta }>(`/api/admin/reviews?${qs}`)
            .then((res) => { setReviews(rows<Review>(res)); setMeta(res.meta); })
            .catch((e) => { setReviews([]); toast.error(errorMessage(e, 'Failed to load reviews')); })
            .finally(() => setLoading(false));
    }, [type, status, page]);

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
            await api.del(`/api/admin/reviews/${r.id}`);
            setReviews(reviews.filter((x) => x.id !== r.id));
            toast.success('Review deleted.');
        } catch (e) {
            toast.error(errorMessage(e, 'Delete failed'));
        } finally {
            setBusy(false);
            setDeleteFor(null);
        }
    };

    return (
        <AdminLayout title="Reviews Moderation">
            <Head title="Reviews Moderation" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reviews Moderation</h1>
                    {meta && <span className="text-sm text-gray-500">{meta.total} reviews</span>}
                </div>

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
                                    {r.status !== 'hidden' && r.status !== 'rejected' && (
                                        <button onClick={() => moderate(r, 'hidden')} title="Hide review"
                                            className="rounded p-1 text-amber-600 hover:bg-amber-50"><EyeOff className="h-4 w-4" /></button>
                                    )}
                                    {(r.status === 'hidden' || r.status === 'rejected') && (
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
            </div>
        </AdminLayout>
    );
}
