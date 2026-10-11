import AppLayout from '@/layouts/AppLayout';
import {Head} from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {TrendingUp, Package, ShoppingCart, DollarSign} from 'lucide-react';
import { useEffect, useState } from 'react';

interface VendorStats {
    total_products: number;
    total_orders: number;
    total_revenue: number;
    pending_orders: number;
    recent_orders: Array<{ id: string; reference: string; total: number; status: string; created_at: string }>;
    top_products: Array<{ id: string; name: string; sold: number; revenue: number }>;
}

export default function VendorAnalytics() {
    const [stats, setStats] = useState<VendorStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const num = (v: unknown) => Number(v ?? 0);
        const load = async () => {
            try {
                // Own vendor id first so the catalogue count is scoped to
                // this store (the platform-wide query overstated it).
                const profile = await api.get<{ data: { id?: string } }>('/api/vendor/profile');
                const vendorId = profile.data?.id ?? '';
                const [earnings, ordersRes, productsRes, topRes] = await Promise.all([
                    api.get<{ data: { total_earned?: number } }>('/api/vendor/earnings'),
                    api.get<{ data: Array<{ id: string; total?: number; total_price?: number; amount?: number; status?: string; created_at?: string }>; meta?: { total?: number } }>('/api/vendor/orders?per_page=50'),
                    api.get<{ data: Array<{ id: string; name: string }>; meta?: { total?: number } }>(
                        `/api/products?per_page=100${vendorId ? `&vendor_id=${encodeURIComponent(vendorId)}` : ''}`,
                    ),
                    api.get<{ data: Array<{ id: string; name: string; sold: number; revenue: number }> }>('/api/vendor/orders/top-products'),
                ]);
                const orders = ordersRes.data ?? [];
                const pending = orders.filter((o) => ['pending', 'confirmed', 'processing'].includes(String(o.status ?? ''))).length;
                setStats({
                    total_products: Number(productsRes.meta?.total ?? productsRes.data?.length ?? 0),
                    total_orders: Number(ordersRes.meta?.total ?? orders.length),
                    total_revenue: num(earnings.data?.total_earned),
                    pending_orders: pending,
                    recent_orders: orders.slice(0, 5).map((o) => ({
                        id: String(o.id),
                        reference: String(o.id).slice(0, 8),
                        total: num(o.total ?? o.total_price ?? o.amount),
                        status: String(o.status ?? 'pending'),
                        created_at: String(o.created_at ?? ''),
                    })),
                    // Real aggregates from the Orders module (sold units and
                    // revenue per product) - never hard-coded zeros.
                    top_products: (Array.isArray(topRes.data) ? topRes.data : []).map((p) => ({
                        id: String(p.id),
                        name: p.name,
                        sold: num(p.sold),
                        revenue: num(p.revenue),
                    })),
                });
            } catch {
                setStats(null);
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, []);

    if (loading) return <AppLayout title="Vendor Analytics"><p className="p-12 text-center text-gray-500">Loading...</p></AppLayout>;
    if (!stats) return <AppLayout title="Vendor Analytics"><p className="p-12 text-center text-red-500">Failed to load</p></AppLayout>;

    const cards = [
        { label: 'Products', value: stats.total_products, icon: Package, color: 'text-blue-600' },
        { label: 'Orders', value: stats.total_orders, icon: ShoppingCart, color: 'text-green-600' },
        { label: 'Revenue', value: formatCurrency(stats.total_revenue), icon: DollarSign, color: 'text-yellow-600' },
        { label: 'Pending Orders', value: stats.pending_orders, icon: TrendingUp, color: 'text-orange-600' },
    ];

    return (
        <AppLayout title="Vendor Analytics">
            <Head title="Vendor Analytics" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {cards.map((c) => (
                        <div key={c.label} className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                            <p className="text-sm text-gray-500">{c.label}</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{c.value}</p>
                        </div>
                    ))}
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="font-semibold text-gray-900 dark:text-white">Recent Orders</h2>
                        <div className="mt-4 space-y-3">
                            {stats.recent_orders.map((o) => (
                                <div key={o.id} className="flex justify-between text-sm">
                                    <span className="text-gray-500">{o.reference}</span>
                                    <span className="font-medium">{formatCurrency(o.total)}</span>
                                    <span className="text-xs bg-gray-100 rounded px-2 py-0.5 dark:bg-gray-700">{o.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="font-semibold text-gray-900 dark:text-white">Top Products</h2>
                        <div className="mt-4 space-y-3">
                            {stats.top_products.length === 0 ? (
                                <p className="text-sm text-gray-500">Sales insights appear after your first orders.</p>
                            ) : (
                                stats.top_products.map((p) => (
                                    <div key={p.id} className="flex justify-between text-sm">
                                        <span className="text-gray-700 dark:text-gray-300">{p.name}</span>
                                        <span>{p.sold} sold</span>
                                        <span className="font-medium">{formatCurrency(p.revenue)}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
