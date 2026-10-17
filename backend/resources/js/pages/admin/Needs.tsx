import AdminLayout from '@/layouts/AdminLayout';
import { Head, usePage } from '@inertiajs/react';
import { api, errorMessage, rows } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useConfirm } from '@/lib/confirm';
import { toast } from 'sonner';

interface NeedRequest {
    id: string;
    request_number: string;
    title: string;
    status: string;
    budget_max?: number | string | null;
    created_at: string;
    user?: { name?: string | null; email?: string | null } | null;
}

interface NeedOffer {
    id: string;
    price: number | string;
    status: string;
    message?: string | null;
    created_at: string;
    provider?: { name?: string | null } | null;
    request?: { request_number?: string | null; title?: string | null } | null;
}

interface TaskPost {
    id: string;
    title: string;
    status: string;
    budget?: number | string | null;
    applications_count?: number;
    created_at: string;
    owner?: { name?: string | null } | null;
}

interface NeedsDispute {
    id: string;
    subject: string;
    description?: string | null;
    status: string;
    resolution?: string | null;
    need_request_id?: string | null;
    task_id?: string | null;
    created_at: string;
    user?: { name?: string | null; email?: string | null } | null;
    assignee?: { name?: string | null } | null;
}

interface FraudFlag {
    id: string;
    rule: string;
    entity_type: string;
    entity_id: string;
    status: 'open' | 'confirmed' | 'dismissed';
    details?: Record<string, unknown> | null;
    decision_note?: string | null;
    created_at: string;
    user?: { name?: string | null; email?: string | null } | null;
}

interface ProviderProfile {
    id: string;
    display_name: string;
    status: string;
    kyc_state?: string | null;
    review_note?: string | null;
    trial_started_at?: string | null;
    created_at: string;
    user?: { name?: string | null; email?: string | null } | null;
}

interface ServiceListing {
    id: string;
    name: string;
    price?: number | string | null;
    status: string;
    is_available?: boolean | null;
    created_at: string;
    category?: { name?: string | null } | null;
    owner?: { name?: string | null; email?: string | null } | null;
}

interface NeedCategoryRow {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    icon?: string | null;
    color?: string | null;
    sort_order?: number | null;
    parent_id?: string | null;
    is_active?: boolean | null;
    requires_verified_provider?: boolean | null;
    form_schema_version?: number | null;
    items_count?: number;
    children_count?: number;
    parent?: { id: string; name: string; slug: string } | null;
}

interface CostGuideRow {
    id: string;
    slug: string;
    title: string;
    summary: string;
    price_min?: string | null;
    price_max?: string | null;
    price_avg?: string | null;
    currency?: string;
    pricing_unit?: string;
    factors?: { label: string; impact?: string }[] | null;
    faqs?: { question: string; answer: string }[] | null;
    source_note?: string | null;
    status: string;
    created_at: string;
    category?: { id: string; name: string; slug: string } | null;
}

type Tab = 'overview' | 'requests' | 'offers' | 'tasks' | 'disputes' | 'fraud' | 'providers' | 'listings' | 'categories' | 'guides';

const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'requests', label: 'Requests' },
    { key: 'offers', label: 'Offers' },
    { key: 'tasks', label: 'Tasks' },
    { key: 'disputes', label: 'Disputes' },
    { key: 'fraud', label: 'Fraud Flags' },
    { key: 'providers', label: 'Providers' },
    { key: 'listings', label: 'Listings' },
    { key: 'categories', label: 'Categories' },
    { key: 'guides', label: 'Guides' },
];

const tone = (status: string) => {
    if (['open', 'pending', 'published', 'disputed', 'trial'].includes(status)) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    if (['rejected', 'cancelled', 'confirmed', 'failed'].includes(status)) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (['completed', 'resolved', 'accepted', 'paid'].includes(status)) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200';
};

const table = 'w-full text-sm';
const th = 'border-b px-3 py-2 text-left font-medium text-gray-500 dark:border-gray-700';
const td = 'border-b px-3 py-2 dark:border-gray-700';
const btn = 'rounded border px-2 py-1 text-xs hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700';
const btnDanger = 'rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300';
const input = 'rounded border px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white';

