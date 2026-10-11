import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import type { Wallet, WalletTransaction } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { formatPrice } from '@/lib/currency';
import { CreditCard, ArrowUpRight, ArrowDownLeft, Plus, Minus, X } from 'lucide-react';
import { useState } from 'react';
import { ApiError, api, errorMessage } from '@/lib/api';

interface WalletProps {
    wallet: Wallet;
    available: number;
    pending: number;
    typeFilter: string;
    transactions: {
        data: WalletTransaction[];
        meta: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        };
    };
}

const newIdempotencyKey = () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function WalletPage({ wallet, available, pending, typeFilter, transactions }: WalletProps) {
    const [showDeposit, setShowDeposit] = useState(false);
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [amount, setAmount] = useState('');
    const [processing, setProcessing] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [kycBlocked, setKycBlocked] = useState(false);

    const handleDeposit = async () => {
        const value = parseFloat(amount);
        if (isNaN(value) || value <= 0) return;
        setProcessing(true);
        setActionError(null);
        setKycBlocked(false);
        try {
            await api.post('/api/wallet/deposit', {
                amount: value,
                payment_method: 'card',
                idempotency_key: newIdempotencyKey(),
            });
            setShowDeposit(false);
            setAmount('');
            router.reload({ only: ['wallet', 'available', 'pending', 'transactions'] });
        } catch (e) {
            setActionError(errorMessage(e, 'Deposit failed'));
            setKycBlocked(e instanceof ApiError && e.status === 403);
        } finally {
            setProcessing(false);
        }
    };

    const handleWithdraw = async () => {
        const value = parseFloat(amount);
        if (isNaN(value) || value <= 0 || value > available) return;
        setProcessing(true);
        setActionError(null);
        setKycBlocked(false);
        try {
            await api.post('/api/wallet/withdraw', {
                amount: value,
                idempotency_key: newIdempotencyKey(),
            });
            setShowWithdraw(false);
            setAmount('');
            router.reload({ only: ['wallet', 'available', 'pending', 'transactions'] });
        } catch (e) {
            setActionError(errorMessage(e, 'Withdrawal failed'));
            setKycBlocked(e instanceof ApiError && e.status === 403);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AppLayout title="Wallet">
            <Head title="Wallet" />

            <div className="space-y-6">
                {/* Balance Card */}
                <div className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-indigo-100">Available Balance</p>
                            <p className="mt-2 text-4xl font-bold">{formatPrice(available)}</p>
                            <p className="mt-1 text-sm text-indigo-200">{wallet.currency}</p>
                            <p className="mt-2 text-xs text-indigo-200">
                                Total {formatPrice(wallet.balance)}
                                {pending > 0 && <> · {formatPrice(pending)} on hold</>}
                            </p>
                        </div>
                        <CreditCard className="h-12 w-12 text-indigo-200" />
                    </div>
                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={() => { setShowDeposit(true); setAmount(''); }}
                            className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium hover:bg-white/30"
                        >
                            <Plus className="h-4 w-4" />
                            Deposit
                        </button>
                        <button
                            onClick={() => { setShowWithdraw(true); setAmount(''); }}
                            className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium hover:bg-white/30"
                        >
                            <Minus className="h-4 w-4" />
                            Withdraw
                        </button>
                    </div>
                </div>

                {/* Deposit Modal */}
                {showDeposit && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Deposit Funds</h3>
                                <button onClick={() => setShowDeposit(false)}><X className="h-5 w-5" /></button>
                            </div>
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                                <input
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                                    placeholder="0.00"
                                />
                            </div>
                            {actionError && showDeposit && (
                                <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
                                    {actionError}
                                </div>
                            )}
                            <div className="mt-6 flex gap-3">
                                <button onClick={() => setShowDeposit(false)} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">Cancel</button>
                                <button
                                    onClick={handleDeposit}
                                    disabled={processing || !amount || parseFloat(amount) <= 0}
                                    className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                                >
                                    {processing ? 'Processing...' : 'Deposit'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Withdraw Modal */}
                {showWithdraw && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Withdraw Funds</h3>
                                <button onClick={() => setShowWithdraw(false)}><X className="h-5 w-5" /></button>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">Available: {formatPrice(available)}</p>
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                                <input
                                    type="number"
                                    min="1"
                                    max={available}
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                                    placeholder="0.00"
                                />
                            </div>
                            {actionError && showWithdraw && (
                                <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
                                    {actionError}
                                    {kycBlocked && (
                                        <Link href="/kyc" className="mt-1 block font-medium underline">
                                            Verify your identity to unlock withdrawals
                                        </Link>
                                    )}
                                </div>
                            )}
                            <div className="mt-6 flex gap-3">
                                <button onClick={() => setShowWithdraw(false)} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">Cancel</button>
                                <button
                                    onClick={handleWithdraw}
                                    disabled={processing || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > available}
                                    className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
                                >
                                    {processing ? 'Processing...' : 'Withdraw'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Transactions */}
                <div className="rounded-lg bg-white shadow dark:bg-gray-800">
                    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transactions</h3>
                        <select
                            value={typeFilter}
                            onChange={(e) => router.reload({ data: { type: e.target.value === 'all' ? undefined : e.target.value }, only: ['transactions', 'typeFilter'] })}
                            className="rounded-lg border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700"
                        >
                            <option value="all">All</option>
                            <option value="credit">Credits</option>
                            <option value="debit">Debits</option>
                        </select>
                    </div>
                    {transactions.data.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-gray-500">No transactions yet</p>
                        </div>
                    ) : (
                        <div className="divide-y dark:divide-gray-700">
                            {transactions.data.map((tx) => (
                                <Link key={tx.id} href={`/wallet/transactions/${tx.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <div className="flex items-center gap-3">
                                        <div className={`rounded-full p-2 ${
                                            tx.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                                        }`}>
                                            {tx.type === 'credit' ? (
                                                <ArrowDownLeft className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <ArrowUpRight className="h-4 w-4 text-red-600" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {tx.description ?? tx.type}
                                            </p>
                                            <p className="text-xs text-gray-500">{formatDateTime(tx.created_at)}</p>
                                        </div>
                                    </div>
                                    <span className={`text-sm font-semibold ${
                                        tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {tx.type === 'credit' ? '+' : '-'}{formatPrice(tx.amount)}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
