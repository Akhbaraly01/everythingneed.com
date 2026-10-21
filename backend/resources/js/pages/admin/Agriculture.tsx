import AdminLayout from '@/layouts/AdminLayout';
import { Head, usePage } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import DataTable from '@/components/shared/DataTable';
import SearchInput from '@/components/shared/SearchInput';
import { useConfirm } from '@/lib/confirm';
import { BadgeCheck, CheckCircle2, Leaf, Store, Tractor, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ProductRow {
    id: string;
    name: string;
    category: string;
    price: string;
    currency?: string | null;
    publication_state?: string | null;
    is_active: boolean;
    approved_at?: string | null;
    created_at: string;
    vendor?: { store_name?: string | null } | null;
}

interface FarmerRow {
    id: string;
    store_name: string;
    category: string;
    is_verified: boolean;
    created_at: string;
    user_name?: string | null;
    user_email?: string | null;
    total_products: number;
}

interface WorkerRow {
    id: string;
    headline: string;
    category: string;
    availability: string;
    city?: string | null;
    country?: string | null;
    hourly_rate?: string | null;
    currency?: string | null;
    is_verified: boolean;
    created_at: string;
    user?: { name?: string | null; email?: string | null } | null;
    work_requests_count?: number;
}

interface Stats {
    products_total: number;
    products_pending: number;
    products_published: number;
    farmers_total: number;
    farmers_verified: number;
    workers_total: number;
    workers_verified: number;
}

interface Meta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

type Tab = 'products' | 'farmers' | 'workers';

const card = 'rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800';
const btn = 'rounded-lg px-2.5 py-1 text-xs font-medium disabled:opacity-40';

export default function AdminAgriculture() {
    const ask = useConfirm();
    const roles = (usePage().props.auth as { roles?: string[] } | null)?.roles ?? [];
    const canManageProducts = roles.some((r) => ['super_admin', 'administrator', 'agriculture_admin'].includes(r));
    const canManageFarmers = roles.some((r) => ['super_admin', 'administrator', 'agriculture_admin'].includes(r));
    const canManageWorkers = roles.some((r) => ['super_admin', 'administrator', 'agriculture_admin'].includes(r));

    const [stats, setStats] = useState<Stats | null>(null);
    const [tab, setTab] = useState<Tab>('products');
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState('all');
    const [availability, setAvailability] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<string | null>(null);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [reloadToken, setReloadToken] = useState(0);

    const [products, setProducts] = useState<ProductRow[]>([]);
    const [farmers, setFarmers] = useState<FarmerRow[]>([]);
    const [workers, setWorkers] = useState<WorkerRow[]>([]);

    const [rejecting, setRejecting] = useState<ProductRow | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const loadStats = useCallback(() => {
        api.get<{ data: Stats }>('/api/admin/agriculture/overview')
            .then((res) => setStats(res.data))
            .catch(() => undefined);
    }, []);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    useEffect(() => {
        const params = new URLSearchParams({ page: String(page), per_page: '20' });
        if (query) params.set('search', query);
        if (tab === 'products' && status !== 'all') params.set('status', status);
        if (tab === 'farmers' && status !== 'all') params.set('status', status);
        if (tab === 'workers' && availability) params.set('availability', availability);

        setLoading(true);
        api.get<{ data: ProductRow[] | FarmerRow[] | WorkerRow[]; meta: Meta }>(`/api/admin/agriculture/${tab}?${params.toString()}`)
            .then((res) => {
                setMeta(res.meta);
                if (tab === 'products') setProducts(res.data as ProductRow[]);
                if (tab === 'farmers') setFarmers(res.data as FarmerRow[]);
                if (tab === 'workers') setWorkers(res.data as WorkerRow[]);
            })
            .catch((e) => {
                setProducts([]);
                setFarmers([]);
                setWorkers([]);
                toast.error(errorMessage(e, 'Failed to load agriculture data'));
            })
            .finally(() => setLoading(false));
    }, [tab, query, status, availability, page, reloadToken]);

    const switchTab = (next: Tab) => {
        setTab(next);
        setStatus('all');
        setAvailability('');
        setPage(1);
    };

    const refresh = () => {
        setReloadToken((value) => value + 1);
        loadStats();
    };

    const moderateProduct = async (product: ProductRow, action: 'approve' | 'reject', reason?: string) => {
        setBusy(product.id);
        try {
            await api.post(`/api/admin/agriculture/products/${product.id}/moderate`, { action, reason });
            toast.success(action === 'approve' ? 'Product approved and published' : 'Product rejected');
            setRejecting(null);
            setRejectionReason('');
            refresh();
        } catch (e) {
            toast.error(errorMessage(e, 'Product moderation failed'));
        } finally {
            setBusy(null);
        }
    };

    const moderateFarmer = async (farmer: FarmerRow) => {
        const verify = !farmer.is_verified;
        const ok = await ask({
            title: verify ? 'Verify this farmer?' : 'Remove farmer verification?',
            description: verify
                ? `${farmer.store_name} becomes a verified agriculture vendor.`
                : `${farmer.store_name} will no longer show as verified.`,
            confirmLabel: verify ? 'Verify farmer' : 'Remove verification',
            danger: !verify,
        });
        if (!ok) return;

        setBusy(farmer.id);
        try {
            await api.post(`/api/admin/agriculture/farmers/${farmer.id}/moderate`, { action: verify ? 'verify' : 'unverify' });
            setFarmers((prev) => prev.map((f) => f.id === farmer.id ? { ...f, is_verified: verify } : f));
            loadStats();
            toast.success(verify ? 'Farmer verified' : 'Farmer verification removed');
        } catch (e) {
            toast.error(errorMessage(e, 'Farmer update failed'));
        } finally {
            setBusy(null);
        }
    };

    const moderateWorker = async (worker: WorkerRow) => {
        const verify = !worker.is_verified;
        setBusy(worker.id);
        try {
            await api.post(`/api/admin/agriculture/workers/${worker.id}/moderate`, { action: verify ? 'verify' : 'unverify' });
            setWorkers((prev) => prev.map((w) => w.id === worker.id ? { ...w, is_verified: verify } : w));
            loadStats();
            toast.success(verify ? 'Farm worker verified' : 'Farm worker verification removed');
        } catch (e) {
            toast.error(errorMessage(e, 'Worker update failed'));
        } finally {
            setBusy(null);
        }
    };

    const statusLabel = (p: ProductRow) => {
        if (!p.approved_at) return 'pending';
        return p.publication_state ?? (p.is_active ? 'published' : 'hidden');
    };

    return (
        <AdminLayout title="Agriculture">
            <Head title="Agriculture" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                        <Tractor className="h-6 w-6" /> Agriculture
                    </h1>
                    {meta && <span className="text-sm text-gray-500">{meta.total} {tab}</span>}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className={card}>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Products</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{stats?.products_total ?? '—'}</p>
                        <p className="text-xs text-gray-500">{stats?.products_pending ?? 0} awaiting approval · {stats?.products_published ?? 0} live</p>
                    </div>
                    <div className={card}>
                        <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-gray-500"><Store className="h-3.5 w-3.5" /> Farmers</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{stats?.farmers_total ?? '—'}</p>
                        <p className="text-xs text-gray-500">{stats?.farmers_verified ?? 0} verified</p>
                    </div>
                    <div className={card}>
                        <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-gray-500"><Users className="h-3.5 w-3.5" /> Farm workers</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{stats?.workers_total ?? '—'}</p>
                        <p className="text-xs text-gray-500">{stats?.workers_verified ?? 0} verified</p>
                    </div>
                    <div className={card}>
                        <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-gray-500"><Leaf className="h-3.5 w-3.5" /> Storefront</p>
                        <p className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-200">Live agriculture catalogue</p>
                        <a href="/agriculture" className="text-xs font-medium text-blue-600 hover:underline">Open public page</a>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {([
                        ['products', 'Products', Leaf],
                        ['farmers', 'Farmers', Store],
                        ['workers', 'Farm workers', Users],
                    ] as const).map(([key, label, Icon]) => (
                        <button key={key} onClick={() => switchTab(key)}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${tab === key ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}>
                            <Icon className="h-4 w-4" /> {label}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search agriculture records" />
                    {(tab === 'products' || tab === 'farmers') && (
                        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
                            <option value="all">All statuses</option>
                            {tab === 'products' ? (
                                <>
                                    <option value="pending">Pending</option>
                                    <option value="published">Published</option>
                                    <option value="hidden">Hidden</option>
                                    <option value="archived">Archived</option>
                                </>
                            ) : (
                                <>
                                    <option value="pending">Pending</option>
                                    <option value="verified">Verified</option>
                                </>
                            )}
                        </select>
                    )}
                    {tab === 'workers' && (
                        <select value={availability} onChange={(e) => { setAvailability(e.target.value); setPage(1); }}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
                            <option value="">All availability</option>
                            <option value="available">Available</option>
                            <option value="busy">Busy</option>
                            <option value="unavailable">Unavailable</option>
                        </select>
                    )}
                </div>

                {tab === 'products' && (
                    <DataTable
                        columns={[
                            {
                                key: 'product', header: 'Product',
                                render: (p: ProductRow) => (
                                    <>
                                        <p className="font-medium text-gray-900 dark:text-white">{p.name}</p>
                                        <p className="text-xs text-gray-500">{p.vendor?.store_name ?? 'No vendor'}</p>
                                    </>
                                ),
                            },
                            { key: 'category', header: 'Category', accessor: 'category', sortable: true },
                            {
                                key: 'price', header: 'Price',
                                render: (p: ProductRow) => <span className="font-semibold">{formatCurrency(Number(p.price), p.currency ?? undefined)}</span>,
                            },
                            {
                                key: 'status', header: 'Status',
                                render: (p: ProductRow) => {
                                    const label = statusLabel(p);
                                    const tone = label === 'published'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : label === 'pending'
                                            ? 'bg-amber-100 text-amber-800'
                                            : 'bg-gray-100 text-gray-600';
                                    return <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${tone}`}>{label}</span>;
                                },
                            },
                            {
                                key: 'created', header: 'Added',
                                render: (p: ProductRow) => <span className="text-xs text-gray-500">{formatDate(p.created_at)}</span>,
                            },
                            {
                                key: 'actions', header: 'Actions',
                                render: (p: ProductRow) => {
                                    if (!canManageProducts) return <span className="text-xs text-gray-400">View only</span>;
                                    return (
                                        <div className="flex flex-wrap gap-1.5">
                                            <button disabled={busy === p.id} onClick={() => void moderateProduct(p, 'approve')}
                                                className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`}>
                                                Approve & publish
                                            </button>
                                            <button disabled={busy === p.id} onClick={() => { setRejecting(p); setRejectionReason(''); }}
                                                className={`${btn} border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30`}>
                                                Reject
                                            </button>
                                        </div>
                                    );
                                },
                            },
                        ]}
                        data={products}
                        loading={loading}
                        emptyTitle="No agriculture products"
                        emptyDescription="Products with an agriculture category appear here."
                    />
                )}

                {tab === 'farmers' && (
                    <DataTable
                        columns={[
                            {
                                key: 'farmer', header: 'Farmer',
                                render: (f: FarmerRow) => (
                                    <>
                                        <p className="font-medium text-gray-900 dark:text-white">{f.store_name}</p>
                                        <p className="text-xs text-gray-500">{f.user_name ?? '—'} · {f.user_email}</p>
                                    </>
                                ),
                            },
                            { key: 'category', header: 'Category', accessor: 'category', sortable: true },
                            {
                                key: 'products', header: 'Products',
                                render: (f: FarmerRow) => <span className="text-sm">{f.total_products}</span>,
                            },
                            {
                                key: 'status', header: 'Verification',
                                render: (f: FarmerRow) => (
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${f.is_verified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                        <BadgeCheck className="h-3 w-3" /> {f.is_verified ? 'Verified' : 'Pending'}
                                    </span>
                                ),
                            },
                            {
                                key: 'joined', header: 'Joined',
                                render: (f: FarmerRow) => <span className="text-xs text-gray-500">{formatDate(f.created_at)}</span>,
                            },
                            {
                                key: 'actions', header: 'Actions',
                                render: (f: FarmerRow) => canManageFarmers ? (
                                    <button disabled={busy === f.id} onClick={() => void moderateFarmer(f)}
                                        className={`${btn} ${f.is_verified ? 'border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300' : 'bg-emerald-600 text-white'}`}>
                                        {f.is_verified ? 'Remove verification' : 'Verify farmer'}
                                    </button>
                                ) : <span className="text-xs text-gray-400">View only</span>,
                            },
                        ]}
                        data={farmers}
                        loading={loading}
                        emptyTitle="No agriculture vendors"
                        emptyDescription="Vendors with an agriculture category appear here."
                    />
                )}

                {tab === 'workers' && (
                    <DataTable
                        columns={[
                            {
                                key: 'worker', header: 'Worker',
                                render: (w: WorkerRow) => (
                                    <>
                                        <p className="font-medium text-gray-900 dark:text-white">{w.user?.name ?? '—'}</p>
                                        <p className="text-xs text-gray-500">{w.headline}</p>
                                        <p className="text-xs text-gray-400">{w.user?.email}</p>
                                    </>
                                ),
                            },
                            {
                                key: 'category', header: 'Category',
                                render: (w: WorkerRow) => (
                                    <>
                                        <p className="text-sm">{w.category}</p>
                                        <p className="text-xs text-gray-500">{[w.city, w.country].filter(Boolean).join(', ')}</p>
                                    </>
                                ),
                            },
                            {
                                key: 'rate', header: 'Rate',
                                render: (w: WorkerRow) => <span className="text-sm">{w.hourly_rate ? `${formatCurrency(Number(w.hourly_rate), w.currency ?? undefined)}/hr` : '—'}</span>,
                            },
                            {
                                key: 'availability', header: 'Availability',
                                render: (w: WorkerRow) => <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-700 dark:bg-gray-700 dark:text-gray-300">{w.availability}</span>,
                            },
                            {
                                key: 'status', header: 'Verification',
                                render: (w: WorkerRow) => (
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${w.is_verified ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                                        <CheckCircle2 className="h-3 w-3" /> {w.is_verified ? 'Verified' : 'Unverified'}
                                    </span>
                                ),
                            },
                            {
                                key: 'actions', header: 'Actions',
                                render: (w: WorkerRow) => canManageWorkers ? (
                                    <button disabled={busy === w.id} onClick={() => void moderateWorker(w)}
                                        className={`${btn} ${w.is_verified ? 'border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300' : 'bg-emerald-600 text-white'}`}>
                                        {w.is_verified ? 'Remove verification' : 'Verify worker'}
                                    </button>
                                ) : <span className="text-xs text-gray-400">View only</span>,
                            },
                        ]}
                        data={workers}
                        loading={loading}
                        emptyTitle="No farm workers"
                        emptyDescription="Worker profiles with an agriculture or farming category appear here."
                    />
                )}

                {meta && meta.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Page {meta.current_page} of {meta.last_page} · {meta.total} records</span>
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
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Reject product</h2>
                        <p className="mt-1 text-sm text-gray-500">“{rejecting.name}” will be hidden from the storefront and recorded as rejected.</p>
                        <label className="mt-4 block text-sm font-medium text-gray-700 dark:text-gray-200">Reason</label>
                        <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={4}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            placeholder="Explain what needs to change" />
                        <div className="mt-4 flex justify-end gap-2">
                            <button onClick={() => setRejecting(null)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600">Cancel</button>
                            <button disabled={!rejectionReason.trim() || busy === rejecting.id}
                                onClick={() => void moderateProduct(rejecting, 'reject', rejectionReason.trim())}
                                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40">
                                Reject product
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
