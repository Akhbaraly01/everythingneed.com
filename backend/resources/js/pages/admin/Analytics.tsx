import AdminLayout from '@/layouts/AdminLayout';
import { Head, usePage } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { Users, ShoppingCart, DollarSign, Store, BarChart3, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type Range = '7d' | '30d' | '90d';

interface Overview {
    range: string;
    since: string;
    new_users: number;
    total_orders: number;
    total_revenue: number;
    active_vendors: number;
    total_users: number;
}

interface SeriesPoint {
    label: string;
    value: number;
}

interface FunnelStep {
    label: string;
    value: number;
}

interface DomainsData {
    range: string;
    since: string;
    series: Record<string, SeriesPoint[]>;
    funnel: {
        since: string;
        steps: FunnelStep[];
        signup_to_order_rate: number | null;
        order_to_paid_rate: number | null;
    };
}

/** Spec §63 domain metrics rendered under the headline charts. */
const DOMAIN_METRICS: { key: string; label: string }[] = [
    { key: 'orders', label: 'Orders' },
    { key: 'bookings', label: 'Bookings' },
    { key: 'healthcare', label: 'Healthcare tickets' },
    { key: 'learning', label: 'Course enrollments' },
    { key: 'needs', label: 'Needs requests' },
    { key: 'services', label: 'Vendor services' },
    { key: 'wallet', label: 'Wallet transactions' },
    { key: 'payments', label: 'Payments' },
];

const RANGES: Range[] = ['7d', '30d', '90d'];

const num = (v: unknown): number => Number(v ?? 0);

/** Horizontal bar list: real values only, scaled to the largest row. */
function BarList({ rows, format }: { rows: SeriesPoint[]; format: (n: number) => string }) {
    const max = Math.max(...rows.map((r) => num(r.value)), 1);
    return (
        <div className="mt-4 space-y-2">
            {rows.map((r) => (
                <div key={r.label} className="text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">{r.label}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{format(num(r.value))}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                        <div
                            className="h-1.5 rounded-full bg-blue-500"
                            style={{ width: `${Math.max(2, (num(r.value) / max) * 100)}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function AdminAnalytics() {
    const page = usePage();
    const permissions = (page.props.auth as { permissions?: string[] } | null)?.permissions ?? null;
    const canExport =
        permissions !== null &&
        (permissions.includes('*') || permissions.includes('analytics.overview.export'));

    const [range, setRange] = useState<Range>('30d');
    const [overview, setOverview] = useState<Overview | null>(null);
    const [growth, setGrowth] = useState<SeriesPoint[]>([]);
    const [revenue, setRevenue] = useState<SeriesPoint[]>([]);
    const [categories, setCategories] = useState<SeriesPoint[]>([]);
    const [traffic, setTraffic] = useState<SeriesPoint[]>([]);
    const [domains, setDomains] = useState<DomainsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            api.get<{ data: Overview }>(`/api/admin/analytics/overview?range=${range}`),
            api.get<{ data: SeriesPoint[] }>(`/api/admin/analytics/user-growth?range=${range}`),
            api.get<{ data: SeriesPoint[] }>(`/api/admin/analytics/revenue?range=${range}`),
            api.get<{ data: SeriesPoint[] }>('/api/admin/analytics/categories'),
            api.get<{ data: SeriesPoint[] }>(`/api/admin/analytics/traffic?range=${range}`),
            api.get<{ data: DomainsData }>(`/api/admin/analytics/domains?range=${range}`),
        ])
            .then(([ov, gr, rv, cat, tr, dm]) => {
                setOverview(ov.data ?? null);
                setGrowth(Array.isArray(gr.data) ? gr.data : []);
                setRevenue(Array.isArray(rv.data) ? rv.data : []);
                setCategories(Array.isArray(cat.data) ? cat.data : []);
                setTraffic(Array.isArray(tr.data) ? tr.data : []);
                setDomains(dm.data ?? null);
            })
            .catch((e) => {
                setOverview(null);
                toast.error(errorMessage(e, 'Failed to load analytics'));
            })
            .finally(() => setLoading(false));
    }, [range]);

    const handleExport = async () => {
        setExporting(true);
        try {
            await api.download(
                `/api/admin/analytics/export?range=${range}`,
                `everythingneed-analytics-${range}.csv`,
            );
            toast.success('Analytics CSV downloaded');
        } catch (e) {
            toast.error(errorMessage(e, 'Export failed'));
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout title="Admin Analytics">
                <div className="space-y-4" aria-busy="true" aria-live="polite">
                    <div className="h-8 w-56 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                    <div className="grid gap-4 sm:grid-cols-4">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
                        ))}
                    </div>
                </div>
            </AdminLayout>
        );
    }

    if (!overview) {
        return (
            <AdminLayout title="Admin Analytics">
                <Head title="Admin Analytics" />
                <p className="p-12 text-center text-red-500" role="alert">Failed to load analytics</p>
            </AdminLayout>
        );
    }

    const days = Number.parseInt(range, 10);

    const cards = [
        { label: `New Users (last ${days}d)`, value: num(overview.new_users).toLocaleString(), icon: Users, color: 'text-blue-600' },
        { label: `Orders (last ${days}d)`, value: num(overview.total_orders).toLocaleString(), icon: ShoppingCart, color: 'text-green-600' },
        { label: `Revenue (last ${days}d)`, value: `$${num(overview.total_revenue).toFixed(2)}`, icon: DollarSign, color: 'text-yellow-600' },
        { label: 'Verified Vendors (all time)', value: num(overview.active_vendors).toLocaleString(), icon: Store, color: 'text-purple-600' },
    ];

    const empty = growth.length === 0 && revenue.length === 0 && categories.length === 0 && traffic.length === 0;

    return (
        <AdminLayout title="Admin Analytics">
            <Head title="Admin Analytics" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Analytics</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Window: last {days} days (since {overview.since}) · {overview.total_users.toLocaleString()} users all time
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="inline-flex rounded-lg border border-gray-200 p-1 dark:border-gray-700" role="group" aria-label="Date range">
                            {RANGES.map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setRange(r)}
                                    aria-pressed={range === r}
                                    className={
                                        range === r
                                            ? 'rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white'
                                            : 'rounded-md px-3 py-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                                    }
                                >
                                    {Number.parseInt(r, 10)}d
                                </button>
                            ))}
                        </div>
                        {canExport && (
                            <button
                                type="button"
                                onClick={handleExport}
                                disabled={exporting}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                                <Download className="h-4 w-4" aria-hidden="true" />
                                {exporting ? 'Exporting…' : 'Export CSV'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {cards.map((c) => (
                        <div key={c.label} className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-500">{c.label}</p>
                                <c.icon className={`h-5 w-5 ${c.color}`} aria-hidden="true" />
                            </div>
                            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{c.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                            <BarChart3 className="h-4 w-4" aria-hidden="true" /> New Users (last {days} days)
                        </h2>
                        {growth.length > 0
                            ? <BarList rows={growth} format={(n) => `${n} users`} />
                            : <p className="mt-4 text-sm text-gray-500">No users registered in this period.</p>}
                    </div>

                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="font-semibold text-gray-900 dark:text-white">Revenue (last {days} days)</h2>
                        {revenue.length > 0
                            ? <BarList rows={revenue} format={(n) => `$${n.toFixed(2)}`} />
                            : <p className="mt-4 text-sm text-gray-500">No payments received in this period.</p>}
                    </div>

                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="font-semibold text-gray-900 dark:text-white">Products by Category</h2>
                        {categories.length > 0
                            ? <BarList rows={categories} format={(n) => `${n} products`} />
                            : <p className="mt-4 text-sm text-gray-500">No active products yet.</p>}
                    </div>

                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="font-semibold text-gray-900 dark:text-white">Traffic (audit events, last {days} days)</h2>
                        {traffic.length > 0
                            ? <BarList rows={traffic} format={(n) => `${n} events`} />
                            : <p className="mt-4 text-sm text-gray-500">No activity recorded in this period.</p>}
                    </div>
                </div>

                {/* Spec §63 — domain activity (real rows only; explicit empty states). */}
                <div>
                    <h2 className="mb-3 font-semibold text-gray-900 dark:text-white">
                        Domain activity (last {days} days)
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {DOMAIN_METRICS.map(({ key, label }) => {
                            const rows = domains?.series?.[key] ?? [];
                            const total = rows.reduce((sum, r) => sum + num(r.value), 0);
                            return (
                                <div key={key} className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                    <p className="text-sm text-gray-500">{label}</p>
                                    {rows.length > 0 ? (
                                        <>
                                            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                                                {total.toLocaleString()}
                                            </p>
                                            <BarList rows={rows} format={(n) => `${n}`} />
                                        </>
                                    ) : (
                                        <p className="mt-2 text-sm text-gray-500">
                                            No {label.toLowerCase()} recorded in this period.
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Spec §63 — conversion funnel (null rates = not enough data). */}
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                        Conversion funnel (since {domains?.funnel?.since ?? overview.since})
                    </h2>
                    {domains && domains.funnel.steps.some((s) => num(s.value) > 0) ? (
                        <>
                            <div className="mt-4 space-y-3">
                                {domains.funnel.steps.map((step) => (
                                    <div key={step.label} className="text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">{step.label}</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {num(step.value).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="mt-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                                            <div
                                                className="h-1.5 rounded-full bg-indigo-500"
                                                style={{
                                                    width: `${Math.max(2, (num(step.value) / Math.max(...domains.funnel.steps.map((s) => num(s.value)), 1)) * 100)}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 flex gap-6 text-sm">
                                <div>
                                    <span className="text-gray-500">Signup → order:</span>{' '}
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {domains.funnel.signup_to_order_rate !== null
                                            ? `${domains.funnel.signup_to_order_rate}%`
                                            : 'not enough data'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Order → paid:</span>{' '}
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {domains.funnel.order_to_paid_rate !== null
                                            ? `${domains.funnel.order_to_paid_rate}%`
                                            : 'not enough data'}
                                    </span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <p className="mt-4 text-sm text-gray-500">
                            No signups, orders or payments yet — the funnel fills in as activity happens.
                        </p>
                    )}
                </div>

                {empty && (
                    <p className="text-sm text-gray-500">No data recorded yet — charts appear once real activity exists.</p>
                )}
            </div>
        </AdminLayout>
    );
}
