import { statusTone } from '@/lib/lifecycle';
import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { api, errorMessage, rows } from '@/lib/api';
import { useConfirm } from '@/lib/confirm';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useAuthPermissions } from '@/lib/permissions';
import DataTable from '@/components/shared/DataTable';
import { CreditCard, Layers, Pencil, Plus, Trash2, X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';

/** Real admin subscription row (AdminDomainController::subscriptions). */
interface Subscription {
    id: string;
    status: 'active' | 'cancelled' | 'expired' | 'paused';
    starts_at?: string | null;
    ends_at?: string | null;
    cancelled_at?: string | null;
    created_at: string;
    user_name?: string | null;
    user_email?: string | null;
    plan_name?: string | null;
    plan_price?: number | string | null;
}

/** Real plan row (SubscriptionController::adminPlans). */
interface Plan {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    price: number | string;
    currency: string;
    interval: string;
    duration_days: number;
    features?: string[] | null;
    is_active: boolean;
    subscriptions_count?: number;
}

interface Meta {
    page?: number;
    current_page?: number;
    per_page: number;
    total: number;
}

const INTERVALS = ['daily', 'weekly', 'monthly', 'quarterly', 'biannually', 'yearly'];

type Tab = 'subscriptions' | 'plans';

export default function AdminSubscriptions() {
    const ask = useConfirm();
    const { can, roles } = useAuthPermissions();
    const canManagePlans = can('subscriptions.subscriptions.manage')
        && (roles.includes('super_admin') || roles.includes('administrator'));
    const [tab, setTab] = useState<Tab>('subscriptions');

    const [subs, setSubs] = useState<Subscription[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('all');
    const [page, setPage] = useState(1);

    const [plans, setPlans] = useState<Plan[]>([]);
    const [planMeta, setPlanMeta] = useState<Meta | null>(null);
    const [plansLoading, setPlansLoading] = useState(false);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [savingPlan, setSavingPlan] = useState(false);
    const [planForm, setPlanForm] = useState({
        name: '', slug: '', description: '', price: '', currency: 'USD',
        interval: 'monthly', duration_days: '30', features: '', is_active: true,
    });

    useEffect(() => {
        if (tab !== 'subscriptions') return;
        setLoading(true);
        api.get<{ data: Subscription[]; meta: Meta }>(`/api/admin/subscriptions?page=${page}&status=${status}`)
            .then((res) => { setSubs(rows<Subscription>(res)); setMeta(res.meta); })
            .catch((e) => { setSubs([]); toast.error(errorMessage(e, 'Failed to load subscriptions')); })
            .finally(() => setLoading(false));
    }, [tab, status, page]);

    const loadPlans = () => {
        setPlansLoading(true);
        api.get<{ data: Plan[]; meta: Meta }>('/api/admin/plans?per_page=50')
            .then((res) => { setPlans(rows<Plan>(res)); setPlanMeta(res.meta); })
            .catch((e) => { setPlans([]); toast.error(errorMessage(e, 'Failed to load plans')); })
            .finally(() => setPlansLoading(false));
    };

    useEffect(() => {
        if (tab === 'plans') loadPlans();
    }, [tab]);

    const openCreatePlan = () => {
        setEditingPlan(null);
        setPlanForm({ name: '', slug: '', description: '', price: '', currency: 'USD', interval: 'monthly', duration_days: '30', features: '', is_active: true });
        setShowPlanModal(true);
    };

    const openEditPlan = (p: Plan) => {
        setEditingPlan(p);
        setPlanForm({
            name: p.name,
            slug: p.slug,
            description: p.description ?? '',
            price: String(p.price ?? ''),
            currency: p.currency ?? 'USD',
            interval: p.interval ?? 'monthly',
            duration_days: String(p.duration_days ?? 30),
            features: (p.features ?? []).join(', '),
            is_active: p.is_active,
        });
        setShowPlanModal(true);
    };

    const submitPlan = async (e: FormEvent) => {
        e.preventDefault();
        if (!planForm.name.trim()) {
            toast.error('Plan name is required');
            return;
        }
        const features = planForm.features
            .split(',')
            .map((f) => f.trim())
            .filter(Boolean);
        const payload: Record<string, unknown> = {
            name: planForm.name.trim(),
            description: planForm.description.trim() || null,
            price: Number(planForm.price) || 0,
            currency: planForm.currency.trim().toUpperCase() || 'USD',
            interval: planForm.interval,
            duration_days: Number(planForm.duration_days) || 30,
            features: features.length > 0 ? features : null,
            is_active: planForm.is_active,
        };
        setSavingPlan(true);
        try {
            if (editingPlan) {
                await api.put(`/api/admin/plans/${editingPlan.id}`, payload);
                toast.success('Plan updated.');
            } else {
                if (planForm.slug.trim()) payload.slug = planForm.slug.trim();
                await api.post('/api/admin/plans', payload);
                toast.success('Plan created.');
            }
            setShowPlanModal(false);
            loadPlans();
        } catch (err) {
            toast.error(errorMessage(err, editingPlan ? 'Update failed' : 'Create failed'));
        } finally {
            setSavingPlan(false);
        }
    };

    const togglePlanActive = async (p: Plan) => {
        try {
            await api.put(`/api/admin/plans/${p.id}`, { is_active: !p.is_active });
            setPlans(plans.map((x) => (x.id === p.id ? { ...x, is_active: !p.is_active } : x)));
            toast.success(p.is_active ? 'Plan deactivated.' : 'Plan activated.');
        } catch (err) {
            toast.error(errorMessage(err, 'Update failed'));
        }
    };

    const deletePlan = async (p: Plan) => {
        const ok = await ask({
            title: `Delete ${p.name}?`,
            description: 'The plan is removed from the catalogue. Plans with subscriptions cannot be deleted - deactivate instead.',
            confirmLabel: 'Delete',
            danger: true,
        });
        if (!ok) return;
        try {
            await api.del(`/api/admin/plans/${p.id}`);
            toast.success('Plan deleted.');
            loadPlans();
        } catch (err) {
            toast.error(errorMessage(err, 'Delete failed'));
        }
    };

    return (
        <AdminLayout title="Subscriptions">
            <Head title="Subscriptions" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscriptions</h1>
                    {tab === 'subscriptions' && meta && <span className="text-sm text-gray-500">{meta.total} subscriptions</span>}
                    {tab === 'plans' && planMeta && <span className="text-sm text-gray-500">{planMeta.total} plans</span>}
                </div>

                <div className="flex gap-2">
                    <button data-testid="subscriptions-tab" onClick={() => { setTab('subscriptions'); setPage(1); }}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ${tab === 'subscriptions' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                        <CreditCard className="h-4 w-4" /> Subscriptions
                    </button>
                    <button data-testid="plans-tab" onClick={() => setTab('plans')}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ${tab === 'plans' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                        <Layers className="h-4 w-4" /> Plans
                    </button>
                    {tab === 'plans' && canManagePlans && (
                        <button data-testid="new-plan" onClick={openCreatePlan}
                            className="ml-auto flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500">
                            <Plus className="h-4 w-4" /> New Plan
                        </button>
                    )}
                </div>

                {tab === 'subscriptions' ? (
                    <>
                        <div className="flex flex-wrap gap-2">
                            {['all', 'active', 'cancelled', 'expired', 'paused'].map((s) => (
                                <button key={s} onClick={() => { setStatus(s); setPage(1); }}
                                    className={`rounded-full px-3 py-1 text-sm font-medium ${status === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}>
                                    {s}
                                </button>
                            ))}
                        </div>

                        <DataTable
                            columns={[
                                {
                                    key: 'subscriber', header: 'Subscriber', accessor: 'user_name', sortable: true,
                                    render: (s) => (
                                        <>
                                            <p className="font-medium text-gray-900 dark:text-white">{s.user_name}</p>
                                            <p className="text-xs text-gray-500">{s.user_email}</p>
                                        </>
                                    ),
                                },
                                {
                                    key: 'plan', header: 'Plan', accessor: 'plan_name', sortable: true,
                                    render: (s) => (
                                        <>
                                            <p className="font-medium text-gray-900 dark:text-white">{s.plan_name ?? '—'}</p>
                                            {s.plan_price != null && <p className="text-xs text-gray-500">${s.plan_price}</p>}
                                        </>
                                    ),
                                },
                                {
                                    key: 'status', header: 'Status', accessor: 'status', sortable: true,
                                    render: (s) => (
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusTone(s.status)}`}>{s.status}</span>
                                    ),
                                },
                                {
                                    key: 'starts', header: 'Starts', accessor: 'starts_at', sortable: true,
                                    render: (s) => <span className="text-xs text-gray-500">{s.starts_at ? formatDateTime(s.starts_at) : '—'}</span>,
                                },
                                {
                                    key: 'ends', header: 'Ends', accessor: 'ends_at', sortable: true,
                                    render: (s) => <span className="text-xs text-gray-500">{s.ends_at ? formatDateTime(s.ends_at) : '—'}</span>,
                                },
                                {
                                    key: 'cancelled', header: 'Cancelled',
                                    render: (s) => <span className="text-xs text-gray-500">{s.cancelled_at ? formatDateTime(s.cancelled_at) : '—'}</span>,
                                },
                            ]}
                            data={subs}
                            loading={loading}
                            emptyTitle="No subscriptions found"
                        />

                        {meta && meta.total > meta.per_page && (
                            <div className="flex items-center justify-between text-sm text-gray-500">
                                <span>Page {meta.page ?? meta.current_page} · {meta.total} subscriptions</span>
                                <div className="flex gap-2">
                                    <button disabled={(meta.page ?? meta.current_page ?? 1) <= 1} onClick={() => setPage(page - 1)}
                                        className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Previous</button>
                                    <button disabled={(meta.page ?? meta.current_page ?? 1) * meta.per_page >= meta.total} onClick={() => setPage(page + 1)}
                                        className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Next</button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <DataTable
                        columns={[
                            {
                                key: 'plan', header: 'Plan', accessor: 'name', sortable: true,
                                render: (p) => (
                                    <>
                                        <p className="font-medium text-gray-900 dark:text-white">{p.name}</p>
                                        <p className="font-mono text-xs text-gray-500">{p.slug}</p>
                                        {p.description && <p className="max-w-xs text-xs text-gray-500">{p.description}</p>}
                                    </>
                                ),
                            },
                            {
                                key: 'interval', header: 'Billing', accessor: 'interval', sortable: true,
                                render: (p) => (
                                    <span className="text-sm capitalize text-gray-700 dark:text-gray-300">
                                        {p.interval} · {p.duration_days} days
                                    </span>
                                ),
                            },
                            {
                                key: 'price', header: 'Price', accessor: 'price', sortable: true,
                                render: (p) => <span className="font-semibold">{formatCurrency(Number(p.price))}</span>,
                            },
                            {
                                key: 'features', header: 'Features',
                                render: (p) => <span className="text-sm text-gray-500">{(p.features ?? []).length || '—'}</span>,
                            },
                            {
                                key: 'subscribers', header: 'Subscribers', accessor: 'subscriptions_count', sortable: true,
                                render: (p) => <span className="text-sm">{p.subscriptions_count ?? 0}</span>,
                            },
                            {
                                key: 'status', header: 'Status', accessor: 'is_active', sortable: true,
                                render: (p) => (
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                                        {p.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                ),
                            },
                            {
                                key: 'actions', header: 'Actions',
                                render: (p) => (canManagePlans ? (
                                    <div className="flex gap-1.5">
                                        <button onClick={() => togglePlanActive(p)}
                                            className="rounded-lg bg-gray-800 px-2.5 py-1 text-xs font-semibold text-white hover:bg-gray-700 dark:bg-gray-600">
                                            {p.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button data-testid={`plan-edit-${p.id}`} onClick={() => openEditPlan(p)}
                                            className="rounded-lg border border-gray-300 p-1.5 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                                            title="Edit plan">
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                        <button data-testid={`plan-delete-${p.id}`} onClick={() => deletePlan(p)}
                                            className="rounded-lg border border-red-300 p-1.5 text-red-600 hover:bg-red-50"
                                            title="Delete plan">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <span className="text-xs text-gray-400">View only</span>
                                )),
                            },
                        ]}
                        data={plans}
                        loading={plansLoading}
                        emptyTitle="No plans yet"
                    />
                )}

                {canManagePlans && showPlanModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowPlanModal(false)}>
                        <form data-testid="plan-edit-modal" onClick={(e) => e.stopPropagation()} onSubmit={submitPlan}
                            className="max-h-[90vh] w-full max-w-lg overflow-y-auto space-y-4 rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{editingPlan ? 'Edit Plan' : 'New Plan'}</h2>
                                <button type="button" onClick={() => setShowPlanModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="text-sm">Name *
                                    <input required maxLength={255} data-testid="plan-name" value={planForm.name}
                                        onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></label>
                                <label className="text-sm">Slug {editingPlan ? '' : '(optional)'}
                                    <input maxLength={255} data-testid="plan-slug" value={planForm.slug}
                                        disabled={!!editingPlan}
                                        onChange={(e) => setPlanForm({ ...planForm, slug: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700" /></label>
                                <label className="text-sm">Price *
                                    <input required type="number" min={0} step="0.01" data-testid="plan-price" value={planForm.price}
                                        onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></label>
                                <label className="text-sm">Currency
                                    <input maxLength={3} data-testid="plan-currency" value={planForm.currency}
                                        onChange={(e) => setPlanForm({ ...planForm, currency: e.target.value.toUpperCase() })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 uppercase dark:border-gray-600 dark:bg-gray-700" /></label>
                                <label className="text-sm">Interval
                                    <select data-testid="plan-interval" value={planForm.interval}
                                        onChange={(e) => setPlanForm({ ...planForm, interval: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 capitalize dark:border-gray-600 dark:bg-gray-700">
                                        {INTERVALS.map((i) => <option key={i} value={i}>{i}</option>)}
                                    </select></label>
                                <label className="text-sm">Duration (days)
                                    <input type="number" min={1} max={3650} step={1} data-testid="plan-duration" value={planForm.duration_days}
                                        onChange={(e) => setPlanForm({ ...planForm, duration_days: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></label>
                                <label className="text-sm sm:col-span-2">Features (comma separated)
                                    <textarea rows={2} data-testid="plan-features" value={planForm.features}
                                        placeholder="unlimited_access, priority_support"
                                        onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></label>
                                <label className="text-sm sm:col-span-2">Description
                                    <textarea rows={2} maxLength={2000} data-testid="plan-description" value={planForm.description}
                                        onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></label>
                                <label className="flex items-end gap-2 text-sm sm:col-span-2">Active (visible to subscribers)
                                    <input type="checkbox" data-testid="plan-active" checked={planForm.is_active}
                                        onChange={(e) => setPlanForm({ ...planForm, is_active: e.target.checked })}
                                        className="mb-2 h-4 w-4" /></label>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowPlanModal(false)}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">Cancel</button>
                                <button type="submit" data-testid="plan-save" disabled={savingPlan}
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
                                    {savingPlan ? 'Saving...' : editingPlan ? 'Save Changes' : 'Create Plan'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
