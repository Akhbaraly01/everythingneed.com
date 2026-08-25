import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { api, ApiError } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, ShieldCheck, PackageSearch, History } from 'lucide-react';

interface PendingProduct {
    id: string;
    name: string;
    category: string;
    price: string | number;
    stock_quantity: number;
    created_at: string;
    vendor_name?: string | null;
}

interface Decision {
    id: string;
    product_name: string;
    reason?: string | null;
    created_at: string;
}

interface Props {
    pending: PendingProduct[];
    recentDecisions: Decision[];
}

export default function AdminApprovals({ pending, recentDecisions }: Props) {
    const [busyId, setBusyId] = useState<string | null>(null);

    const decide = async (id: string, action: 'approve' | 'reject') => {
        let reason: string | null = null;

        if (action === 'reject') {
            reason = window.prompt('Reason for rejection (stored in the audit trail):');
            if (reason === null) return; // cancelled
        }

        setBusyId(id);
        try {
            await api.post(`/api/admin/products/${id}/${action}`,
                action === 'reject' ? { reason: reason || null } : {});
            toast.success(action === 'approve' ? 'Approved and published' : 'Rejected');
            router.reload({ only: ['pending', 'recentDecisions'] as never });
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Action failed');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <AppLayout title="Admin · Approvals">
            <Head title="Product approvals" />
            <div className="mx-auto max-w-5xl px-4 py-8">
                <div className="mb-6 flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100">
                        <ShieldCheck className="h-6 w-6 text-amber-600" />
                    </span>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Product Approvals</h1>
                        <p className="text-sm text-gray-500">{pending.length} submission{pending.length === 1 ? '' : 's'} awaiting review</p>
                    </div>
                </div>

                {/* Queue */}
                {pending.length === 0 ? (
                    <div className="mb-8 rounded-xl border border-dashed border-gray-300 p-14 text-center dark:border-gray-600">
                        <PackageSearch className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                        <p className="font-medium text-gray-900 dark:text-white">Queue is clear</p>
                        <p className="text-sm text-gray-500">New vendor submissions will appear here.</p>
                    </div>
                ) : (
                    <div className="mb-8 space-y-3">
                        {pending.map((p) => (
                            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{p.name}</p>
                                    <p className="mt-0.5 text-xs text-gray-500">
                                        {p.vendor_name ?? 'Unknown vendor'} · {p.category} · stock {p.stock_quantity}
                                    </p>
                                    <p className="text-[11px] text-gray-400">submitted {formatDateTime(p.created_at)}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-indigo-600">{formatCurrency(Number(p.price))}</span>
                                    <button
                                        disabled={busyId === p.id}
                                        onClick={() => decide(p.id, 'approve')}
                                        className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                                    </button>
                                    <button
                                        disabled={busyId === p.id}
                                        onClick={() => decide(p.id, 'reject')}
                                        className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50"
                                    >
                                        <XCircle className="h-3.5 w-3.5" /> Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Recent rejections (audit trail) */}
                <h2 className="mb-3 flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                    <History className="h-5 w-5" /> Recent rejections
                </h2>
                {recentDecisions.length === 0 ? (
                    <p className="rounded-xl bg-gray-50 p-5 text-center text-sm text-gray-400 dark:bg-gray-700/40">No rejections recorded.</p>
                ) : (
                    <ul className="space-y-2">
                        {recentDecisions.map((d) => (
                            <li key={d.id} className="rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-800">
                                <span className="font-medium text-gray-900 dark:text-white">{d.product_name}</span>
                                {d.reason && <span className="text-gray-500"> — “{d.reason}”</span>}
                                <span className="ml-2 text-xs text-gray-400">{formatDateTime(d.created_at)}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </AppLayout>
    );
}
