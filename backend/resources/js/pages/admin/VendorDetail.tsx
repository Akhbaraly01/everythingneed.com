import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { api, errorMessage } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import Breadcrumb from '@/components/shared/Breadcrumb';
import { StatusBadge } from '@/components/shared/Ui';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useAuthPermissions } from '@/lib/permissions';

interface VendorRow {
    id: string;
    user_id: string;
    store_name: string;
    category: string;
    description?: string | null;
    is_verified: boolean;
    rating?: string | number | null;
    created_at: string;
}

interface Owner {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
}

interface Stats {
    products: number;
    orders: number;
    revenue: number;
    pending_withdrawals: number;
    pending_withdrawal_amount: number;
}

interface ProductRow {
    id: string;
    name: string;
    price: string | number;
    stock_quantity: number;
    is_active: boolean;
    created_at: string;
}

interface OrderRow {
    id: string;
    order_number: string;
    total_price: string | number;
    status: string;
    created_at: string;
    customer_name?: string | null;
}

interface WithdrawalRow {
    id: string;
    amount: string | number;
    status: string;
    created_at: string;
}

interface Props {
    vendor: VendorRow;
    owner: Owner | null;
    stats: Stats;
    recentProducts: ProductRow[];
    recentOrders: OrderRow[];
    withdrawals: WithdrawalRow[];
}

