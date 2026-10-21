import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { api, errorMessage, rows } from '@/lib/api';
import { useAuthPermissions } from '@/lib/permissions';
import { formatCurrency, formatDate } from '@/lib/utils';
import DataTable from '@/components/shared/DataTable';
import SearchInput from '@/components/shared/SearchInput';
import { useConfirm } from '@/lib/confirm';
import { Archive, Eye, EyeOff, Radio, Tag } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Deal {
    id: string;
    name: string;
    description?: string | null;
    price?: string | null;
    is_available: boolean;
    status: string;
    created_at: string;
    category?: { name?: string | null } | null;
    owner?: { name?: string | null; email?: string | null } | null;
    vendor?: { store_name?: string | null } | null;
}

interface DealStats {
    total: number;
    live: number;
    hidden: number;
    categories: number;
}

interface Meta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

const STATUSES = ['all', 'draft', 'submitted', 'approved', 'published', 'rejected', 'suspended', 'archived'];

export default function AdminDeals() {
    const ask = useConfirm();
    const { can } = useAuthPermissions();
    const canManage = can('deals.deals.manage');

    const [items, setItems] = useState<Deal[]>([]);
    const [stats, setStats] = useState<DealStats | null>(null);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState('all');
    const [visibility, setVisibility] = useState('all');
    const [page, setPage] = useState(1);
    const [reloadToken, setReloadToken] = useState(0);
    const [rejecting, setRejecting] = useState<Deal | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const loadStats = useCallback(() => {
        api.get<{ data: DealStats }>('/api/admin/deals/overview')
            .then((res) => setStats(res.data))
            .catch(() => undefined);
    }, []);

    useEffect(() => { loadStats(); }, [loadStats]);

    useEffect(() => {
        const params = new URLSearchParams({ page: String(page), per_page: '20' });
        if (query) params.set('search', query);
        if (status !== 'all') params.set('status', status);
        if (visibility !== 'all') params.set('visibility', visibility);

        setLoading(true);
        api.get<{ data: Deal[]; meta: Meta }>(`/api/admin/deals?${params.toString()}`)
            .then((res) => { setItems(rows<Deal>(res)); setMeta(res.meta); })
            .catch((e) => { setItems([]); toast.error(errorMessage(e, 'Failed to load deals')); })
            .finally(() => setLoading(false));
    }, [query, status, visibility, page, reloadToken]);

    const refresh = () => {
        setReloadToken((value) => value + 1);
        loadStats();
    };

    const moderate = async (deal: Deal, action: string, note?: string) => {
        setBusy(deal.id);
        try {
            const res = await api.post<{ message?: string }>(`/api/admin/deals/${deal.id}/moderate`, { action, note });
            toast.success(res.message ?? 'Deal updated');
            setRejecting(null);
            setRejectionReason('');
            refresh();
        } catch (e) {
            toast.error(errorMessage(e, 'Deal update failed'));
        } finally {
            setBusy(null);
        }
    };

    const setVisibilityState = async (deal: Deal, live: boolean) => {
        if (!live) {
            const ok = await ask({
                title: 'Remove this deal from the storefront?',
                description: 'The listing stays published, but shoppers can no longer see it until it is listed again.',
                confirmLabel: 'Remove from storefront',
                danger: true,
            });
            if (!ok) return;
        }

        setBusy(deal.id);
        try {
            await api.post(`/api/admin/deals/${deal.id}/visibility`, { is_available: live });
            setItems((prev) => prev.map((d) => d.id === deal.id ? { ...d, is_available: live } : d));
            loadStats();
            toast.success(live ? 'Deal is live' : 'Deal removed from the storefront');
        } catch (e) {
            toast.error(errorMessage(e, 'Visibility update failed'));
        } finally {
            setBusy(null);
        }
    };

    const confirmAction = async (deal: Deal, action: string, label: string, danger = false) => {
        const ok = await ask({
            title: `${label}?`,
            description: `This updates “${deal.name}” in the deals catalogue.`,
            confirmLabel: label,
            danger,
        });
        if (ok) await moderate(deal, action);
    };

    return (
        <AdminLayout title="Deals">
            <Head title="Deals" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                        <Tag className="h-6 w-6" /> Deals
                    </h1>
                    <div className="flex items-center gap-3">
                        {meta && <span className="text-sm text-gray-500">{meta.total} listings</span>}
                        <a href="/deals" className="text-sm font-medium text-blue-600 hover:underline">Open storefront deals</a>
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total listings</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{stats?.total ?? '—'}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                        <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-gray-500"><Eye className="h-3.5 w-3.5" /> Live</p>
                        <p className="mt-1 text-2xl font-bold text-emerald-600">{stats?.live ?? '—'}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                        <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-gray-500"><EyeOff className="h-3.5 w-3.5" /> Hidden</p>
                        <p className="mt-1 text-2xl font-bold text-amber-600">{stats?.hidden ?? '—'}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                        <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-gray-500"><Radio className="h-3.5 w-3.5" /> Categories</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{stats?.categories ?? '—'}</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search deal name or description" />
                    <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
                        {STATUSES.map((s) => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>)}
                    </select>
                    <select value={visibility} onChange={(e) => { setVisibility(e.target.value); setPage(1); }}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
                        <option value="all">All visibility</option>
                        <option value="live">Live</option>
                        <option value="hidden">Hidden</option>
                    </select>
                </div>

                <DataTable
                    columns={[
                        {
                            key: 'deal', header: 'Deal',
                            render: (d: Deal) => (
                                <>
                                    <p className="font-medium text-gray-900 dark:text-white">{d.name}</p>
                                    <p className="text-xs text-gray-500">{d.vendor?.store_name ?? d.owner?.name ?? 'No owner'}</p>
                                </>
                            ),
                        },
                        { key: 'category', header: 'Category', render: (d: Deal) => <span className="text-sm">{d.category?.name ?? '—'}</span> },
                        { key: 'price', header: 'Price', render: (d: Deal) => <span className="font-semibold">{d.price != null ? formatCurrency(Number(d.price)) : '—'}</span> },
                        {
                            key: 'status', header: 'Status',
                            render: (d: Deal) => {
                                const tone = d.status === 'published'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : ['submitted', 'approved'].includes(d.status)
                                        ? 'bg-blue-100 text-blue-800'
                                        : ['rejected', 'suspended'].includes(d.status)
                                            ? 'bg-amber-100 text-amber-800'
                                            : 'bg-gray-100 text-gray-600';
                                return <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${tone}`}>{d.status}</span>;
                            },
                        },
                        {
                            key: 'visibility', header: 'Storefront',
                            render: (d: Deal) => d.status === 'published' && d.is_available
                                ? <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><Eye className="h-3.5 w-3.5" /> Live</span>
                                : <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500"><EyeOff className="h-3.5 w-3.5" /> Hidden</span>,
                        },
                        { key: 'created', header: 'Added', render: (d: Deal) => <span className="text-xs text-gray-500">{formatDate(d.created_at)}</span> },
                        {
                            key: 'actions', header: 'Actions',
                            render: (d: Deal) => {
                                if (!canManage) return <span className="text-xs text-gray-400">View only</span>;
                                return (
                                    <div className="flex flex-wrap gap-1.5">
                                        {d.status === 'submitted' && (
                                            <button disabled={busy === d.id} onClick={() => void confirmAction(d, 'approve', 'Approve deal')}
                                                className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40">Approve</button>
                                        )}
                                        {d.status === 'approved' && (
                                            <button disabled={busy === d.id} onClick={() => void confirmAction(d, 'publish', 'Publish deal')}
                                                className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-40">Publish</button>
                                        )}
                                        {d.status === 'published' && (
                                            <button disabled={busy === d.id} onClick={() => void setVisibilityState(d, !d.is_available)}
                                                className={`rounded-lg px-2.5 py-1 text-xs font-medium ${d.is_available ? 'border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300' : 'bg-emerald-600 text-white'}`}>
                                                {d.is_available ? 'Unlist' : 'List live'}
                                            </button>
                                        )}
                                        {['submitted', 'approved'].includes(d.status) && (
                                            <button disabled={busy === d.id} onClick={() => { setRejecting(d); setRejectionReason(''); }}
                                                className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30">Reject</button>
                                        )}
                                        {d.status === 'published' && (
                                            <button disabled={busy === d.id} onClick={() => void confirmAction(d, 'suspend', 'Suspend deal', true)}
                                                className="rounded-lg border border-amber-200 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:hover:bg-amber-950/30">Suspend</button>
                                        )}
                                        {['suspended', 'archived', 'rejected'].includes(d.status) && (
                                            <button disabled={busy === d.id} onClick={() => void confirmAction(d, 'restore', 'Restore to review')}
                                                className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 dark:border-gray-600 dark:text-gray-300">Restore</button>
                                        )}
                                        {d.status !== 'archived' && (
                                            <button disabled={busy === d.id} onClick={() => void confirmAction(d, 'archive', 'Archive deal', true)}
                                                className="rounded-lg border border-gray-300 px-2 py-1 text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700" title="Archive">
                                                <Archive className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                );
                            },
                        },
                    ]}
                    data={items}
                    loading={loading}
                    emptyTitle="No deals found"
                    emptyDescription="Published need listings are the storefront deals."
                />

                {meta && meta.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Page {meta.current_page} of {meta.last_page} · {meta.total} deals</span>
                        <div className="flex gap-2">
                            <button disabled={meta.current_page <= 1} onClick={() => setPage(page - 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Previous</button>
                            <button disabled={meta.current_page >= meta.last_page} onClick={() => setPage(page + 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Next</button>
                        </div>
                    </div>
                )}
            </div>

            {rejecting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl dark:bg-gray-800" role="dialog" aria-modal="true">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Reject deal</h2>
                        <p className="mt-1 text-sm text-gray-500">“{rejecting.name}” will be hidden and the owner will be notified.</p>
                        <label className="mt-4 block text-sm font-medium text-gray-700 dark:text-gray-200">Reason</label>
                        <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={4}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            placeholder="Explain what needs to change" />
                        <div className="mt-4 flex justify-end gap-2">
                            <button onClick={() => setRejecting(null)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600">Cancel</button>
                            <button disabled={!rejectionReason.trim() || busy === rejecting.id}
                                onClick={() => void moderate(rejecting, 'reject', rejectionReason.trim())}
                                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40">
                                Reject deal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
