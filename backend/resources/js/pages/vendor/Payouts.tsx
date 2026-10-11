import { statusTone } from '@/lib/lifecycle';
import { useCallback, useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { api, errorMessage } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';
import { Wallet, BanknoteIcon, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface Summary {
    total_earned: number;
    withdrawn: number;
    pending_withdrawals: number;
    available: number;
    currency: string;
}

interface Withdrawal {
    id: string;
    amount: number | string;
    status: 'pending' | 'paid' | 'rejected';
    notes?: string | null;
    created_at: string;
}

export default function VendorPayouts() {
    const [summary, setSummary] = useState<Summary | null>(null);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState('');
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        try {
            const [s, p] = await Promise.all([
                api.get<{ data: Summary }>('/api/vendor/earnings'),
                api.get<{ data: Withdrawal[] }>('/api/vendor/payouts'),
            ]);
            setSummary(s.data);
            setWithdrawals(p.data);
        } catch (err) {
            toast.error(errorMessage(err, 'Failed to load earnings'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    const requestPayout = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        try {
            await api.post('/api/vendor/payouts/request', { amount: Number(amount) });
            toast.success('Payout requested');
            setAmount('');
            await load();
            router.reload({ only: [] });
        } catch (err) {
            toast.error(errorMessage(err, 'Request failed'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <AppLayout title="Vendor payouts">
            <Head title="Earnings & payouts" />
            <div className="mx-auto max-w-4xl px-4 py-8">
                <div className="mb-6 flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100"><Wallet className="h-6 w-6 text-emerald-600" /></span>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Earnings & Payouts</h1>
                        <p className="text-sm text-gray-500">Commission accrues when orders are delivered (platform fee 10%)</p>
                    </div>
                </div>

                {loading ? (
                    <p className="py-16 text-center text-sm text-gray-400">Loading…</p>
                ) : summary && (
                    <>
                        {/* Summary cards */}
                        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                            <Card icon={<BanknoteIcon className="h-5 w-5" />} label="Total earned" value={formatCurrency(summary.total_earned)} />
                            <Card icon={<Clock className="h-5 w-5" />} label="Pending withdrawals" value={formatCurrency(summary.pending_withdrawals)} />
                            <Card icon={<CheckCircle2 className="h-5 w-5" />} label="Withdrawn" value={formatCurrency(summary.withdrawn)} />
                            <Card icon={<Wallet className="h-5 w-5" />} label="Available" value={formatCurrency(summary.available)} highlight />
                        </div>

                        {/* Request payout */}
                        <form onSubmit={requestPayout} className="mb-8 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                            <div className="flex-1">
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Request withdrawal (available: <strong>{formatCurrency(summary.available)}</strong>)
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={summary.available}
                                    step="0.01"
                                    required
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    disabled={summary.available <= 0}
                                    className="w-full rounded-lg border-gray-300 text-sm disabled:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={busy || Number(amount) > summary.available || summary.available <= 0}
                                className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                                {busy ? 'Requesting…' : 'Request payout'}
                            </button>
                        </form>

                        {/* History */}
                        <h2 className="mb-3 font-bold text-gray-900 dark:text-white">Withdrawal history</h2>
                        {withdrawals.length === 0 ? (
                            <p className="rounded-xl bg-gray-50 p-8 text-center text-sm text-gray-400 dark:bg-gray-700/40">No withdrawals yet.</p>
                        ) : (
                            <ul className="space-y-2">
                                {withdrawals.map((w) => (
                                    <li key={w.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                                        <div>
                                            <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(Number(w.amount))}</span>
                                            {w.notes && <span className="ml-2 text-xs text-gray-500">{w.notes}</span>}
                                            <p className="text-[11px] text-gray-400">{formatDateTime(w.created_at)}</p>
                                        </div>
                                        <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusTone(w.status)}`}>
                                            {w.status === 'pending' && <Clock className="h-3 w-3" />}
                                            {w.status === 'paid' && <CheckCircle2 className="h-3 w-3" />}
                                            {w.status === 'rejected' && <XCircle className="h-3 w-3" />}
                                            {w.status}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}

function Card({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
    return (
        <div className={`rounded-xl border p-4 ${highlight ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30' : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'}`}>
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">{icon}</div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    );
}
