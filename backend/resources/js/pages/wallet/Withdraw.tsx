import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { ApiError, api, errorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/currency';

export default function WalletWithdraw() {
    const [amount, setAmount] = useState('');
    const [available, setAvailable] = useState<number | null>(null);
    const [balanceLoading, setBalanceLoading] = useState(true);
    const [balanceError, setBalanceError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [kycBlocked, setKycBlocked] = useState(false);
    const [done, setDone] = useState(false);

    const loadBalance = () => {
        setBalanceLoading(true);
        setBalanceError(null);
        api.get<{ data: { available: number } }>('/api/wallet/available')
            .then((res) => setAvailable(res.data.available))
            .catch((e) => {
                setAvailable(null);
                setBalanceError(errorMessage(e, 'Failed to load your available balance'));
            })
            .finally(() => setBalanceLoading(false));
    };

    useEffect(loadBalance, []);

    const submit = async () => {
        const value = parseFloat(amount);
        if (isNaN(value) || value <= 0) return;
        setProcessing(true);
        setError(null);
        setKycBlocked(false);
        try {
            await api.post('/api/wallet/withdraw', {
                amount: value,
                idempotency_key: typeof crypto !== 'undefined' && 'randomUUID' in crypto
                    ? crypto.randomUUID()
                    : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            });
            setDone(true);
            setAmount('');
        } catch (e) {
            setError(errorMessage(e, 'Withdrawal failed'));
            setKycBlocked(e instanceof ApiError && e.status === 403);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AppLayout title="Withdraw Funds">
            <Head title="Withdraw Funds" />
            <div className="mx-auto max-w-md space-y-6">
                <Link href="/wallet" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    ← Back to Wallet
                </Link>
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Withdraw Funds</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {balanceError ? (
                            <span className="text-red-600">
                                {balanceError}{' '}
                                <button type="button" onClick={loadBalance} className="font-medium underline">Retry</button>
                            </span>
                        ) : balanceLoading ? 'Loading available balance...' : `Available: ${formatPrice(available ?? 0)}`}
                        {' '}· verified identities only.
                    </p>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                        <input
                            type="number" min="1" step="0.01" value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                        />
                    </div>
                    {error && (
                        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
                            {error}
                            {kycBlocked && (
                                <Link href="/kyc" className="mt-1 block font-medium underline">
                                    Verify your identity to unlock withdrawals
                                </Link>
                            )}
                        </div>
                    )}
                    {done && (
                        <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-300">
                            Withdrawal successful. <Link href="/wallet" className="font-medium underline">View wallet</Link>
                        </div>
                    )}
                    <button onClick={submit} disabled={processing || !amount || parseFloat(amount) <= 0}
                        className="mt-6 w-full rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50">
                        {processing ? 'Processing...' : 'Withdraw'}
                    </button>
                </div>
            </div>
        </AppLayout>
    );
}