export default function AdminNeeds() {
    const { auth } = usePage().props as unknown as { auth: { roles?: string[] } };
    const roles = auth?.roles ?? [];
    const isPrivileged = roles.some((r) => ['super_admin', 'administrator', 'needs_admin', 'platform_ops'].includes(r));
    const ask = useConfirm();

    const [tab, setTab] = useState<Tab>('overview');
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [overview, setOverview] = useState<{
        attention: Record<string, number>;
        requests_by_status: Record<string, number>;
        completed_30d: number;
        cancellations_8w: { week: string; total: number }[];
    } | null>(null);
    const [requests, setRequests] = useState<NeedRequest[]>([]);
    const [offers, setOffers] = useState<NeedOffer[]>([]);
    const [tasks, setTasks] = useState<TaskPost[]>([]);
    const [disputes, setDisputes] = useState<NeedsDispute[]>([]);
    const [flags, setFlags] = useState<FraudFlag[]>([]);
    const [providers, setProviders] = useState<ProviderProfile[]>([]);
    const [listings, setListings] = useState<ServiceListing[]>([]);
    const [categories, setCategories] = useState<NeedCategoryRow[]>([]);
    const [guides, setGuides] = useState<CostGuideRow[]>([]);
    const [note, setNote] = useState('');
    // TODO 8 categories console: inline editor state (schema as JSON text,
    // validated server-side against the allowlisted field vocabulary).
    const [editingCat, setEditingCat] = useState<NeedCategoryRow | null>(null);
    const [catEditorOpen, setCatEditorOpen] = useState(false);
    const [catForm, setCatForm] = useState({ name: '', slug: '', description: '', icon: 'tag', color: '#6366F1', sort_order: '0', parent_id: '', is_active: true, requires_verified_provider: false, form_schema: '' });
    // N-29 cost guides console: inline editor (factors/FAQs as JSON text).
    const [editingGuide, setEditingGuide] = useState<CostGuideRow | null>(null);
    const [guideEditorOpen, setGuideEditorOpen] = useState(false);
    const [guideForm, setGuideForm] = useState({ need_category_id: '', title: '', slug: '', summary: '', price_min: '', price_max: '', price_avg: '', pricing_unit: 'project', status: 'draft', factors: '', faqs: '', source_note: '' });
    const [guideCategories, setGuideCategories] = useState<NeedCategoryRow[]>([]);

    const load = async () => {
        setLoading(true);
        try {
            if (tab === 'overview') {
                const res = await api.get<{ data: typeof overview }>('/api/admin/needs/overview');
                setOverview(res.data ?? null);
                return;
            }
            const status = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
            if (tab === 'requests') {
                const res = await api.get<{ data: NeedRequest[] }>(`/api/admin/needs/requests${status}`);
                setRequests(rows(res));
            } else if (tab === 'offers') {
                const res = await api.get<{ data: NeedOffer[] }>(`/api/admin/needs/offers${status}`);
                setOffers(rows(res));
            } else if (tab === 'tasks') {
                const res = await api.get<{ data: TaskPost[] }>(`/api/admin/needs/tasks${status}`);
                setTasks(rows(res));
            } else if (tab === 'disputes') {
                const res = await api.get<{ data: NeedsDispute[] }>(`/api/admin/needs/disputes${status}`);
                setDisputes(rows(res));
            } else if (tab === 'providers') {
                const res = await api.get<{ data: ProviderProfile[] }>(`/api/admin/needs/providers${status}`);
                setProviders(rows(res));
            } else if (tab === 'listings') {
                const res = await api.get<{ data: ServiceListing[] }>(`/api/admin/needs/listings${status}`);
                setListings(rows(res));
            } else if (tab === 'categories') {
                const res = await api.get<{ data: NeedCategoryRow[] }>('/api/admin/needs/categories');
                setCategories(rows(res));
            } else if (tab === 'guides') {
                const res = await api.get<{ data: CostGuideRow[] }>(`/api/admin/needs/cost-guides${status}`);
                setGuides(rows(res));
                // Editor category picker needs the category list once.
                if (guideCategories.length === 0) {
                    const cats = await api.get<{ data: NeedCategoryRow[] }>('/api/admin/needs/categories');
                    setGuideCategories(rows(cats));
                }
            } else {
                const res = await api.get<{ data: FraudFlag[] }>(`/api/admin/needs/fraud-flags${status}`);
                setFlags(rows(res));
            }
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to load'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setStatusFilter('all');
    }, [tab]);

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, statusFilter]);

    const moderate = async (id: string, action: 'reject' | 'expire' | 'refund') => {
        if (!(await ask({ title: `${action} this request?`, danger: true }))) return;
        try {
            await api.post(`/api/admin/needs/requests/${id}/moderate`, { action, note: note || undefined });
            toast.success(`Request ${action}ed.`);
            setNote('');
            load();
        } catch (e) {
            toast.error(errorMessage(e, `Failed to ${action}`));
        }
    };

    const deleteOffer = async (id: string) => {
        if (!(await ask({ title: 'Delete this offer?', description: 'Accepted offers are protected.', danger: true }))) return;
        try {
            await api.del(`/api/admin/needs/offers/${id}`);
            toast.success('Offer deleted.');
            load();
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to delete offer'));
        }
    };

    const cancelTask = async (id: string) => {
        if (!(await ask({ title: 'Cancel this task?', description: 'The worker will be notified.', danger: true }))) return;
        try {
            await api.post(`/api/admin/needs/tasks/${id}/cancel`);
            toast.success('Task cancelled.');
            load();
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to cancel task'));
        }
    };

    const restoreTask = async (id: string) => {
        try {
            await api.post(`/api/admin/needs/tasks/${id}/restore`);
            toast.success('Task restored to open.');
            load();
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to restore task'));
        }
    };

    const resolveDispute = async (id: string, resolution: string) => {
        if (!(await ask({ title: `Resolve dispute as ${resolution}?`, danger: true }))) return;
        try {
            await api.post(`/api/admin/needs/disputes/${id}/resolve`, { resolution });
            toast.success('Dispute resolved.');
            load();
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to resolve dispute'));
        }
    };

    const decideFlag = async (id: string, decision: 'confirm' | 'dismiss') => {
        try {
            await api.post(`/api/admin/needs/fraud-flags/${id}/decide`, { decision, note: note || undefined });
            toast.success(`Flag ${decision}ed.`);
            setNote('');
            load();
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to decide flag'));
        }
    };

    const runScan = async () => {
        try {
            const res = await api.post<{ data: { scanned: number; flagged: number } }>('/api/admin/needs/fraud-scan');
            toast.success(`Scan complete: ${res.data.flagged} new flags.`);
            load();
        } catch (e) {
            toast.error(errorMessage(e, 'Scan failed'));
        }
    };

    const reviewProvider = async (id: string, decision: 'approve' | 'reject' | 'trial') => {
        if (decision === 'reject' && !note.trim()) {
            toast.error('A rejection reason is required.');
            return;
        }
        if (!(await ask({ title: `${decision === 'trial' ? 'Start trial for' : `${decision}`} this provider?`, danger: decision === 'reject' }))) return;
        try {
            await api.post(`/api/admin/needs/providers/${id}/review`, { decision, note: note || undefined });
            toast.success(decision === 'trial' ? 'Provider moved to trial.' : `Provider ${decision}d.`);
            setNote('');
            load();
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to review provider'));
        }
    };

    const suspendProvider = async (id: string) => {
        if (!note.trim()) {
            toast.error('A suspension reason is required.');
            return;
        }
        if (!(await ask({ title: 'Suspend this provider?', description: 'They will be blocked from offering.', danger: true }))) return;
        try {
            await api.post(`/api/admin/needs/providers/${id}/suspend`, { note });
            toast.success('Provider suspended.');
            setNote('');
            load();
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to suspend provider'));
        }
    };

    const reinstateProvider = async (id: string) => {
        try {
            await api.post(`/api/admin/needs/providers/${id}/reinstate`);
            toast.success('Provider returned to review.');
            load();
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to reinstate provider'));
        }
    };

    const moderateListing = async (id: string, action: 'approve' | 'publish' | 'reject' | 'suspend' | 'archive') => {
        if ((action === 'reject' || action === 'suspend') && !note.trim()) {
            toast.error('A reason is required for this action.');
            return;
        }
        if (!(await ask({ title: `${action} this listing?`, danger: action === 'reject' || action === 'suspend' || action === 'archive' }))) return;
        try {
            await api.post(`/api/admin/needs/listings/${id}/moderate`, { action, note: note || undefined });
            toast.success(`Listing ${action}d.`);
            setNote('');
            load();
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to moderate listing'));
        }
    };

    const openCategoryEditor = (cat?: NeedCategoryRow) => {
        setEditingCat(cat ?? null);
        setCatEditorOpen(true);
        setCatForm({
            name: cat?.name ?? '',
            slug: cat?.slug ?? '',
            description: cat?.description ?? '',
            icon: cat?.icon ?? 'tag',
            color: cat?.color ?? '#6366F1',
            sort_order: String(cat?.sort_order ?? 0),
            parent_id: cat?.parent_id ?? '',
            is_active: cat?.is_active ?? true,
            requires_verified_provider: cat?.requires_verified_provider ?? false,
            form_schema: '',
        });
    };

    const saveCategory = async () => {
        let schema: unknown = undefined;
        if (catForm.form_schema.trim()) {
            try {
                schema = JSON.parse(catForm.form_schema);
            } catch {
                toast.error('Question schema is not valid JSON.');
                return;
            }
        }
        const payload = {
            name: catForm.name,
            slug: catForm.slug,
            description: catForm.description || undefined,
            icon: catForm.icon || undefined,
            color: catForm.color || undefined,
            sort_order: Number(catForm.sort_order) || 0,
            parent_id: catForm.parent_id || null,
            is_active: catForm.is_active,
            requires_verified_provider: catForm.requires_verified_provider,
            ...(schema !== undefined ? { form_schema: schema } : {}),
        };
        try {
            if (editingCat) {
                await api.put(`/api/admin/needs/categories/${editingCat.id}`, payload);
                toast.success('Category updated.');
            } else {
                await api.post('/api/admin/needs/categories', payload);
                toast.success('Category created.');
            }
            setEditingCat(null);
            setCatEditorOpen(false);
            load();
        } catch (e) {
            toast.error(errorMessage(e, 'Could not save category'));
        }
    };

    const deleteCategory = async (id: string) => {
        if (!(await ask({ title: 'Delete this category?', description: 'Categories with requests, listings, or children are protected — deactivate them instead.', danger: true }))) return;
        try {
            await api.del(`/api/admin/needs/categories/${id}`);
            toast.success('Category deleted.');
            load();
        } catch (e) {
            toast.error(errorMessage(e, 'Could not delete category'));
        }
    };

    const toggleCategoryActive = async (cat: NeedCategoryRow) => {
        try {
            await api.put(`/api/admin/needs/categories/${cat.id}`, { is_active: !cat.is_active });
            toast.success(cat.is_active ? 'Category deactivated.' : 'Category activated.');
            load();
        } catch (e) {
            toast.error(errorMessage(e, 'Could not toggle category'));
        }
    };

    const openGuideEditor = (guide?: CostGuideRow) => {
        setEditingGuide(guide ?? null);
        setGuideEditorOpen(true);
        setGuideForm({
            need_category_id: guide?.category?.id ?? '',
            title: guide?.title ?? '',
            slug: guide?.slug ?? '',
            summary: guide?.summary ?? '',
            price_min: guide?.price_min ?? '',
            price_max: guide?.price_max ?? '',
            price_avg: guide?.price_avg ?? '',
            pricing_unit: guide?.pricing_unit ?? 'project',
            status: guide?.status ?? 'draft',
            factors: guide?.factors ? JSON.stringify(guide.factors, null, 2) : '',
            faqs: guide?.faqs ? JSON.stringify(guide.faqs, null, 2) : '',
            source_note: guide?.source_note ?? '',
        });
    };

    const saveGuide = async () => {
        let factors: unknown;
        let faqs: unknown;
        try {
            factors = guideForm.factors.trim() ? JSON.parse(guideForm.factors) : undefined;
            faqs = guideForm.faqs.trim() ? JSON.parse(guideForm.faqs) : undefined;
        } catch {
            toast.error('Factors and FAQs must be valid JSON.');
            return;
        }
        const payload = {
            need_category_id: guideForm.need_category_id,
            title: guideForm.title,
            slug: guideForm.slug || undefined,
            summary: guideForm.summary,
            price_min: guideForm.price_min === '' ? null : Number(guideForm.price_min),
            price_max: guideForm.price_max === '' ? null : Number(guideForm.price_max),
            price_avg: guideForm.price_avg === '' ? null : Number(guideForm.price_avg),
            pricing_unit: guideForm.pricing_unit,
            status: guideForm.status,
            source_note: guideForm.source_note || null,
            ...(factors !== undefined ? { factors } : {}),
            ...(faqs !== undefined ? { faqs } : {}),
        };
        try {
            if (editingGuide) {
                await api.put(`/api/admin/needs/cost-guides/${editingGuide.id}`, payload);
                toast.success('Cost guide updated.');
            } else {
                await api.post('/api/admin/needs/cost-guides', payload);
                toast.success('Cost guide created.');
            }
            setGuideEditorOpen(false);
            load();
        } catch (e) {
            toast.error(errorMessage(e, 'Could not save cost guide'));
        }
    };

    const deleteGuide = async (id: string) => {
        if (!(await ask({ title: 'Delete this cost guide?', description: 'It will disappear from public pages immediately.', danger: true }))) return;
        try {
            await api.del(`/api/admin/needs/cost-guides/${id}`);
            toast.success('Cost guide deleted.');
            load();
        } catch (e) {
            toast.error(errorMessage(e, 'Could not delete cost guide'));
        }
    };

    const toggleGuideStatus = async (guide: CostGuideRow) => {
        try {
            await api.put(`/api/admin/needs/cost-guides/${guide.id}`, { status: guide.status === 'published' ? 'draft' : 'published' });
            toast.success(guide.status === 'published' ? 'Guide unpublished.' : 'Guide published.');
            load();
        } catch (e) {
            toast.error(errorMessage(e, 'Could not toggle guide status'));
        }
    };

    return (
        <AdminLayout title="Needs & Tasks Moderation">
            <Head title="Needs & Tasks" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Needs &amp; Tasks</h1>
                    {tab === 'fraud' && isPrivileged && (
                        <button onClick={runScan} className={btn}>
                            Run fraud scan
                        </button>
                    )}
                    {tab === 'overview' && (
                        <a href="/api/admin/needs/reports/requests/export" className={btn} download>
                            Export requests CSV
                        </a>
                    )}
                </div>

                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Needs console sections">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            role="tab"
                            aria-selected={tab === t.key}
                            onClick={() => setTab(t.key)}
                            className={`min-h-[44px] rounded-full px-4 py-1.5 text-sm font-medium ${
                                tab === t.key ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {tab !== 'overview' && (
                <div className="flex flex-wrap items-center gap-2">
                    <label className="text-sm text-gray-600 dark:text-gray-300" htmlFor="needs-status">Status</label>
                    <select id="needs-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={input}>
                        <option value="all">All</option>
                        {tab === 'requests' && ['pending', 'published', 'disputed', 'rejected', 'expired', 'completed'].map((s) => <option key={s} value={s}>{s}</option>)}
                        {tab === 'offers' && ['pending', 'accepted', 'rejected', 'withdrawn'].map((s) => <option key={s} value={s}>{s}</option>)}
                        {tab === 'tasks' && ['open', 'assigned', 'in_review', 'completed', 'cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
                        {tab === 'disputes' && ['open', 'under_review', 'resolved', 'closed'].map((s) => <option key={s} value={s}>{s}</option>)}
                        {tab === 'fraud' && ['open', 'confirmed', 'dismissed'].map((s) => <option key={s} value={s}>{s}</option>)}
                        {tab === 'providers' && ['submitted', 'trial', 'approved', 'rejected', 'suspended', 'draft'].map((s) => <option key={s} value={s}>{s}</option>)}
                            {tab === 'listings' && ['draft', 'submitted', 'approved', 'published', 'rejected', 'suspended', 'archived'].map((s) => <option key={s} value={s}>{s}</option>)}
                            {tab === 'guides' && ['draft', 'published'].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {isPrivileged && (tab === 'requests' || tab === 'fraud' || tab === 'providers') && (
                        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Moderator note (optional)" className={`${input} w-64`} />
                    )}
                </div>
                )}

                {loading ? (
                    <p className="text-sm text-gray-500">Loading…</p>
                ) : tab === 'overview' ? (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Needs attention</h2>
                            <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                {overview ? Object.entries(overview.attention).map(([k, v]) => (
                                    <div key={k} className="rounded border px-3 py-2 dark:border-gray-700">
                                        <dt className="text-xs text-gray-500">{k.replace(/_/g, ' ')}</dt>
                                        <dd className="text-xl font-bold text-gray-900 dark:text-white">{v}</dd>
                                    </div>
                                )) : <p className="text-sm text-gray-500">No data.</p>}
                            </dl>
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Requests by status</h2>
                            <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                {overview ? Object.entries(overview.requests_by_status).map(([k, v]) => (
                                    <div key={k} className="rounded border px-3 py-2 dark:border-gray-700">
                                        <dt className="text-xs text-gray-500">{k}</dt>
                                        <dd className="text-xl font-bold text-gray-900 dark:text-white">{v}</dd>
                                    </div>
                                )) : <p className="text-sm text-gray-500">No data.</p>}
                            </dl>
                        </div>
                        <div className="flex gap-6 text-sm text-gray-600 dark:text-gray-300">
                            <p>Completed (30d): <strong>{overview?.completed_30d ?? '—'}</strong></p>
                            <p>Cancellations (8w): <strong>{overview?.cancellations_8w?.reduce((a, r) => a + Number(r.total), 0) ?? '—'}</strong></p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded border dark:border-gray-700">
                        {tab === 'requests' && (
                            <table className={table}>
                                <thead><tr><th scope="col" className={th}>Request #</th><th scope="col" className={th}>Title</th><th scope="col" className={th}>Requester</th><th scope="col" className={th}>Status</th><th scope="col" className={th}>Created</th>{isPrivileged && <th scope="col" className={th}>Moderate</th>}</tr></thead>
                                <tbody>
                                    {requests.map((r) => (
                                        <tr key={r.id}>
                                            <td className={`${td} font-mono text-xs`}>{r.request_number}</td>
                                            <td className={td}>{r.title}</td>
                                            <td className={`${td} text-xs`}>{r.user?.name ?? r.user?.email ?? '—'}</td>
                                            <td className={td}><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone(r.status)}`}>{r.status}</span></td>
                                            <td className={`${td} text-xs`}>{formatDateTime(r.created_at)}</td>
                                            {isPrivileged && (
                                                <td className={td}>
                                                    <div className="flex gap-1">
                                                        <button onClick={() => moderate(r.id, 'reject')} className={btnDanger}>Reject</button>
                                                        <button onClick={() => moderate(r.id, 'expire')} className={btn}>Expire</button>
                                                        <button onClick={() => moderate(r.id, 'refund')} className={btn}>Refund</button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {requests.length === 0 && <tr><td className={td} colSpan={6}>No requests.</td></tr>}
                                </tbody>
                            </table>
                        )}
                        {tab === 'offers' && (
                            <table className={table}>
                                <thead><tr><th scope="col" className={th}>Request</th><th scope="col" className={th}>Provider</th><th scope="col" className={th}>Price</th><th scope="col" className={th}>Status</th><th scope="col" className={th}>Created</th>{isPrivileged && <th scope="col" className={th}>Action</th>}</tr></thead>
                                <tbody>
                                    {offers.map((o) => (
                                        <tr key={o.id}>
                                            <td className={`${td} text-xs`}>{o.request?.request_number ?? '—'}</td>
                                            <td className={td}>{o.provider?.name ?? '—'}</td>
                                            <td className={`${td} font-semibold`}>{o.price}</td>
                                            <td className={td}><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone(o.status)}`}>{o.status}</span></td>
                                            <td className={`${td} text-xs`}>{formatDateTime(o.created_at)}</td>
                                            {isPrivileged && (
                                                <td className={td}>
                                                    {o.status !== 'accepted' && <button onClick={() => deleteOffer(o.id)} className={btnDanger}>Delete</button>}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {offers.length === 0 && <tr><td className={td} colSpan={6}>No offers.</td></tr>}
                                </tbody>
                            </table>
                        )}
                        {tab === 'tasks' && (
                            <table className={table}>
                                <thead><tr><th scope="col" className={th}>Title</th><th scope="col" className={th}>Owner</th><th scope="col" className={th}>Applications</th><th scope="col" className={th}>Status</th><th scope="col" className={th}>Created</th>{isPrivileged && <th scope="col" className={th}>Action</th>}</tr></thead>
                                <tbody>
                                    {tasks.map((t) => (
                                        <tr key={t.id}>
                                            <td className={td}>{t.title}</td>
                                            <td className={`${td} text-xs`}>{t.owner?.name ?? '—'}</td>
                                            <td className={td}>{t.applications_count ?? '—'}</td>
                                            <td className={td}><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone(t.status)}`}>{t.status}</span></td>
                                            <td className={`${td} text-xs`}>{formatDateTime(t.created_at)}</td>
                                            {isPrivileged && (
                                                <td className={td}>
                                                    {t.status !== 'cancelled'
                                                        ? <button onClick={() => cancelTask(t.id)} className={btnDanger}>Cancel</button>
                                                        : <button onClick={() => restoreTask(t.id)} className={btn}>Restore</button>}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {tasks.length === 0 && <tr><td className={td} colSpan={6}>No tasks.</td></tr>}
                                </tbody>
                            </table>
                        )}
                        {tab === 'disputes' && (
                            <table className={table}>
                                <thead><tr><th scope="col" className={th}>Subject</th><th scope="col" className={th}>Scope</th><th scope="col" className={th}>Reporter</th><th scope="col" className={th}>Status</th><th scope="col" className={th}>Assignee</th>{isPrivileged && <th scope="col" className={th}>Resolve</th>}</tr></thead>
                                <tbody>
                                    {disputes.map((d) => (
                                        <tr key={d.id}>
                                            <td className={td}>{d.subject}</td>
                                            <td className={`${td} text-xs`}>{d.need_request_id ? 'request' : 'task'}</td>
                                            <td className={`${td} text-xs`}>{d.user?.name ?? d.user?.email ?? '—'}</td>
                                            <td className={td}><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone(d.status)}`}>{d.status}</span></td>
                                            <td className={`${td} text-xs`}>{d.assignee?.name ?? '—'}</td>
                                            {isPrivileged && (
                                                <td className={td}>
                                                    <div className="flex gap-1">
                                                        <button onClick={() => resolveDispute(d.id, 'dismissed')} className={btn}>Dismiss</button>
                                                        <button onClick={() => resolveDispute(d.id, 'credit')} className={btn}>Credit</button>
                                                        <button onClick={() => resolveDispute(d.id, 'refund')} className={btnDanger}>Refund</button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {disputes.length === 0 && <tr><td className={td} colSpan={6}>No needs disputes.</td></tr>}
                                </tbody>
                            </table>
                        )}
                        {tab === 'fraud' && (
                            <table className={table}>
                                <thead><tr><th scope="col" className={th}>Rule</th><th scope="col" className={th}>Entity</th><th scope="col" className={th}>User</th><th scope="col" className={th}>Status</th><th scope="col" className={th}>Flagged</th>{isPrivileged && <th scope="col" className={th}>Review</th>}</tr></thead>
                                <tbody>
                                    {flags.map((f) => (
                                        <tr key={f.id}>
                                            <td className={`${td} font-mono text-xs`}>{f.rule}</td>
                                            <td className={`${td} text-xs`}>{f.entity_type}:{f.entity_id.slice(0, 8)}…</td>
                                            <td className={`${td} text-xs`}>{f.user?.name ?? f.user?.email ?? '—'}</td>
                                            <td className={td}><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone(f.status)}`}>{f.status}</span></td>
                                            <td className={`${td} text-xs`}>{formatDateTime(f.created_at)}</td>
                                            {isPrivileged && f.status === 'open' && (
                                                <td className={td}>
                                                    <div className="flex gap-1">
                                                        <button onClick={() => decideFlag(f.id, 'confirm')} className={btnDanger}>Confirm</button>
                                                        <button onClick={() => decideFlag(f.id, 'dismiss')} className={btn}>Dismiss</button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {flags.length === 0 && <tr><td className={td} colSpan={6}>No fraud flags.</td></tr>}
                                </tbody>
                            </table>
                        )}
                        {tab === 'providers' && (
                            <table className={table}>
                                <thead><tr><th scope="col" className={th}>Provider</th><th scope="col" className={th}>Contact</th><th scope="col" className={th}>Status</th><th scope="col" className={th}>KYC</th><th scope="col" className={th}>Submitted</th>{isPrivileged && <th scope="col" className={th}>Review</th>}</tr></thead>
                                <tbody>
                                    {providers.map((p) => (
                                        <tr key={p.id}>
                                            <td className={td}>{p.display_name}</td>
                                            <td className={`${td} text-xs`}>{p.user?.email ?? '—'}</td>
                                            <td className={td}>
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone(p.status)}`}>{p.status}</span>
                                                {p.status === 'trial' && p.trial_started_at && (
                                                    <span className="ml-1 text-xs text-gray-400">since {formatDateTime(p.trial_started_at)}</span>
                                                )}
                                            </td>
                                            <td className={`${td} text-xs`}>{p.kyc_state ?? '—'}</td>
                                            <td className={`${td} text-xs`}>{formatDateTime(p.created_at)}</td>
                                            {isPrivileged && (
                                                <td className={td}>
                                                    <div className="flex gap-1">
                                                        {p.status === 'submitted' && (
                                                            <>
                                                                <button onClick={() => reviewProvider(p.id, 'trial')} className={btn}>Start trial</button>
                                                                <button onClick={() => reviewProvider(p.id, 'approve')} className={btn}>Approve</button>
                                                                <button onClick={() => reviewProvider(p.id, 'reject')} className={btnDanger}>Reject</button>
                                                            </>
                                                        )}
                                                        {p.status === 'trial' && (
                                                            <>
                                                                <button onClick={() => reviewProvider(p.id, 'approve')} className={btn}>Approve</button>
                                                                <button onClick={() => reviewProvider(p.id, 'reject')} className={btnDanger}>Reject</button>
                                                                <button onClick={() => suspendProvider(p.id)} className={btnDanger}>Suspend</button>
                                                            </>
                                                        )}
                                                        {p.status === 'rejected' && (
                                                            <>
                                                                <button onClick={() => reviewProvider(p.id, 'trial')} className={btn}>Start trial</button>
                                                                <button onClick={() => reviewProvider(p.id, 'approve')} className={btn}>Approve</button>
                                                                <button onClick={() => reviewProvider(p.id, 'reject')} className={btnDanger}>Reject</button>
                                                            </>
                                                        )}
                                                        {p.status === 'approved' && (
                                                            <button onClick={() => suspendProvider(p.id)} className={btnDanger}>Suspend</button>
                                                        )}
                                                        {p.status === 'suspended' && (
                                                            <button onClick={() => reinstateProvider(p.id)} className={btn}>Reinstate</button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {providers.length === 0 && <tr><td className={td} colSpan={6}>No provider applications.</td></tr>}
                                </tbody>
                            </table>
                        )}
                        {tab === 'listings' && (
                            <table className={table}>
                                <thead><tr><th scope="col" className={th}>Listing</th><th scope="col" className={th}>Category</th><th scope="col" className={th}>Price</th><th scope="col" className={th}>Status</th><th scope="col" className={th}>Owner</th>{isPrivileged && <th scope="col" className={th}>Moderate</th>}</tr></thead>
                                <tbody>
                                    {listings.map((l) => (
                                        <tr key={l.id}>
                                            <td className={td}>{l.name}</td>
                                            <td className={`${td} text-xs`}>{l.category?.name ?? '—'}</td>
                                            <td className={`${td} font-semibold`}>{l.price ?? '—'}</td>
                                            <td className={td}><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone(l.status)}`}>{l.status}</span></td>
                                            <td className={`${td} text-xs`}>{l.owner?.name ?? l.owner?.email ?? '—'}</td>
                                            {isPrivileged && (
                                                <td className={td}>
                                                    <div className="flex flex-wrap gap-1">
                                                        {(l.status === 'submitted' || l.status === 'rejected') && (
                                                            <button onClick={() => moderateListing(l.id, 'approve')} className={btn}>Approve</button>
                                                        )}
                                                        {l.status === 'approved' && (
                                                            <button onClick={() => moderateListing(l.id, 'publish')} className={btn}>Publish</button>
                                                        )}
                                                        {(l.status === 'submitted' || l.status === 'approved') && (
                                                            <button onClick={() => moderateListing(l.id, 'reject')} className={btnDanger}>Reject</button>
                                                        )}
                                                        {(l.status === 'approved' || l.status === 'published') && (
                                                            <button onClick={() => moderateListing(l.id, 'suspend')} className={btnDanger}>Suspend</button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {listings.length === 0 && <tr><td className={td} colSpan={6}>No listings.</td></tr>}
                                </tbody>
                            </table>
                        )}
                        {tab === 'categories' && (
                            <div className="space-y-4">
                                <div className="flex justify-end">
                                    {isPrivileged && (
                                        <button onClick={() => openCategoryEditor()} className={btn}>
                                            New category
                                        </button>
                                    )}
                                </div>
                                <table className={table}>
                                    <thead><tr><th scope="col" className={th}>Name</th><th scope="col" className={th}>Slug</th><th scope="col" className={th}>Parent</th><th scope="col" className={th}>Active</th><th scope="col" className={th}>Verified-only</th><th scope="col" className={th}>Schema v</th><th scope="col" className={th}>Use</th>{isPrivileged && <th scope="col" className={th}>Manage</th>}</tr></thead>
                                    <tbody>
                                        {categories.map((c) => (
                                            <tr key={c.id}>
                                                <td className={td}>{c.name}</td>
                                                <td className={`${td} font-mono text-xs`}>{c.slug}</td>
                                                <td className={`${td} text-xs`}>{c.parent?.name ?? '—'}</td>
                                                <td className={td}>{c.is_active ? 'yes' : 'no'}</td>
                                                <td className={td}>{c.requires_verified_provider ? 'yes' : 'no'}</td>
                                                <td className={`${td} text-xs`}>{c.form_schema_version ?? 1}</td>
                                                <td className={`${td} text-xs`}>{c.items_count ?? 0} items · {c.children_count ?? 0} children</td>
                                                {isPrivileged && (
                                                    <td className={td}>
                                                        <div className="flex flex-wrap gap-1">
                                                            <button onClick={() => openCategoryEditor(c)} className={btn}>Edit</button>
                                                            <button onClick={() => toggleCategoryActive(c)} className={btn}>{c.is_active ? 'Deactivate' : 'Activate'}</button>
                                                            <button onClick={() => deleteCategory(c.id)} className={btnDanger}>Delete</button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                        {categories.length === 0 && <tr><td className={td} colSpan={8}>No categories.</td></tr>}
                                    </tbody>
                                </table>
                                {isPrivileged && catEditorOpen && (
                                    <div className="rounded border p-4 dark:border-gray-700">
                                        <div>
                                            <h3 className="text-sm font-semibold">{editingCat ? 'Edit category' : 'New category'}</h3>
                                            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                <label className="text-sm">Name *<input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} className={input} /></label>
                                                <label className="text-sm">Slug *<input value={catForm.slug} onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })} placeholder="lowercase-hyphens" className={input} /></label>
                                                <label className="text-sm sm:col-span-2">Description<textarea value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} rows={2} className={input} /></label>
                                                <label className="text-sm">Icon<input value={catForm.icon} onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })} className={input} /></label>
                                                <label className="text-sm">Color<input value={catForm.color} onChange={(e) => setCatForm({ ...catForm, color: e.target.value })} className={input} /></label>
                                                <label className="text-sm">Sort order<input type="number" value={catForm.sort_order} onChange={(e) => setCatForm({ ...catForm, sort_order: e.target.value })} className={input} /></label>
                                                <label className="text-sm">Parent<select value={catForm.parent_id} onChange={(e) => setCatForm({ ...catForm, parent_id: e.target.value })} className={input}>
                                                    <option value="">None (top level)</option>
                                                    {categories.filter((c) => c.id !== editingCat?.id).map((c) => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select></label>
                                                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={catForm.is_active} onChange={(e) => setCatForm({ ...catForm, is_active: e.target.checked })} /> Active (visible publicly)</label>
                                                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={catForm.requires_verified_provider} onChange={(e) => setCatForm({ ...catForm, requires_verified_provider: e.target.checked })} /> Verified providers only</label>
                                                <label className="text-sm sm:col-span-2">Question schema (JSON, optional — validated server-side)<textarea value={catForm.form_schema} onChange={(e) => setCatForm({ ...catForm, form_schema: e.target.value })} rows={4} placeholder='[{"key":"subject","label":"Subject","type":"text","required":true}]' className={`${input} font-mono text-xs`} /></label>
                                            </div>
                                            <div className="mt-3 flex gap-2">
                                                <button onClick={saveCategory} className={btn}>Save</button>
                                                <button onClick={() => setCatEditorOpen(false)} className={btn}>Cancel</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {tab === 'guides' && (
                            <div className="space-y-4">
                                <div className="flex justify-end">
                                    {isPrivileged && (
                                        <button onClick={() => openGuideEditor()} className={btn}>
                                            New cost guide
                                        </button>
                                    )}
                                </div>
                                <table className={table}>
                                    <thead><tr><th scope="col" className={th}>Title</th><th scope="col" className={th}>Category</th><th scope="col" className={th}>Range</th><th scope="col" className={th}>Unit</th><th scope="col" className={th}>Status</th>{isPrivileged && <th scope="col" className={th}>Manage</th>}</tr></thead>
                                    <tbody>
                                        {guides.map((g) => (
                                            <tr key={g.id}>
                                                <td className={td}>
                                                    <p className="font-medium">{g.title}</p>
                                                    <p className="font-mono text-xs text-gray-400">{g.slug}</p>
                                                </td>
                                                <td className={td}>{g.category?.name ?? '—'}</td>
                                                <td className={td}>
                                                    {g.price_min && g.price_max ? `$${g.price_min} – $${g.price_max}` : (g.price_min || g.price_max || 'Varies')}
                                                </td>
                                                <td className={`${td} text-xs`}>{g.pricing_unit}</td>
                                                <td className={td}><span className={`rounded-full px-2 py-0.5 text-xs ${g.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'}`}>{g.status}</span></td>
                                                {isPrivileged && (
                                                    <td className={td}>
                                                        <div className="flex flex-wrap gap-1">
                                                            <button onClick={() => openGuideEditor(g)} className={btn}>Edit</button>
                                                            <button onClick={() => toggleGuideStatus(g)} className={btn}>{g.status === 'published' ? 'Unpublish' : 'Publish'}</button>
                                                            <button onClick={() => deleteGuide(g.id)} className={btnDanger}>Delete</button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                        {guides.length === 0 && <tr><td className={td} colSpan={6}>No cost guides yet.</td></tr>}
                                    </tbody>
                                </table>
                                {isPrivileged && guideEditorOpen && (
                                    <div className="rounded border p-4 dark:border-gray-700">
                                        <h3 className="text-sm font-semibold">{editingGuide ? 'Edit cost guide' : 'New cost guide'}</h3>
                                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <label className="text-sm">Category *<select value={guideForm.need_category_id} onChange={(e) => setGuideForm({ ...guideForm, need_category_id: e.target.value })} className={input}>
                                                <option value="">Select a category</option>
                                                {guideCategories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                                            </select></label>
                                            <label className="text-sm">Title *<input value={guideForm.title} onChange={(e) => setGuideForm({ ...guideForm, title: e.target.value })} className={input} /></label>
                                            <label className="text-sm">Slug (optional)<input value={guideForm.slug} onChange={(e) => setGuideForm({ ...guideForm, slug: e.target.value })} placeholder="auto from title" className={input} /></label>
                                            <label className="text-sm">Pricing unit<select value={guideForm.pricing_unit} onChange={(e) => setGuideForm({ ...guideForm, pricing_unit: e.target.value })} className={input}>
                                                <option value="project">project</option><option value="hour">hour</option><option value="visit">visit</option><option value="day">day</option><option value="month">month</option>
                                            </select></label>
                                            <label className="text-sm">Price min<input type="number" step="0.01" min="0" value={guideForm.price_min} onChange={(e) => setGuideForm({ ...guideForm, price_min: e.target.value })} className={input} /></label>
                                            <label className="text-sm">Price max<input type="number" step="0.01" min="0" value={guideForm.price_max} onChange={(e) => setGuideForm({ ...guideForm, price_max: e.target.value })} className={input} /></label>
                                            <label className="text-sm">Price avg<input type="number" step="0.01" min="0" value={guideForm.price_avg} onChange={(e) => setGuideForm({ ...guideForm, price_avg: e.target.value })} className={input} /></label>
                                            <label className="text-sm">Status<select value={guideForm.status} onChange={(e) => setGuideForm({ ...guideForm, status: e.target.value })} className={input}>
                                                <option value="draft">draft</option><option value="published">published</option>
                                            </select></label>
                                            <label className="text-sm sm:col-span-2">Summary *<textarea value={guideForm.summary} onChange={(e) => setGuideForm({ ...guideForm, summary: e.target.value })} rows={3} className={input} /></label>
                                            <label className="text-sm">Factors (JSON array)<textarea value={guideForm.factors} onChange={(e) => setGuideForm({ ...guideForm, factors: e.target.value })} rows={4} placeholder='[{"label":"Panel upgrade","impact":"high"}]' className={`${input} font-mono text-xs`} /></label>
                                            <label className="text-sm">FAQs (JSON array)<textarea value={guideForm.faqs} onChange={(e) => setGuideForm({ ...guideForm, faqs: e.target.value })} rows={4} placeholder='[{"question":"Hourly rates?","answer":"$50-$120/hr."}]' className={`${input} font-mono text-xs`} /></label>
                                            <label className="text-sm sm:col-span-2">Source note<input value={guideForm.source_note} onChange={(e) => setGuideForm({ ...guideForm, source_note: e.target.value })} className={input} /></label>
                                        </div>
                                        <div className="mt-3 flex gap-2">
                                            <button onClick={saveGuide} className={btn}>Save</button>
                                            <button onClick={() => setGuideEditorOpen(false)} className={btn}>Cancel</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
