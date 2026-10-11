import { Head, Link, usePage } from '@inertiajs/react';
import MarketplaceLayout from '@/layouts/MarketplaceLayout';
import { api, errorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import { ShoppingBag, Award, Heart, CreditCard, Receipt, Bell, BookOpen, MapPin, Lock, Settings, User, Calendar, MessageSquare, ClipboardList, History, Shield, BadgeCheck, Landmark, Headphones, RefreshCcw } from 'lucide-react';
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
    const { props } = usePage();
    const auth = (props.auth ?? null) as { user?: { name: string; email: string } } | null;
    const user = auth?.user ?? null;
    const [stats, setStats] = useState<AccountStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        setError(null);
        api.get<AccountStats>('/api/user/stats')
            .then((data) => setStats(data))
            .catch((e) => {
                setError(errorMessage(e, 'Failed to load your account summary'));
                setStats(null);
            })
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const links = [
        { label: 'Orders', href: '/orders', icon: ShoppingBag },
        { label: 'Wishlist', href: '/wishlist', icon: Heart },
        { label: 'Wallet', href: '/wallet', icon: CreditCard },
        { label: 'Bills', href: '/bills', icon: Receipt },
        { label: 'Financial Services', href: '/account/financial-services', icon: Landmark },
        { label: 'Payment Methods', href: '/account/payment-methods', icon: CreditCard },
        { label: 'Identity Verification', href: '/account/kyc', icon: BadgeCheck },
        { label: 'Support', href: '/account/support', icon: Headphones },
        { label: 'Notifications', href: '/notifications', icon: Bell },
        { label: 'My Learning', href: '/learn/my-learning', icon: BookOpen },
        { label: 'Certificates', href: '/learn/certificates', icon: Award },
        { label: 'Addresses', href: '/account/addresses', icon: MapPin },
        { label: 'Bookings', href: '/account/bookings', icon: Calendar },
        { label: 'Reviews', href: '/account/reviews', icon: MessageSquare },
        { label: 'Applications', href: '/account/applications', icon: ClipboardList },
        { label: 'Healthcare History', href: '/account/healthcare-history', icon: History },
        { label: 'Profile', href: '/account/profile', icon: Settings },
        { label: 'Security', href: '/account/change-password', icon: Lock },
        { label: 'Privacy', href: '/account/privacy', icon: Shield },
        { label: 'Sessions', href: '/account/sessions', icon: Lock },
        { label: 'Settings', href: '/settings', icon: Shield },
    ];

    return (
        <MarketplaceLayout title="Account">
            <Head title="Account" />
            <div className="container mx-auto px-3 py-4 space-y-6">
                <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {user?.name ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : <User className="h-5 w-5" />}
                    </span>
                    <div>
                        <h1 className="text-lg font-bold">{user?.name ?? 'My Account'}</h1>
                        <p className="text-xs text-muted-foreground">{user?.email ?? 'Manage orders, learning, wallet'}</p>
                    </div>
                </div>

                {!loading && error && (
                    <div className="rounded-xl border border-border bg-card p-4">
                        <p className="text-sm font-medium text-red-600">{error}</p>
                        <button onClick={load} className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-primary">
                            <RefreshCcw className="h-4 w-4" /> Retry
                        </button>
                    </div>
                )}

                {!loading && stats && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-xl border border-border bg-card p-4 text-center">
                            <p className="text-xs text-muted-foreground">Orders</p>
                            <p className="text-2xl font-bold">{stats.orders_count}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-card p-4 text-center">
                            <p className="text-xs text-muted-foreground">Wishlist</p>
                            <p className="text-2xl font-bold">{stats.wishlist_count}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-card p-4 text-center">
                            <p className="text-xs text-muted-foreground">Wallet</p>
                            <p className="text-lg font-bold">{formatPrice(stats.wallet_balance)}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-card p-4 text-center">
                            <p className="text-xs text-muted-foreground">Courses</p>
                            <p className="text-2xl font-bold">{stats.enrolled_courses}</p>
                        </div>
                    </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {links.map((link) => (
                        <Link key={link.href} href={link.href}
                            className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md">
                            <link.icon className="h-6 w-6 text-primary" />
                            <span className="font-semibold">{link.label}</span>
                        </Link>
                    ))}
                </div>

                {!loading && stats && stats.recent_orders.length > 0 && (
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h2 className="font-semibold">Recent Orders</h2>
                        <div className="mt-4 space-y-3">
                            {stats.recent_orders.map((o) => (
                                <Link key={o.id} href={`/orders/${o.id}`} className="flex items-center justify-between text-sm hover:text-primary">
                                    <span className="text-muted-foreground">{o.reference}</span>
                                    <span className="font-medium">{formatPrice(o.total)}</span>
                                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{o.status}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </MarketplaceLayout>
    );
}
