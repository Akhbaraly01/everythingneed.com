import AppLayout from '@/layouts/AppLayout';
import { useApp } from '@/hooks/use-app';
import { Link } from '@inertiajs/react';
import {
    ShoppingBag,
    Package,
    Calendar,
    Heart,
    CreditCard,
    TrendingUp,
    ArrowRight,
} from 'lucide-react';

export default function Dashboard() {
    const { user } = useApp();

    const stats = [
        { name: 'Total Orders', value: '12', icon: Package, href: '/orders', color: 'bg-blue-500' },
        { name: 'Active Bookings', value: '3', icon: Calendar, href: '/bookings', color: 'bg-green-500' },
        { name: 'Wishlist Items', value: '8', icon: Heart, href: '/wishlist', color: 'bg-pink-500' },
        { name: 'Wallet Balance', value: '$245.00', icon: CreditCard, href: '/wallet', color: 'bg-purple-500' },
    ];

    const quickActions = [
        { name: 'Browse Products', href: '/products', icon: ShoppingBag },
        { name: 'Book Appointment', href: '/healthcare', icon: Calendar },
        { name: 'View Orders', href: '/orders', icon: Package },
        { name: 'Wallet', href: '/wallet', icon: CreditCard },
    ];

    return (
        <AppLayout title="Dashboard">
            <div className="space-y-8">
                {/* Welcome */}
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Welcome back, {user?.name}!
                    </h2>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                        Here's what's happening with your account today.
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => (
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
                                        {stat.value}
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
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
                    <div className="mt-4 space-y-4">
                        <div className="flex items-center gap-4 rounded-lg border border-gray-100 p-4 dark:border-gray-700">
                            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Order #ORD-12345 confirmed</p>
                                <p className="text-xs text-gray-500">2 hours ago</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 rounded-lg border border-gray-100 p-4 dark:border-gray-700">
                            <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
                                <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Appointment scheduled with Dr. Smith</p>
                                <p className="text-xs text-gray-500">Yesterday</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 rounded-lg border border-gray-100 p-4 dark:border-gray-700">
                            <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900">
                                <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Payment of $49.99 processed</p>
                                <p className="text-xs text-gray-500">3 days ago</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
