import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { User, Package, Heart, CreditCard, Bell, Award, BookOpen, MapPin, Lock, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AccountStats {
    orders_count: number;
    wishlist_count: number;
    wallet_balance: number;
    unread_notifications: number;
    certificates_count: number;
    enrolled_courses: number;
    addresses_count: number;
}

export default function AccountDashboard() {
    const [stats, setStats] = useState<AccountStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<AccountStats>('/api/user/stats')
            .then((res) => setStats(res.data))
            .catch(() => setStats(null))
            .finally(() => setLoading(false));
    }, []);

    const links = [
        { label: 'My Orders', href: '/orders', icon: Package, color: 'text-blue-600' },
        { label: 'Wishlist', href: '/wishlist', icon: Heart, color: 'text-red-500' },
        { label: 'Wallet', href: '/wallet', icon: CreditCard, color: 'text-green-600' },
        { label: 'Notifications', href: '/notifications', icon: Bell, color: 'text-yellow-600' },
        { label: 'My Learning', href: '/learn/my-learning', icon: BookOpen, color: 'text-purple-600' },
        { label: 'Certificates', href: '/learn/certificates', icon: Award, color: 'text-indigo-600' },
        { label: 'My Addresses', href: '/account/addresses', icon: MapPin, color: 'text-teal-600' },
        { label: 'My Profile', href: '/account/profile', icon: User, color: 'text-gray-600' },
        { label: 'Change Password', href: '/account/change-password', icon: Lock, color: 'text-orange-600' },
        { label: 'Settings', href: '/settings', icon: Settings, color: 'text-gray-500' },
    ];

    return (
        <AppLayout title="My Account">
            <Head title="My Account" />

            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Account</h1>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : stats ? (
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
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {links.map((link) => (
                        <Link key={link.href} href={link.href}
                            className="flex items-center gap-4 rounded-lg bg-white p-5 shadow transition hover:shadow-md dark:bg-gray-800">
                            <link.icon className={`h-8 w-8 ${link.color}`} />
                            <span className="font-semibold text-gray-900 dark:text-white">{link.label}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
