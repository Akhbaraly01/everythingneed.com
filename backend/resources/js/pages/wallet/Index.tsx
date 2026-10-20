import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import type { Wallet, WalletTransaction } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { formatPrice } from '@/lib/currency';
import { CreditCard, ArrowUpRight, ArrowDownLeft, Plus, Minus, X, Send } from 'lucide-react';
import { useState } from 'react';
import { ApiError, api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/shared/Button';

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
    const [showTransfer, setShowTransfer] = useState(false);
    const [amount, setAmount] = useState('');
    const [processing, setProcessing] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [kycBlocked, setKycBlocked] = useState(false);
    const [transferEmail, setTransferEmail] = useState('');
    const [recipient, setRecipient] = useState<{ id: string; name: string; email: string } | null>(null);
    const [lookupState, setLookupState] = useState<'idle' | 'busy' | 'missing'>('idle');

    const lookupRecipient = async () => {
        const email = transferEmail.trim();
        if (!email) return;
        setLookupState('busy');
        setRecipient(null);
        try {
            const res = await api.get<{ data: { id: string; name: string; email: string } }>(
                `/api/wallet/recipients/lookup?email=${encodeURIComponent(email)}`,
            );
            setRecipient(res.data);
            setLookupState('idle');
        } catch {
            setLookupState('missing');
        }
    };

    const handleTransfer = async () => {
        const value = parseFloat(amount);
        if (isNaN(value) || value <= 0 || !recipient) return;
        setProcessing(true);
        setActionError(null);
        setKycBlocked(false);
        try {
            await api.post('/api/wallet/transfer', {
                to_user_id: recipient.id,
                amount: value,
                idempotency_key: newIdempotencyKey(),
            });
            setShowTransfer(false);
            setAmount('');
            setTransferEmail('');
            setRecipient(null);
            setLookupState('idle');
            toast.success(`Sent ${formatPrice(value)} to ${recipient.name}.`);
            router.reload({ only: ['wallet', 'available', 'pending', 'transactions'] });
        } catch (e) {
            setActionError(errorMessage(e, 'Transfer failed'));
            setKycBlocked(e instanceof ApiError && e.status === 403);
        } finally {
            setProcessing(false);
        }
    };

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
                        <Button
                            size="sm"
                            onClick={() => { setShowDeposit(true); setAmount(''); }}
                        >
                            <Plus className="h-4 w-4" />
                            Deposit
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => { setShowWithdraw(true); setAmount(''); }}
                        >
                            <Minus className="h-4 w-4" />
                            Withdraw
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => { setShowTransfer(true); setAmount(''); setTransferEmail(''); setRecipient(null); setLookupState('idle'); }}
                        >
                            <Send className="h-4 w-4" />
                            Transfer
                        </Button>
                    </div>
                </div>

                {/* Deposit Modal */}
                {showDeposit && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Deposit Funds</h3>
                                <Button variant="icon" iconOnly size="sm" aria-label="Close" onClick={() => setShowDeposit(false)}><X className="h-5 w-5" /></Button>
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
                                <Button variant="ghost" size="sm" className="flex-1" onClick={() => setShowDeposit(false)}>Cancel</Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="flex-1"
                                    onClick={handleDeposit}
                                    disabled={processing || !amount || parseFloat(amount) <= 0}
                                >
                                    {processing ? 'Processing...' : 'Deposit'}
                                </Button>
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
                                <Button variant="icon" iconOnly size="sm" aria-label="Close" onClick={() => setShowWithdraw(false)}><X className="h-5 w-5" /></Button>
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
                                <Button variant="ghost" size="sm" className="flex-1" onClick={() => setShowWithdraw(false)}>Cancel</Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="flex-1"
                                    onClick={handleWithdraw}
                                    disabled={processing || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > available}
                                >
                                    {processing ? 'Processing...' : 'Withdraw'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Transfer Modal */}
                {showTransfer && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Send to a Friend</h3>
                                <Button variant="icon" iconOnly size="sm" aria-label="Close" onClick={() => setShowTransfer(false)}><X className="h-5 w-5" /></Button>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">Available: {formatPrice(available)}</p>
                            <div className="mt-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Recipient email</label>
                                    <div className="mt-1 flex gap-2">
                                        <input
                                            type="email"
                                            value={transferEmail}
                                            onChange={(e) => { setTransferEmail(e.target.value); setRecipient(null); setLookupState('idle'); }}
                                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                                            placeholder="friend@example.com"
                                        />
                                        <Button size="sm" variant="outline" onClick={lookupRecipient} disabled={lookupState === 'busy' || !transferEmail.trim()}>
                                            {lookupState === 'busy' ? '...' : 'Find'}
                                        </Button>
                                    </div>
                                    {lookupState === 'missing' && (
                                        <p className="mt-1 text-xs text-red-600">No account found for that email.</p>
                                    )}
                                    {recipient && (
                                        <p className="mt-1 text-xs text-green-700 dark:text-green-400">
                                            Sending to <span className="font-semibold">{recipient.name}</span> ({recipient.email})
                                        </p>
                                    )}
                                </div>
                                <div>
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
                            </div>
                            {actionError && (
                                <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
                                    {actionError}
                                    {kycBlocked && (
                                        <Link href="/kyc" className="mt-1 block font-medium underline">
                                            Verify your identity to unlock transfers
                                        </Link>
                                    )}
                                </div>
                            )}
                            <div className="mt-6 flex gap-3">
                                <Button variant="ghost" size="sm" className="flex-1" onClick={() => setShowTransfer(false)}>Cancel</Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="flex-1"
                                    onClick={handleTransfer}
                                    disabled={processing || !recipient || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > available}
                                >
                                    {processing ? 'Sending...' : 'Send'}
                                </Button>
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
