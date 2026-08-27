import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Users, Package, ShoppingCart, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AdminStats {
    total_users: number;
    total_vendors: number;
    total_orders: number;
    total_revenue: number;
    pending_approvals: number;
    open_tickets: number;
    recent_orders: Array<{ id: string; user_name?: string; total: number; status: string; created_at: string }>;
    top_vendors: Array<{ id: string; store_name: string; revenue: number; orders_count: number }>;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<AdminStats>('/api/admin/stats')
            .then((res) => setStats(res.data))
            .catch(() => setStats(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <AppLayout title="Admin Dashboard"><div className="flex items-center justify-center p-12"><p className="text-gray-500">Loading...</p></div></AppLayout>;

    if (!stats) return <AppLayout title="Admin Dashboard"><div className="p-12 text-center text-red-500">Failed to load stats</div></AppLayout>;

    const cards = [
        { label: 'Total Users', value: stats.total_users, icon: Users, href: '/admin/users', color: 'text-blue-600' },
        { label: 'Total Vendors', value: stats.total_vendors, icon: Package, href: '/admin/vendors', color: 'text-green-600' },
        { label: 'Total Orders', value: stats.total_orders, icon: ShoppingCart, href: '/admin/orders', color: 'text-purple-600' },
        { label: 'Revenue', value: formatCurrency(stats.total_revenue), icon: DollarSign, href: '/admin/orders', color: 'text-yellow-600' },
        { label: 'Pending Approvals', value: stats.pending_approvals, icon: AlertTriangle, href: '/admin/approvals', color: 'text-orange-600' },
        { label: 'Open Tickets', value: stats.open_tickets, icon: AlertTriangle, href: '/tickets', color: 'text-red-600' },
    ];

    return (
        <AppLayout title="Admin Dashboard">
            <Head title="Admin Dashboard" />

            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {cards.map((card) => (
                        <Link key={card.label} href={card.href}
                            className="rounded-lg bg-white p-6 shadow transition hover:shadow-md dark:bg-gray-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">{card.label}</p>
                                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                                </div>
                                <card.icon className={`h-8 w-8 ${card.color}`} />
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="font-semibold text-gray-900 dark:text-white">Recent Orders</h2>
                        <div className="mt-4 space-y-3">
                            {stats.recent_orders.map((o) => (
                                <div key={o.id} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">{o.user_name ?? o.id}</span>
                                    <span className="font-medium">{formatCurrency(o.total)}</span>
                                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-700">{o.status}</span>
                                </div>
                            ))}
                        </div>
                        <Link href="/admin/orders" className="mt-4 block text-center text-sm text-indigo-600 hover:underline">View all orders</Link>
                    </div>

                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="font-semibold text-gray-900 dark:text-white">Top Vendors</h2>
                        <div className="mt-4 space-y-3">
                            {stats.top_vendors.map((v) => (
                                <div key={v.id} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">{v.store_name}</span>
                                    <span className="font-medium">{formatCurrency(v.revenue)}</span>
                                    <span className="text-xs text-gray-500">{v.orders_count} orders</span>
                                </div>
                            ))}
                        </div>
                        <Link href="/admin/vendors" className="mt-4 block text-center text-sm text-indigo-600 hover:underline">View all vendors</Link>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
