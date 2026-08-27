import AppLayout from '@/layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import type { Wallet, WalletTransaction } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { CreditCard, ArrowUpRight, ArrowDownLeft, Plus, Minus, X } from 'lucide-react';
import { useState } from 'react';
import { api } from '@/lib/api';

interface WalletProps {
    wallet: Wallet;
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

export default function WalletPage({ wallet, transactions }: WalletProps) {
    const [showDeposit, setShowDeposit] = useState(false);
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [amount, setAmount] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleDeposit = async () => {
        const value = parseFloat(amount);
        if (isNaN(value) || value <= 0) return;
        setProcessing(true);
        try {
            await api.post('/api/wallet/deposit', { amount: value });
            setShowDeposit(false);
            setAmount('');
            router.reload({ only: ['wallet', 'transactions'] });
        } catch {
        } finally {
            setProcessing(false);
        }
    };

    const handleWithdraw = async () => {
        const value = parseFloat(amount);
        if (isNaN(value) || value <= 0 || value > wallet.balance) return;
        setProcessing(true);
        try {
            await api.post('/api/wallet/withdraw', { amount: value });
            setShowWithdraw(false);
            setAmount('');
            router.reload({ only: ['wallet', 'transactions'] });
        } catch {
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
                            <p className="mt-2 text-4xl font-bold">{formatCurrency(wallet.balance)}</p>
                            <p className="mt-1 text-sm text-indigo-200">{wallet.currency}</p>
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
                            <p className="mt-1 text-sm text-gray-500">Available: {formatCurrency(wallet.balance)}</p>
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                                <input
                                    type="number"
                                    min="1"
                                    max={wallet.balance}
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="mt-6 flex gap-3">
                                <button onClick={() => setShowWithdraw(false)} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">Cancel</button>
                                <button
                                    onClick={handleWithdraw}
                                    disabled={processing || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > wallet.balance}
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
                    <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transactions</h3>
                    </div>
                    {transactions.data.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-gray-500">No transactions yet</p>
                        </div>
                    ) : (
                        <div className="divide-y dark:divide-gray-700">
                            {transactions.data.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between px-6 py-4">
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
                                        {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
