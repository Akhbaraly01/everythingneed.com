import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FinanceStats {
    total_revenue: number;
    total_payouts: number;
    pending_payouts: number;
    revenue_by_month: Array<{ month: string; revenue: number; orders: number }>;
    recent_transactions: Array<{ id: string; type: string; amount: number; description: string; created_at: string }>;
}

export default function AdminFinance() {
    const [stats, setStats] = useState<FinanceStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<FinanceStats>('/api/admin/finance')
            .then((res) => setStats(res.data))
            .catch(() => setStats(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <AppLayout title="Finance"><p className="p-12 text-center text-gray-500">Loading...</p></AppLayout>;
    if (!stats) return <AppLayout title="Finance"><p className="p-12 text-center text-red-500">Failed to load</p></AppLayout>;

    return (
        <AppLayout title="Finance">
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
                    <div className="mt-4 space-y-2">
                        {stats.recent_transactions.map((t) => (
                            <div key={t.id} className="flex items-center justify-between text-sm">
                                <div>
                                    <p className="text-gray-900 dark:text-white">{t.description}</p>
                                    <p className="text-xs text-gray-500">{formatDateTime(t.created_at)}</p>
                                </div>
                                <span className={`font-semibold ${t.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                    {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