export default function AdminVendorDetail({ vendor, owner, stats, recentProducts, recentOrders, withdrawals }: Props) {
    const { workspace } = usePage().props as { workspace?: { adminHrefs?: string[] } };
    const canSee = (href: string) => (workspace?.adminHrefs ?? []).includes(href);
    const { can } = useAuthPermissions();
    const canApprove = can('vendors.vendors.approve');
    const canSuspend = can('vendors.vendors.suspend');
    const [busy, setBusy] = useState(false);

    const act = async (action: 'approve' | 'reject' | 'suspend' | 'restore', done: string) => {
        setBusy(true);
        try {
            await api.post(`/api/admin/vendors/${vendor.id}/${action}`);
            toast.success(done);
            router.reload({ only: ['vendor'] as never });
        } catch (e) {
            toast.error(errorMessage(e, 'Action failed'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <AdminLayout title={vendor.store_name}>
            <Head title={vendor.store_name} />

            <div className="space-y-6">
                <Breadcrumb items={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Vendors', href: '/admin/vendors' }, { label: vendor.store_name }]} />

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/vendors" className="rounded-lg border border-gray-300 p-2 text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700" aria-label="Back to vendors">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{vendor.store_name}</h1>
                            <p className="text-sm text-gray-500 capitalize">{vendor.category} · Joined {formatDateTime(vendor.created_at)}</p>
                        </div>
                        <StatusBadge status={vendor.is_verified ? 'verified' : 'pending'} tone={vendor.is_verified ? 'green' : 'amber'} />
                    </div>

                    <div className="flex items-center gap-3">
                        {!vendor.is_verified && canApprove && (
                            <>
                                <button
                                    onClick={() => void act('approve', `${vendor.store_name} approved.`)}
                                    disabled={busy}
                                    className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                >
                                    <CheckCircle className="h-4 w-4" /> Approve
                                </button>
                                <button
                                    onClick={() => void act('reject', `${vendor.store_name} rejected.`)}
                                    disabled={busy}
                                    className="flex items-center gap-1.5 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-700 dark:hover:bg-red-950/30"
                                >
                                    <XCircle className="h-4 w-4" /> Reject
                                </button>
                            </>
                        )}
                        {vendor.is_verified && canSuspend && (
                            <button
                                onClick={() => void act('suspend', `${vendor.store_name} suspended (unverified).`)}
                                disabled={busy}
                                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                <XCircle className="h-4 w-4" /> Suspend
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Owner</p>
                        {owner && canSee('/admin/users') ? (
                            <Link href={`/admin/users/${owner.id}`} className="mt-1 block font-medium text-indigo-600 hover:underline">{owner.name}</Link>
                        ) : (
                            <p className="mt-1 font-medium text-gray-900 dark:text-white">{owner?.name ?? '—'}</p>
                        )}
                        <p className="text-sm text-gray-500">{owner?.email ?? ''}</p>
                        {owner?.phone && <p className="text-sm text-gray-500">{owner.phone}</p>}
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Rating</p>
                        <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                            {vendor.rating != null ? Number(vendor.rating).toFixed(1) : '—'}
                        </p>
                        {vendor.description && <p className="mt-1 line-clamp-2 text-sm text-gray-500">{vendor.description}</p>}
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Pending withdrawals</p>
                        <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                            {stats.pending_withdrawals} · {formatCurrency(stats.pending_withdrawal_amount)}
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {[
                        { label: 'Products', value: stats.products },
                        { label: 'Orders', value: stats.orders },
                        { label: 'Revenue', value: formatCurrency(stats.revenue) },
                    ].map((s) => (
                        <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{s.label}</p>
                        </div>
                    ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900 dark:text-white">Recent products</h2>
                            {canSee('/admin/products') && (
                                <Link href="/admin/products" className="text-sm text-indigo-600 hover:underline">View all</Link>
                            )}
                        </div>
                        {recentProducts.length === 0 ? (
                            <p className="text-sm text-gray-500">No products yet.</p>
                        ) : (
                            <ul className="divide-y text-sm dark:divide-gray-700">
                                {recentProducts.map((p) => (
                                    <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{p.name}</p>
                                            <p className="text-xs text-gray-500">Stock {p.stock_quantity} · {formatDateTime(p.created_at)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">{formatCurrency(Number(p.price ?? 0))}</p>
                                            <StatusBadge status={p.is_active ? 'active' : 'inactive'} tone={p.is_active ? 'green' : 'gray'} />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900 dark:text-white">Recent orders</h2>
                            {canSee('/admin/orders') && (
                                <Link href="/admin/orders" className="text-sm text-indigo-600 hover:underline">View all</Link>
                            )}
                        </div>
                        {recentOrders.length === 0 ? (
                            <p className="text-sm text-gray-500">No orders yet.</p>
                        ) : (
                            <ul className="divide-y text-sm dark:divide-gray-700">
                                {recentOrders.map((o) => (
                                    <li key={o.id} className="flex items-center justify-between gap-3 py-2">
                                        <div>
                                            {canSee('/admin/orders') ? (
                                                <Link href={`/admin/orders/${o.id}`} className="font-mono text-xs font-medium text-indigo-600 hover:underline">
                                                    {o.order_number}
                                                </Link>
                                            ) : (
                                                <p className="font-mono text-xs">{o.order_number}</p>
                                            )}
                                            <p className="text-xs text-gray-500">{o.customer_name ?? '—'} · {formatDateTime(o.created_at)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">{formatCurrency(Number(o.total_price ?? 0))}</p>
                                            <StatusBadge status={o.status} tone={o.status === 'delivered' ? 'green' : o.status === 'cancelled' || o.status === 'refunded' ? 'red' : 'blue'} />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>

                <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900 dark:text-white">Recent withdrawals</h2>
                        {canSee('/admin/payouts') && (
                            <Link href="/admin/payouts" className="text-sm text-indigo-600 hover:underline">View all</Link>
                        )}
                    </div>
                    {withdrawals.length === 0 ? (
                        <p className="text-sm text-gray-500">No withdrawal requests.</p>
                    ) : (
                        <ul className="divide-y text-sm dark:divide-gray-700">
                            {withdrawals.map((w) => {
                                const row = (
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-xs text-gray-500">{formatDateTime(w.created_at)}</span>
                                        <div className="text-right">
                                            <p className="font-medium">{formatCurrency(Number(w.amount ?? 0))}</p>
                                            <StatusBadge status={w.status} tone={w.status === 'paid' ? 'green' : 'amber'} />
                                        </div>
                                    </div>
                                );
                                return (
                                    <li key={w.id} className="py-2">
                                        {canSee('/admin/payouts')
                                            ? <Link href={`/admin/payouts/${w.id}`} className="block hover:opacity-80">{row}</Link>
                                            : row}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            </div>
        </AdminLayout>
    );
}
