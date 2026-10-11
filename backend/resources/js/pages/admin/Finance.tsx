import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

/** Real shape from ReportingService::financeSummary(). */
interface FinanceSummary {
    total_revenue: number;
    total_commissions: number;
    pending_payouts: number;
    revenue_by_month?: Array<{ month: string; revenue: number; orders: number }>;
}

/** Real payments row from ReportingService::paymentTransactions(). */
interface PaymentRow {
    id: string;
    amount: number;
    currency: string;
    status: string;
    method: string;
    reference: string;
    created_at: string;
}

interface FinanceStats {
    total_revenue: number;
    total_payouts: number;
    pending_payouts: number;
    revenue_by_month: Array<{ month: string; revenue: number; orders: number }>;
    recent_transactions: PaymentRow[];
}

const statusTextColor = (s: string): string =>
    s === 'succeeded' || s === 'completed'
        ? 'text-green-600'
        : s === 'failed' || s === 'refunded'
            ? 'text-red-600'
            : 'text-gray-500';

export default function AdminFinance() {
    const [stats, setStats] = useState<FinanceStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get<{ data: FinanceSummary }>('/api/admin/finance/summary'),
            api.get<{ data: PaymentRow[] }>('/api/admin/finance/transactions'),
        ])
            .then(([summary, tx]) => {
                setStats({
                    total_revenue: Number(summary.data?.total_revenue ?? 0),
                    total_payouts: Number(summary.data?.total_commissions ?? 0),
                    pending_payouts: Number(summary.data?.pending_payouts ?? 0),
                    revenue_by_month: (summary.data?.revenue_by_month ?? []).map((m) => ({
                        month: m.month,
                        revenue: Number(m.revenue ?? 0),
                        orders: Number(m.orders ?? 0),
                    })),
                    recent_transactions: (Array.isArray(tx.data) ? tx.data : []).slice(0, 5),
                });
            })
            .catch((e) => {
                setStats(null);
                toast.error(errorMessage(e, 'Failed to load finance data'));
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <AdminLayout title="Finance">
                <div className="space-y-4" aria-busy="true" aria-live="polite">
                    <div className="h-8 w-52 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                    <div className="grid gap-4 sm:grid-cols-4">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
                        ))}
                    </div>
                </div>
            </AdminLayout>
        );
    }
    if (!stats) {
        return (
            <AdminLayout title="Finance">
                <Head title="Admin Finance" />
                <p className="p-12 text-center text-red-500" role="alert">Failed to load finance data</p>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Finance">
            <Head title="Admin Finance" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Finance Overview</h1>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                        <p className="text-sm text-gray-500">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.total_revenue)}</p>
                    </div>
                    <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                        <p className="text-sm text-gray-500">Total Payouts</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.total_payouts)}</p>
                    </div>
                    <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                        <p className="text-sm text-gray-500">Pending Payouts</p>
                        <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.pending_payouts)}</p>
                    </div>
                    <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                        <p className="text-sm text-gray-500">Net Revenue</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.total_revenue - stats.total_payouts)}</p>
                    </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h2 className="font-semibold text-gray-900 dark:text-white">Monthly Revenue</h2>
                    <div className="mt-4 space-y-2">
                        {stats.revenue_by_month.map((m) => (
                            <div key={m.month} className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">{m.month}</span>
                                <span className="font-medium">{formatCurrency(m.revenue)}</span>
                                <span className="text-xs text-gray-500">{m.orders} orders</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h2 className="font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
                    {stats.recent_transactions.length === 0 ? (
                        <p className="mt-4 text-sm text-gray-500">No payment transactions yet.</p>
                    ) : (
                        <div className="mt-4 space-y-2">
                            {stats.recent_transactions.map((t) => (
                                <div key={t.id} className="flex items-center justify-between text-sm">
                                    <div>
                                        <p className="text-gray-900 dark:text-white">
                                            {t.method} <span className="text-xs text-gray-400">#{t.reference}</span>
                                        </p>
                                        <p className="text-xs text-gray-500">{formatDateTime(t.created_at)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(Number(t.amount))}</p>
                                        <p className={`text-xs ${statusTextColor(t.status)}`}>{t.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
