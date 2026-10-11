import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { api, errorMessage, rows } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { PromptDialog } from '@/components/shared/Ui';
import { HeartHandshake, Check, X, Search, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface AidRow {
    id: string;
    title: string;
    description: string;
    category?: string | null;
    goal_amount: number;
    raised_amount: number;
    currency: string;
    status: string;
    rejection_reason?: string | null;
    requester?: { id?: string; name?: string } | null;
    reviewer?: { id?: string; name?: string } | null;
    reviewed_at?: string | null;
    created_at: string;
}

const STATUS_TONE: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    funded: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    closed: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

const STATUSES = ['', 'pending', 'approved', 'rejected', 'funded', 'closed'];

export default function HealthcareAid() {
    const [aids, setAids] = useState<AidRow[]>([]);
    const [status, setStatus] = useState('pending');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState<{ page: number; per_page: number; total: number } | null>(null);
    const [prompt, setPrompt] = useState<{ r: AidRow; action: 'approve' | 'reject' } | null>(null);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({ per_page: '20', page: String(page) });
        if (status) params.set('status', status);
        api.get<{ data: AidRow[]; current_page?: number; per_page?: number; total?: number }>(
            `/api/admin/healthcare/aid?${params.toString()}`
        )
            .then((res) => {
                setAids(rows<AidRow>(res));
                setMeta({
                    page: res.current_page ?? page,
                    per_page: res.per_page ?? 20,
                    total: res.total ?? 0,
                });
            })
            .catch((e) => setError(errorMessage(e, 'Failed to load aid requests')))
            .finally(() => setLoading(false));
    }, [status, page]);

    useEffect(() => {
        load();
    }, [attempt, load]);

    const decide = async (r: AidRow, action: 'approve' | 'reject', reason: string) => {
        const body: Record<string, unknown> = { action };
        if (action === 'reject' && reason.trim()) body.reason = reason.trim();
        try {
            await api.put(`/api/admin/healthcare/aid/${r.id}`, body);
            setAids((prev) => prev.map((x) => (x.id === r.id
                ? { ...x, status: action === 'approve' ? 'approved' : 'rejected', rejection_reason: (body.reason as string) ?? x.rejection_reason }
                : x)));
            toast.success(action === 'approve' ? 'Aid request approved - now public.' : 'Aid request rejected.');
        } catch (e) {
            toast.error(errorMessage(e, 'Decision failed'));
        }
    };

    return (
        <AdminLayout title="Healthcare Aid">
            <Head title="Healthcare Aid" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                        <HeartHandshake className="h-6 w-6 text-indigo-600" /> Healthcare Aid Review
                    </h1>
                    {meta && <span className="text-sm text-gray-500">{meta.total} requests</span>}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={status}
                        onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                        {STATUSES.map((s) => (
                            <option key={s || 'all'} value={s}>
                                {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All statuses'}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={() => setAttempt((n) => n + 1)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        <RotateCcw className="h-4 w-4" /> Refresh
                    </button>
                    <span className="ml-auto inline-flex items-center gap-1 text-xs text-gray-500">
                        <Search className="h-3 w-3" /> Requests are reviewed before they go public.
                    </span>
                </div>

                {loading ? (
                    <p className="text-sm text-gray-500">Loading aid requests...</p>
                ) : error ? (
                    <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                        {error}{' '}
                        <button onClick={() => setAttempt((n) => n + 1)} className="font-semibold underline">
                            Retry
                        </button>
                    </div>
                ) : aids.length === 0 ? (
                    <div className="rounded-lg bg-white p-10 text-center shadow dark:bg-gray-800">
                        <HeartHandshake className="mx-auto h-10 w-10 text-gray-300" />
                        <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No aid requests</p>
                        <p className="mt-1 text-xs text-gray-500">
                            {status ? `No “${status}” requests right now.` : 'Requests filed by the community will appear here.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="min-w-full divide-y text-left text-sm dark:divide-gray-700">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-900/50">
                                <tr>
                                    <th className="px-4 py-3">Title</th>
                                    <th className="px-4 py-3">Requester</th>
                                    <th className="px-4 py-3">Goal</th>
                                    <th className="px-4 py-3">Raised</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Filed</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {aids.map((r) => (
                                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900 dark:text-white">{r.title}</p>
                                            {r.category && (
                                                <p className="text-xs capitalize text-gray-500">{r.category}</p>
                                            )}
                                            {r.status === 'rejected' && r.rejection_reason && (
                                                <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
                                                    Reason: {r.rejection_reason}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                            {r.requester?.name ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                            {formatCurrency(Number(r.goal_amount))}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                            {formatCurrency(Number(r.raised_amount))}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_TONE[r.status] ?? STATUS_TONE.closed}`}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(r.created_at)}</td>
                                        <td className="px-4 py-3">
                                            {r.status === 'pending' ? (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setPrompt({ r, action: 'approve' })}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-green-500"
                                                    >
                                                        <Check className="h-3 w-3" /> Approve
                                                    </button>
                                                    <button
                                                        onClick={() => setPrompt({ r, action: 'reject' })}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-500"
                                                    >
                                                        <X className="h-3 w-3" /> Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">
                                                    {r.reviewer?.name ? `by ${r.reviewer.name}` : '—'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {meta && meta.total > meta.per_page && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Page {meta.page} · {meta.total} requests</span>
                        <div className="flex gap-2">
                            <button
                                disabled={meta.page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600"
                            >
                                Previous
                            </button>
                            <button
                                disabled={meta.page * meta.per_page >= meta.total}
                                onClick={() => setPage((p) => p + 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                <PromptDialog
                    open={prompt !== null}
                    title={prompt?.action === 'approve' ? 'Approve aid request' : 'Reject aid request'}
                    description={prompt
                        ? prompt.action === 'approve'
                            ? `“${prompt.r.title}” — approving makes it publicly visible for donations.`
                            : `“${prompt.r.title}” — rejection reason (shown to the requester):`
                        : undefined}
                    placeholder={prompt?.action === 'approve' ? undefined : 'Reason...'}
                    confirmLabel={prompt?.action === 'approve' ? 'Approve' : 'Reject'}
                    danger={prompt?.action === 'reject'}
                    onSubmit={(v) => {
                        const target = prompt;
                        setPrompt(null);
                        if (target) void decide(target.r, target.action, v);
                    }}
                    onCancel={() => setPrompt(null)}
                />
            </div>
        </AdminLayout>
    );
}
