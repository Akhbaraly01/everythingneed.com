import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { BarChart3, TrendingUp, ShoppingCart, Eye } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AnalyticsSummary {
    total_orders: number;
    total_spent: number;
    total_wishlist: number;
    orders_by_month: Array<{ month: string; count: number; total: number }>;
    recent_views: number;
}

export default function AnalyticsIndex() {
    const [data, setData] = useState<AnalyticsSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<AnalyticsSummary>('/api/analytics/summary')
            .then((res) => setData(res.data))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <AppLayout title="My Analytics"><p className="p-12 text-center text-gray-500">Loading...</p></AppLayout>;
    if (!data) return <AppLayout title="My Analytics"><p className="p-12 text-center text-red-500">Failed to load</p></AppLayout>;

    const cards = [
        { label: 'Total Orders', value: data.total_orders, icon: ShoppingCart, color: 'text-blue-600' },
        { label: 'Total Spent', value: formatCurrency(data.total_spent), icon: TrendingUp, color: 'text-green-600' },
        { label: 'Wishlist Items', value: data.total_wishlist, icon: Eye, color: 'text-red-500' },
    ];

    return (
        <AppLayout title="My Analytics">
            <Head title="My Analytics" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Analytics</h1>
                <div className="grid gap-4 sm:grid-cols-3">
                    {cards.map((c) => (
                        <div key={c.label} className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                            <p className="text-sm text-gray-500">{c.label}</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{c.value}</p>
                        </div>
                    ))}
                </div>
                {data.orders_by_month.length > 0 && (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="font-semibold text-gray-900 dark:text-white">Orders by Month</h2>
                        <div className="mt-4 space-y-2">
                            {data.orders_by_month.map((m) => (
                                <div key={m.month} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">{m.month}</span>
                                    <span className="font-medium">{m.count} orders</span>
                                    <span>{formatCurrency(m.total)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
