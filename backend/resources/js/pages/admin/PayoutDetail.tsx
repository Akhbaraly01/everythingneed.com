import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { api, errorMessage } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import Breadcrumb from '@/components/shared/Breadcrumb';
import { StatusBadge } from '@/components/shared/Ui';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

interface WithdrawalRow {
    id: string;
    vendor_id: string;
    amount: string | number;
    status: string;
    notes?: string | null;
    processed_at?: string | null;
    created_at: string;
}

interface VendorRow {
    id: string;
    store_name: string;
    is_verified: boolean;
}

interface CommissionTotal {
    status: string;
    total: string | number;
    count: number;
}

interface CommissionRow {
    id: string;
    order_id?: string | null;
    amount: string | number;
    rate: string | number;
    status: string;
    created_at: string;
}

interface Props {
    withdrawal: WithdrawalRow;
    vendor: VendorRow | null;
    recentWithdrawals: WithdrawalRow[];
    commissionTotals: CommissionTotal[];
    recentCommissions: CommissionRow[];
}

export default function AdminPayoutDetail({ withdrawal, vendor, recentWithdrawals, commissionTotals, recentCommissions }: Props) {
    const { workspace } = usePage().props as { workspace?: { adminHrefs?: string[] } };
    const canSee = (href: string) => (workspace?.adminHrefs ?? []).includes(href);
    const [busy, setBusy] = useState(false);

    const process = async () => {
        setBusy(true);
        try {
            await api.post(`/api/admin/finance/withdrawals/${withdrawal.id}/process`);
            toast.success('Withdrawal processed.');
            router.reload({ only: ['withdrawal', 'recentWithdrawals'] as never });
        } catch (e) {
            toast.error(errorMessage(e, 'Processing failed'));
        } finally {
            setBusy(false);
        }
    };

    const short = withdrawal.id.slice(0, 8);

    return (
        <AdminLayout title={`Payout ${short}`}>
            <Head title={`Payout ${short}`} />

            <div className="space-y-6">
                <Breadcrumb items={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Payouts', href: '/admin/payouts' }, { label: short }]} />

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/payouts" className="rounded-lg border border-gray-300 p-2 text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700" aria-label="Back to payouts">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(Number(withdrawal.amount ?? 0))}</h1>
                            <p className="font-mono text-xs text-gray-500">{withdrawal.id}</p>
                        </div>
                        <StatusBadge status={withdrawal.status} tone={withdrawal.status === 'paid' ? 'green' : 'amber'} />
                    </div>

                    {withdrawal.status !== 'paid' && (
                        <button
                            onClick={() => void process()}
                            disabled={busy}
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                            {busy ? 'Processing…' : 'Process payout'}
                        </button>
                    )}
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Vendor</p>
                        {vendor && canSee('/admin/vendors') ? (
                            <Link href={`/admin/vendors/${vendor.id}`} className="mt-1 block font-medium text-indigo-600 hover:underline">
                                {vendor.store_name}
                            </Link>
                        ) : (
                            <p className="mt-1 font-medium text-gray-900 dark:text-white">{vendor?.store_name ?? '—'}</p>
                        )}
                        {vendor && <p className="text-xs text-gray-500">{vendor.is_verified ? 'Verified' : 'Not verified'}</p>}
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Requested</p>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{formatDateTime(withdrawal.created_at)}</p>
                        <p className="text-xs text-gray-500">
                            {withdrawal.processed_at ? `Processed ${formatDateTime(withdrawal.processed_at)}` : 'Not yet processed'}
                        </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Notes</p>
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{withdrawal.notes || '—'}</p>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                        <h2 className="mb-3 font-semibold text-gray-900 dark:text-white">Commission balance</h2>
                        {commissionTotals.length === 0 ? (
                            <p className="text-sm text-gray-500">No commission records for this vendor.</p>
                        ) : (
                            <ul className="space-y-2 text-sm">
                                {commissionTotals.map((c) => (
                                    <li key={c.status} className="flex items-center justify-between">
                                        <StatusBadge status={c.status} tone={c.status === 'cleared' || c.status === 'paid' ? 'green' : 'blue'} />
                                        <span className="text-gray-500">{c.count} record{Number(c.count) === 1 ? '' : 's'}</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(Number(c.total ?? 0))}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {recentCommissions.length > 0 && (
                            <ul className="mt-4 divide-y border-t text-sm dark:divide-gray-700 dark:border-gray-700">
                                {recentCommissions.map((c) => (
                                    <li key={c.id} className="flex items-center justify-between gap-3 py-2">
                                        <div>
                                            {c.order_id && canSee('/admin/orders') ? (
                                                <Link href={`/admin/orders/${c.order_id}`} className="text-xs font-medium text-indigo-600 hover:underline">
                                                    Order {c.order_id.slice(0, 8)}
                                                </Link>
                                            ) : (
                                                <span className="text-xs text-gray-500">{c.order_id ? `Order ${c.order_id.slice(0, 8)}` : '—'}</span>
                                            )}
                                            <p className="text-xs text-gray-500">{formatDateTime(c.created_at)} · {Number(c.rate)}%</p>
                                        </div>
                                        <span className="font-medium">{formatCurrency(Number(c.amount ?? 0))}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900 dark:text-white">Other withdrawals from this vendor</h2>
                            {canSee('/admin/payouts') && (
                                <Link href="/admin/payouts" className="text-sm text-indigo-600 hover:underline">View all</Link>
                            )}
                        </div>
                        {recentWithdrawals.length === 0 ? (
                            <p className="text-sm text-gray-500">No other withdrawal requests.</p>
                        ) : (
                            <ul className="divide-y text-sm dark:divide-gray-700">
                                {recentWithdrawals.map((w) => (
                                    <li key={w.id}>
                                        <Link href={`/admin/payouts/${w.id}`} className="flex items-center justify-between gap-3 py-2 hover:opacity-80">
                                            <span className="text-xs text-gray-500">{formatDateTime(w.created_at)}</span>
                                            <div className="text-right">
                                                <p className="font-medium">{formatCurrency(Number(w.amount ?? 0))}</p>
                                                <StatusBadge status={w.status} tone={w.status === 'paid' ? 'green' : 'amber'} />
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            </div>
        </AdminLayout>
    );
}
