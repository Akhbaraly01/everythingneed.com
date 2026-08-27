import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { BarChart3, Users, ShoppingCart, DollarSign } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AdminAnalytics {
    total_users: number;
    new_users_today: number;
    total_orders: number;
    orders_today: number;
    total_revenue: number;
    revenue_today: number;
    user_growth: Array<{ month: string; count: number }>;
    revenue_by_category: Array<{ category: string; revenue: number }>;
}

export default function AdminAnalytics() {
    const [data, setData] = useState<AdminAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<AdminAnalytics>('/api/admin/analytics/overview')
            .then((res) => setData(res.data))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <AppLayout title="Admin Analytics"><p className="p-12 text-center text-gray-500">Loading...</p></AppLayout>;
    if (!data) return <AppLayout title="Admin Analytics"><p className="p-12 text-center text-red-500">Failed to load</p></AppLayout>;

    const cards = [
        { label: 'Total Users', value: data.total_users, sub: `${data.new_users_today} today`, icon: Users, color: 'text-blue-600' },
        { label: 'Total Orders', value: data.total_orders, sub: `${data.orders_today} today`, icon: ShoppingCart, color: 'text-green-600' },
        { label: 'Total Revenue', value: `$${data.total_revenue.toFixed(2)}`, sub: `$${data.revenue_today.toFixed(2)} today`, icon: DollarSign, color: 'text-yellow-600' },
    ];

    return (
        <AppLayout title="Admin Analytics">
            <Head title="Admin Analytics" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Analytics</h1>
                <div className="grid gap-4 sm:grid-cols-3">
                    {cards.map((c) => (
                        <div key={c.label} className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                            <p className="text-sm text-gray-500">{c.label}</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{c.value}</p>
                            <p className="text-xs text-gray-400">{c.sub}</p>
                        </div>
                    ))}
                </div>
                {data.user_growth.length > 0 && (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="font-semibold text-gray-900 dark:text-white">User Growth</h2>
                        <div className="mt-4 space-y-2">
                            {data.user_growth.map((m) => (
                                <div key={m.month} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">{m.month}</span>
                                    <span className="font-medium">{m.count} users</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {data.revenue_by_category.length > 0 && (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="font-semibold text-gray-900 dark:text-white">Revenue by Category</h2>
                        <div className="mt-4 space-y-2">
                            {data.revenue_by_category.map((c) => (
                                <div key={c.category} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400 capitalize">{c.category}</span>
                                    <span className="font-medium">${c.revenue.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
