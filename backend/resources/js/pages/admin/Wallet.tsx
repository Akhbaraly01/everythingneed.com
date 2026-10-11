import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { api, errorMessage, rows } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import DataTable from '@/components/shared/DataTable';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

/** Real wallet transaction row (AdminDomainController::walletTransactions). */
interface WalletTxn {
    id: string;
    type: 'credit' | 'debit';
    amount: number;
    balance_after?: number | null;
    reference?: string | null;
    description?: string | null;
    created_at: string;
    user_name?: string | null;
    user_email?: string | null;
    currency?: string | null;
    wallet_balance?: number | string | null;
}

interface Meta {
    page: number;
    per_page: number;
    total: number;
}

export default function AdminWallet() {
    const [txns, setTxns] = useState<WalletTxn[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [type, setType] = useState('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        setLoading(true);
        const qs = new URLSearchParams({ page: String(page) });
        if (type !== 'all') qs.set('type', type);
        if (search.trim()) qs.set('search', search.trim());
        api.get<{ data: WalletTxn[]; meta: Meta }>(`/api/admin/wallet/transactions?${qs}`)
            .then((res) => { setTxns(rows<WalletTxn>(res)); setMeta(res.meta); })
            .catch((e) => { setTxns([]); toast.error(errorMessage(e, 'Failed to load ledger')); })
            .finally(() => setLoading(false));
    }, [type, search, page]);

    return (
        <AdminLayout title="Wallet Ledger">
            <Head title="Wallet Ledger" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Wallet Ledger</h1>
                    {meta && <span className="text-sm text-gray-500">{meta.total} transactions</span>}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {['all', 'credit', 'debit'].map((t) => (
                        <button key={t} onClick={() => { setType(t); setPage(1); }}
                            className={`rounded-full px-3 py-1 text-sm font-medium ${type === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}>
                            {t}
                        </button>
                    ))}
                    <input
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search user, email or reference..."
                        className="ml-auto w-64 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                </div>

                <DataTable
                    columns={[
                        {
                            key: 'user', header: 'User', accessor: 'user_name', sortable: true,
                            render: (t) => (
                                <>
                                    <p className="font-medium text-gray-900 dark:text-white">{t.user_name}</p>
                                    <p className="text-xs text-gray-500">{t.user_email}</p>
                                </>
                            ),
                        },
                        {
                            key: 'type', header: 'Type', accessor: 'type', sortable: true,
                            render: (t) => (
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium uppercase ${t.type === 'credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {t.type}
                                </span>
                            ),
                        },
                        {
                            key: 'amount', header: 'Amount', accessor: 'amount', sortable: true,
                            render: (t) => (
                                <span className={`font-semibold ${t.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                    {t.type === 'credit' ? '+' : '-'}{formatCurrency(Number(t.amount))}
                                </span>
                            ),
                        },
                        {
                            key: 'balance', header: 'Balance After', accessor: 'balance_after', sortable: true,
                            render: (t) => (
                                <span className="text-gray-700 dark:text-gray-300">{t.balance_after != null ? formatCurrency(Number(t.balance_after)) : '—'}</span>
                            ),
                        },
                        {
                            key: 'reference', header: 'Reference',
                            render: (t) => <span className="font-mono text-xs text-gray-500">{t.reference ?? '—'}</span>,
                        },
                        {
                            key: 'description', header: 'Description',
                            render: (t) => <span className="text-xs text-gray-500">{t.description || '—'}</span>,
                        },
                        {
                            key: 'date', header: 'Date', accessor: 'created_at', sortable: true,
                            render: (t) => <span className="text-xs text-gray-500">{formatDateTime(t.created_at)}</span>,
                        },
                    ]}
                    data={txns}
                    loading={loading}
                    emptyTitle="No transactions found"
                />

                {meta && meta.total > meta.per_page && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Page {meta.page} · {meta.total} transactions</span>
                        <div className="flex gap-2">
                            <button disabled={meta.page <= 1} onClick={() => setPage(page - 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Previous</button>
                            <button disabled={meta.page * meta.per_page >= meta.total} onClick={() => setPage(page + 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Next</button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
