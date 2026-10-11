import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import type { WalletTransaction } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { formatPrice } from '@/lib/currency';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/lib/api';

interface TransactionProps {
    transaction_id: string;
}

export default function WalletTransactionPage({ transaction_id }: TransactionProps) {
    const [transaction, setTransaction] = useState<WalletTransaction | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get<{ data: WalletTransaction }>(`/api/wallet/transactions/${transaction_id}`)
            .then((res) => setTransaction(res.data))
            .catch((e) => setError(errorMessage(e, 'Transaction not found')))
            .finally(() => setLoading(false));
    }, [transaction_id]);

    return (
        <AppLayout title="Transaction">
            <Head title="Transaction" />
            <div className="mx-auto max-w-2xl space-y-6">
                <Link href="/wallet" className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    <ArrowLeft className="h-4 w-4" /> Back to Wallet
                </Link>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">Loading transaction...</p>
                    </div>
                ) : error || !transaction ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Transaction not found</h3>
                        <p className="mt-1 text-sm text-gray-500">{error ?? 'This transaction does not exist or belongs to another wallet.'}</p>
                    </div>
                ) : (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                            {transaction.type === 'credit' ? '+' : '-'}{formatPrice(transaction.amount)}
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">{transaction.description ?? transaction.type}</p>
                        <dl className="mt-6 space-y-3 text-sm">
                            <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
                                <dt className="text-gray-500">Type</dt>
                                <dd className="font-medium capitalize text-gray-900 dark:text-white">{transaction.type}</dd>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
                                <dt className="text-gray-500">Balance after</dt>
                                <dd className="font-medium text-gray-900 dark:text-white">{formatPrice(transaction.balance_after)}</dd>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
                                <dt className="text-gray-500">Reference</dt>
                                <dd className="font-mono text-xs text-gray-900 dark:text-white">{transaction.reference ?? '—'}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Date</dt>
                                <dd className="font-medium text-gray-900 dark:text-white">{formatDateTime(transaction.created_at)}</dd>
                            </div>
                        </dl>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
