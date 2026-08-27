import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { ShoppingBag, Award, Heart, CreditCard, Bell, BookOpen, MapPin, Lock, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AccountStats {
    orders_count: number;
    wishlist_count: number;
    wallet_balance: number;
    certificates_count: number;
    enrolled_courses: number;
    addresses_count: number;
    recent_orders: Array<{ id: string; reference: string; total: number; status: string; created_at: string }>;
}

export default function AccountIndex() {
    const [stats, setStats] = useState<AccountStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<AccountStats>('/api/user/stats')
            .then((res) => setStats(res.data))
            .catch(() => setStats(null))
            .finally(() => setLoading(false));
    }, []);

    const links = [
        { label: 'Orders', href: '/orders', icon: ShoppingBag, color: 'text-blue-600' },
        { label: 'Wishlist', href: '/wishlist', icon: Heart, color: 'text-red-500' },
        { label: 'Wallet', href: '/wallet', icon: CreditCard, color: 'text-green-600' },
        { label: 'Notifications', href: '/notifications', icon: Bell, color: 'text-yellow-600' },
        { label: 'My Learning', href: '/learn/my-learning', icon: BookOpen, color: 'text-purple-600' },
        { label: 'Certificates', href: '/learn/certificates', icon: Award, color: 'text-indigo-600' },
        { label: 'Addresses', href: '/account/addresses', icon: MapPin, color: 'text-teal-600' },
        { label: 'Profile', href: '/account/profile', icon: Settings, color: 'text-gray-600' },
        { label: 'Security', href: '/account/change-password', icon: Lock, color: 'text-orange-600' },
    ];

    return (
        <AppLayout title="My Account">
            <Head title="My Account" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Account</h1>

                {!loading && stats && (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                            <p className="text-sm text-gray-500">Orders</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.orders_count}</p>
                        </div>
                        <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                            <p className="text-sm text-gray-500">Wishlist</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.wishlist_count}</p>
                        </div>
                        <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                            <p className="text-sm text-gray-500">Wallet</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.wallet_balance)}</p>
                        </div>
                        <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                            <p className="text-sm text-gray-500">Courses</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.enrolled_courses}</p>
                        </div>
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {links.map((link) => (
                        <Link key={link.href} href={link.href}
                            className="flex items-center gap-4 rounded-lg bg-white p-5 shadow transition hover:shadow-md dark:bg-gray-800">
                            <link.icon className={`h-8 w-8 ${link.color}`} />
                            <span className="font-semibold text-gray-900 dark:text-white">{link.label}</span>
                        </Link>
                    ))}
                </div>

                {!loading && stats && stats.recent_orders.length > 0 && (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="font-semibold text-gray-900 dark:text-white">Recent Orders</h2>
                        <div className="mt-4 space-y-3">
                            {stats.recent_orders.map((o) => (
                                <Link key={o.id} href={`/orders/${o.id}`} className="flex items-center justify-between text-sm hover:text-indigo-600">
                                    <span className="text-gray-500">{o.reference}</span>
                                    <span className="font-medium">{formatCurrency(o.total)}</span>
                                    <span className={`rounded-full px-2 py-0.5 text-xs ${o.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{o.status}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
