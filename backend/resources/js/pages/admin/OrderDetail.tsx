import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { api, errorMessage } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import Breadcrumb from '@/components/shared/Breadcrumb';
import { StatusBadge, PromptDialog } from '@/components/shared/Ui';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { settableOptionsFor } from '@/lib/orderStatus';

interface OrderRow {
    id: string;
    order_number: string;
    status: string;
    product_name: string;
    quantity: number;
    unit_price: string | number;
    total_price: string | number;
    shipping_address?: string | null;
    notes?: string | null;
    created_at: string;
    customer_id?: string | null;
    vendor_id?: string | null;
    customer_name?: string | null;
    customer_email?: string | null;
    vendor_name?: string | null;
}

interface OrderItem {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: string | number;
    total_price: string | number;
}

interface Payment {
    id: string;
    amount: string | number;
    currency: string;
    status: string;
    method: string;
    reference: string;
    created_at: string;
}

interface Refund {
    id: string;
    amount: string | number;
    status: string;
    reason?: string | null;
    created_at: string;
}

interface Props {
    order: OrderRow;
    items: OrderItem[];
    payments: Payment[];
    refunds: Refund[];
}

export default function AdminOrderDetail({ order, items, payments, refunds }: Props) {
    const { workspace } = usePage().props as { workspace?: { adminHrefs?: string[] } };
    const canSee = (href: string) => (workspace?.adminHrefs ?? []).includes(href);
    const [busy, setBusy] = useState(false);
    const [refundOpen, setRefundOpen] = useState(false);

    const updateStatus = async (status: string) => {
        setBusy(true);
        try {
            await api.put(`/api/admin/orders/${order.id}/status`, { status });
            toast.success('Order status updated.');
            router.reload({ only: ['order'] as never });
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to update status'));
        } finally {
            setBusy(false);
        }
    };

    const issueRefund = async (reason: string) => {
        setRefundOpen(false);
        setBusy(true);
        try {
            await api.post(`/api/admin/orders/${order.id}/refund`, { reason: reason || null });
            toast.success('Refund issued.');
            router.reload({ only: ['order', 'refunds'] as never });
        } catch (e) {
            toast.error(errorMessage(e, 'Refund failed'));
        } finally {
            setBusy(false);
        }
    };

    const rows: OrderItem[] = items.length > 0
        ? items
        : [{
            id: order.id,
            product_name: order.product_name,
            quantity: order.quantity,
            unit_price: order.unit_price,
            total_price: order.total_price,
        }];

    const statusOptions = settableOptionsFor(order.status).filter((s) => s !== order.status);

    return (
        <AdminLayout title={`Order ${order.order_number}`}>
            <Head title={`Order ${order.order_number}`} />

            <div className="space-y-6">
                <Breadcrumb items={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Orders', href: '/admin/orders' }, { label: order.order_number }]} />

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/orders" className="rounded-lg border border-gray-300 p-2 text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700" aria-label="Back to orders">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div>
                            <h1 className="font-mono text-2xl font-bold text-gray-900 dark:text-white">{order.order_number}</h1>
                            <p className="text-sm text-gray-500">Placed {formatDateTime(order.created_at)}</p>
                        </div>
                        <StatusBadge status={order.status} />
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="sr-only" htmlFor="order-status">Order status</label>
                        <select
                            id="order-status"
                            value={order.status}
                            disabled={busy || statusOptions.length === 0}
                            onChange={(e) => void updateStatus(e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                            {/* Only legal transitions (order state machine); 'paid' is provider-owned. */}
                            {order.status === 'paid' && <option value="paid">paid (locked)</option>}
                            {statusOptions.length === 0 && order.status !== 'paid' && (
                                <option value={order.status}>{order.status} (final)</option>
                            )}
                            {statusOptions.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        {order.status !== 'refunded' && (
                            <button
                                onClick={() => setRefundOpen(true)}
                                disabled={busy}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                Issue refund
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Customer</p>
                        {canSee('/admin/users') && order.customer_id ? (
                            <Link href={`/admin/users/${order.customer_id}`} className="mt-1 block font-medium text-indigo-600 hover:underline">
                                {order.customer_name ?? 'View customer'}
                            </Link>
                        ) : (
                            <p className="mt-1 font-medium text-gray-900 dark:text-white">{order.customer_name ?? '—'}</p>
                        )}
                        <p className="text-sm text-gray-500">{order.customer_email ?? ''}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Vendor</p>
                        {canSee('/admin/vendors') && order.vendor_id ? (
                            <Link href={`/admin/vendors/${order.vendor_id}`} className="mt-1 block font-medium text-indigo-600 hover:underline">
                                {order.vendor_name ?? 'View vendor'}
                            </Link>
                        ) : (
                            <p className="mt-1 font-medium text-gray-900 dark:text-white">{order.vendor_name ?? '—'}</p>
                        )}
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total</p>
                        <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{formatCurrency(Number(order.total_price ?? 0))}</p>
                    </div>
                </div>

                <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-3 font-semibold text-gray-900 dark:text-white">Items</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b text-xs uppercase text-gray-500 dark:border-gray-700">
                                <tr>
                                    <th className="py-2 pr-4">Product</th>
                                    <th className="py-2 pr-4">Qty</th>
                                    <th className="py-2 pr-4">Unit</th>
                                    <th className="py-2">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {rows.map((it) => (
                                    <tr key={it.id}>
                                        <td className="py-2 pr-4 text-gray-900 dark:text-white">{it.product_name}</td>
                                        <td className="py-2 pr-4">{it.quantity}</td>
                                        <td className="py-2 pr-4">{formatCurrency(Number(it.unit_price ?? 0))}</td>
                                        <td className="py-2 font-medium">{formatCurrency(Number(it.total_price ?? 0))}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {(order.shipping_address || order.notes) && (
                        <div className="mt-4 grid gap-4 border-t pt-4 text-sm dark:border-gray-700 md:grid-cols-2">
                            {order.shipping_address && (
                                <div>
                                    <p className="text-xs font-medium uppercase text-gray-500">Shipping address</p>
                                    <p className="whitespace-pre-line text-gray-700 dark:text-gray-300">{order.shipping_address}</p>
                                </div>
                            )}
                            {order.notes && (
                                <div>
                                    <p className="text-xs font-medium uppercase text-gray-500">Notes</p>
                                    <p className="text-gray-700 dark:text-gray-300">{order.notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                <div className="grid gap-4 lg:grid-cols-2">
                    <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                        <h2 className="mb-3 font-semibold text-gray-900 dark:text-white">Payments</h2>
                        {payments.length === 0 ? (
                            <p className="text-sm text-gray-500">No payment records for this order.</p>
                        ) : (
                            <ul className="divide-y text-sm dark:divide-gray-700">
                                {payments.map((p) => (
                                    <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                                        <div>
                                            <p className="font-mono text-xs text-gray-500">{p.reference}</p>
                                            <p className="text-xs text-gray-500">{p.method} · {formatDateTime(p.created_at)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(Number(p.amount ?? 0))} {p.currency}</p>
                                            <StatusBadge status={p.status} tone={p.status === 'succeeded' ? 'green' : p.status === 'failed' ? 'red' : 'blue'} />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                        <h2 className="mb-3 font-semibold text-gray-900 dark:text-white">Refunds</h2>
                        {refunds.length === 0 ? (
                            <p className="text-sm text-gray-500">No refunds issued for this order.</p>
                        ) : (
                            <ul className="divide-y text-sm dark:divide-gray-700">
                                {refunds.map((r) => (
                                    <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                                        <div>
                                            <p className="text-xs text-gray-500">{formatDateTime(r.created_at)}</p>
                                            {r.reason && <p className="text-xs text-gray-500">{r.reason}</p>}
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(Number(r.amount ?? 0))}</p>
                                            <StatusBadge status={r.status} tone={r.status === 'completed' ? 'green' : r.status === 'rejected' ? 'red' : 'blue'} />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            </div>

            <PromptDialog
                open={refundOpen}
                title="Issue refund"
                description={`Refund for order ${order.order_number}. The reason is recorded with the audit log.`}
                placeholder="Reason (optional)"
                confirmLabel="Issue refund"
                danger
                busy={busy}
                onSubmit={(reason) => void issueRefund(reason)}
                onCancel={() => setRefundOpen(false)}
            />
        </AdminLayout>
    );
}
