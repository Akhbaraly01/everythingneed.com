import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
    Package, ShoppingCart, Wallet, Star, ArrowRight,
    BadgeCheck, AlertTriangle, Store,
} from 'lucide-react';

interface Props {
    vendor: { id: string; store_name: string; category: string; is_verified: boolean; rating: number };
    stats: {
        products: number;
        active_products: number;
        orders_total: number;
        orders_pending: number;
        revenue_delivered: number;
        rating: number;
    };
    recentOrders: Array<{
        id: string;
        order_number: string;
        product_name: string;
        total_price: number | string;
        status: string;
        created_at: string;
        customer?: { name: string } | null;
    }>;
}

export default function VendorDashboard({ vendor, stats, recentOrders }: Props) {
    return (
        <AppLayout title="Vendor portal">
            <Head title="Vendor dashboard" />
            <div className="mx-auto max-w-6xl px-4 py-8">
                {/* Header */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100"><Store className="h-6 w-6 text-indigo-600" /></span>
                        <div>
                            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                                {vendor.store_name}
                                {vendor.is_verified && <BadgeCheck className="h-5 w-5 text-blue-500" />}
                            </h1>
                            <p className="text-sm capitalize text-gray-500">{vendor.category} · rating {Number(vendor.rating ?? 0).toFixed(1)} ★</p>
                        </div>
                    </div>
                    <Link href="/vendor/products" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                        Manage products
                    </Link>
                </div>

                {/* Stats */}
                <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <StatCard icon={<Package className="h-5 w-5" />} label="Products" value={String(stats.products)} sub={`${stats.active_products} active`} tone="indigo" />
                    <StatCard icon={<ShoppingCart className="h-5 w-5" />} label="Orders" value={String(stats.orders_total)} sub={stats.orders_pending > 0 ? `${stats.orders_pending} awaiting action` : 'all handled'} tone="amber" />
                    <StatCard icon={<Wallet className="h-5 w-5" />} label="Delivered revenue" value={formatCurrency(stats.revenue_delivered)} sub="lifetime" tone="green" />
                    <StatCard icon={<Star className="h-5 w-5" />} label="Store rating" value={`${Number(stats.rating ?? 0).toFixed(1)}`} sub="out of 5" tone="yellow" />
                </div>

                {stats.orders_pending > 0 && (
                    <div className="mb-6 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
                        <p className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-200">
                            <AlertTriangle className="h-4 w-4" /> {stats.orders_pending} order{stats.orders_pending > 1 ? 's' : ''} waiting for your confirmation
                        </p>
                        <Link href="/vendor/orders" className="text-sm font-medium text-amber-900 underline dark:text-amber-100">Review now</Link>
                    </div>
                )}

                {/* Recent orders */}
                <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-700">
                        <h2 className="font-bold text-gray-900 dark:text-white">Recent orders</h2>
                        <Link href="/vendor/orders" className="flex items-center gap-1 text-sm text-indigo-600 hover:underline">
                            View all <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                    {recentOrders.length === 0 ? (
                        <p className="px-5 py-10 text-center text-sm text-gray-400">No orders yet — publish products to start selling.</p>
                    ) : (
                        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                            {recentOrders.map((o) => (
                                <li key={o.id} className="flex items-center justify-between px-5 py-3">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{o.product_name}</p>
                                        <p className="text-xs text-gray-400">{o.order_number} · {o.customer?.name ?? 'Guest'} · {formatDate(o.created_at)}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                                            o.status === 'delivered' ? 'bg-green-100 text-green-800'
                                            : o.status === 'cancelled' ? 'bg-red-100 text-red-700'
                                            : 'bg-blue-100 text-blue-800'}`}>
                                            {o.status}
                                        </span>
                                        <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(Number(o.total_price))}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

function StatCard({ icon, label, value, sub, tone }: {
    icon: React.ReactNode; label: string; value: string; sub?: string; tone: string;
}) {
    const tones: Record<string, string> = {
        indigo: 'bg-indigo-100 text-indigo-600',
        amber: 'bg-amber-100 text-amber-600',
        green: 'bg-green-100 text-green-600',
        yellow: 'bg-yellow-100 text-yellow-600',
    };

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}>{icon}</div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
            {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
        </div>
    );
}
