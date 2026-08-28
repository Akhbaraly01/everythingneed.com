import AppLayout from '@/layouts/AppLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
    ShoppingBag,
    Package,
    Calendar,
    Heart,
    CreditCard,
    TrendingUp,
    ArrowRight,
    MessageSquare,
    Briefcase,
    Bell,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface DashboardStats {
    orders_count: number;
    wishlist_count: number;
    wallet_balance: number;
    active_bookings: number;
    unread_messages: number;
    pending_orders: number;
    recent_activity: { type: string; title: string; date: string; icon: string }[];
}

export default function Dashboard() {
    const auth = usePage().props.auth as { id: string; name: string; email: string } | null;
    const user = (auth as unknown as { user?: { id: string; name: string; email: string } })?.user ?? auth;
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<DashboardStats>('/api/dashboard/stats')
            .then((data) => setStats(data))
            .catch(() => {
                setStats({
                    orders_count: 0,
                    wishlist_count: 0,
                    wallet_balance: 0,
                    active_bookings: 0,
                    unread_messages: 0,
                    pending_orders: 0,
                    recent_activity: [],
                });
            })
            .finally(() => setLoading(false));
    }, []);

    const statCards = [
        { name: 'Total Orders', value: stats?.orders_count ?? 0, icon: Package, href: '/orders', color: 'bg-blue-500' },
        { name: 'Active Bookings', value: stats?.active_bookings ?? 0, icon: Calendar, href: '/bookings', color: 'bg-green-500' },
        { name: 'Wishlist', value: stats?.wishlist_count ?? 0, icon: Heart, href: '/wishlist', color: 'bg-pink-500' },
        { name: 'Wallet Balance', value: formatCurrency(stats?.wallet_balance ?? 0), icon: CreditCard, href: '/wallet', color: 'bg-purple-500' },
    ];

    const quickActions = [
        { name: 'Browse Products', href: '/products', icon: ShoppingBag },
        { name: 'Book Appointment', href: '/healthcare', icon: Calendar },
        { name: 'View Orders', href: '/orders', icon: Package },
        { name: 'Wallet', href: '/wallet', icon: CreditCard },
        { name: 'Messages', href: '/messages', icon: MessageSquare },
        { name: 'Job Board', href: '/jobs', icon: Briefcase },
        { name: 'Notifications', href: '/notifications', icon: Bell },
        { name: 'Settings', href: '/settings', icon: TrendingUp },
    ];

    return (
        <AppLayout title="Dashboard">
            <Head title="Dashboard" />

            <div className="space-y-8">
                {/* Welcome */}
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Welcome back, {user?.name}!
                    </h2>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                        Here's what's happening with your account today.
                    </p>
                    {stats && (
                        <div className="mt-3 flex gap-4 text-sm text-gray-500">
                            {stats.pending_orders > 0 && (
                                <span className="rounded-full bg-yellow-100 px-3 py-1 text-yellow-800">
                                    {stats.pending_orders} pending order{stats.pending_orders !== 1 ? 's' : ''}
                                </span>
                            )}
                            {stats.unread_messages > 0 && (
                                <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-800">
                                    {stats.unread_messages} unread message{stats.unread_messages !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {statCards.map((stat) => (
                        <Link
                            key={stat.name}
                            href={stat.href}
                            className="group rounded-lg bg-white p-6 shadow transition hover:shadow-md dark:bg-gray-800"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        {stat.name}
                                    </p>
                                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                                        {loading ? '...' : stat.value}
                                    </p>
                                </div>
                                <div className={`rounded-lg p-3 ${stat.color}`}>
                                    <stat.icon className="h-6 w-6 text-white" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm text-gray-500">
                                View details
                                <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1" />
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
                    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {quickActions.map((action) => (
                            <Link
                                key={action.name}
                                href={action.href}
                                className="flex flex-col items-center rounded-lg border border-gray-200 p-4 text-center transition hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                            >
                                <action.icon className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                                <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {action.name}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                {stats && stats.recent_activity.length > 0 && (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
                        <div className="mt-4 space-y-4">
                            {stats.recent_activity.map((item, i) => (
                                <div key={i} className="flex items-center gap-4 rounded-lg border border-gray-100 p-4 dark:border-gray-700">
                                    <div className="rounded-full bg-indigo-100 p-2 dark:bg-indigo-900">
                                        <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
                                        <p className="text-xs text-gray-500">{item.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
