import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import type { Wallet, WalletTransaction } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { CreditCard, ArrowUpRight, ArrowDownLeft, Plus, Minus } from 'lucide-react';

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
                        </div>
                        <CreditCard className="h-12 w-12 text-indigo-200" />
                    </div>
                    <div className="mt-6 flex gap-3">
                        <button className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium hover:bg-white/30">
                            <Plus className="h-4 w-4" />
                            Deposit
                        </button>
                        <button className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium hover:bg-white/30">
                            <Minus className="h-4 w-4" />
                            Withdraw
                        </button>
                    </div>
                </div>

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
