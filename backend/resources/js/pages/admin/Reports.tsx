import AdminLayout from '@/layouts/AdminLayout';
import { Head, usePage } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, ShoppingCart, TrendingUp, Users, FileText, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface SalesReport {
    period: { start: string; end: string };
    total_revenue: number;
    total_orders: number;
    avg_order_value: number;
    daily_breakdown: Record<string, { revenue: number; orders: number }>;
}

interface AnalyticsReport {
    period: { start: string; end: string };
    total_events: number;
    event_breakdown: Record<string, number>;
    unique_users: number;
}

const isoDate = (d: Date): string => d.toISOString().slice(0, 10);
const defaultStart = (): string => isoDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
const defaultEnd = (): string => isoDate(new Date());

const num = (v: unknown): number => Number(v ?? 0);

export default function AdminReports() {
    const page = usePage();
    const permissions = (page.props.auth as { permissions?: string[] } | null)?.permissions ?? null;
    const canExport =
        permissions !== null &&
        (permissions.includes('*') || permissions.includes('reports.reports.export'));

    const [startDate, setStartDate] = useState(defaultStart);
    const [endDate, setEndDate] = useState(defaultEnd);
    const [sales, setSales] = useState<SalesReport | null>(null);
    const [analytics, setAnalytics] = useState<AnalyticsReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    const load = (start: string, end: string) => {
        setLoading(true);
        const qs = `start_date=${start}&end_date=${end}`;
        Promise.all([
            api.get<{ data: SalesReport }>(`/api/admin/reports/sales?${qs}`),
            api.get<{ data: AnalyticsReport }>(`/api/admin/reports/analytics?${qs}`),
        ])
            .then(([s, a]) => {
                setSales(s.data ?? null);
                setAnalytics(a.data ?? null);
            })
            .catch((e) => {
                setSales(null);
                setAnalytics(null);
                toast.error(errorMessage(e, 'Failed to load reports'));
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load(defaultStart(), defaultEnd());
    }, []);

    const apply = () => {
        if (!startDate || !endDate) {
            toast.error('Pick both a start and an end date');
            return;
        }
        if (startDate > endDate) {
            toast.error('Start date must be on or before the end date');
            return;
        }
        load(startDate, endDate);
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            await api.download(
                `/api/admin/reports/export?start_date=${startDate}&end_date=${endDate}`,
                `everythingneed-sales-report-${startDate}-${endDate}.csv`,
            );
            toast.success('Sales report CSV downloaded');
        } catch (e) {
            toast.error(errorMessage(e, 'Export failed'));
        } finally {
            setExporting(false);
        }
    };

    if (loading && !sales) {
        return (
            <AdminLayout title="Admin Reports">
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

    if (!sales || !analytics) {
        return (
            <AdminLayout title="Admin Reports">
                <Head title="Admin Reports" />
                <p className="p-12 text-center text-red-500" role="alert">Failed to load reports</p>
            </AdminLayout>
        );
    }

    const daily = Object.entries(sales.daily_breakdown ?? {}).sort((a, b) => (a[0] < b[0] ? 1 : -1));
    const events = Object.entries(analytics.event_breakdown ?? {}).sort((a, b) => num(b[1]) - num(a[1]));
    const maxEvent = Math.max(...events.map(([, v]) => num(v)), 1);

    const cards = [
        { label: 'Revenue', value: formatCurrency(num(sales.total_revenue)), icon: DollarSign, color: 'text-yellow-600' },
        { label: 'Orders', value: num(sales.total_orders).toLocaleString(), icon: ShoppingCart, color: 'text-green-600' },
        { label: 'Avg Order Value', value: formatCurrency(num(sales.avg_order_value)), icon: TrendingUp, color: 'text-blue-600' },
        { label: 'Unique Event Users', value: num(analytics.unique_users).toLocaleString(), icon: Users, color: 'text-purple-600' },
    ];

    return (
        <AdminLayout title="Admin Reports">
            <Head title="Admin Reports" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Sales &amp; platform activity for {startDate} → {endDate}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                        <label className="text-sm text-gray-500">
                            Start
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="ml-2 rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            />
                        </label>
                        <label className="text-sm text-gray-500">
                            End
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="ml-2 rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            />
                        </label>
                        <button
                            type="button"
                            onClick={apply}
                            disabled={loading}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Loading…' : 'Apply'}
                        </button>
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
                            <FileText className="h-4 w-4" aria-hidden="true" /> Sales by Day
                        </h2>
                        {daily.length > 0 ? (
                            <div className="mt-4 overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200 text-left text-gray-500 dark:border-gray-700">
                                            <th className="py-2 font-medium">Date</th>
                                            <th className="py-2 text-right font-medium">Revenue</th>
                                            <th className="py-2 text-right font-medium">Orders</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {daily.map(([date, day]) => (
                                            <tr key={date} className="border-b border-gray-100 dark:border-gray-800">
                                                <td className="py-2 text-gray-600 dark:text-gray-400">{date}</td>
                                                <td className="py-2 text-right font-medium text-gray-900 dark:text-white">
                                                    {formatCurrency(num(day.revenue))}
                                                </td>
                                                <td className="py-2 text-right text-gray-900 dark:text-white">{num(day.orders)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="mt-4 text-sm text-gray-500">No sales in this period.</p>
                        )}
                    </div>

                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="font-semibold text-gray-900 dark:text-white">
                            Events by Type ({num(analytics.total_events).toLocaleString()} total)
                        </h2>
                        {events.length > 0 ? (
                            <div className="mt-4 space-y-2">
                                {events.map(([type, count]) => (
                                    <div key={type} className="text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">{type}</span>
                                            <span className="font-medium text-gray-900 dark:text-white">{num(count)}</span>
                                        </div>
                                        <div className="mt-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                                            <div
                                                className="h-1.5 rounded-full bg-blue-500"
                                                style={{ width: `${Math.max(2, (num(count) / maxEvent) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="mt-4 text-sm text-gray-500">No events in this period.</p>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
