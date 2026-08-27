import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Wallet, CheckCircle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Payout {
    id: string;
    vendor_name: string;
    amount: number;
    status: string;
    method?: string;
    reference?: string;
    processed_at?: string;
    created_at: string;
}

export default function AdminPayouts() {
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ data: Payout[] }>('/api/admin/payouts')
            .then((res) => setPayouts(res.data))
            .catch(() => setPayouts([]))
            .finally(() => setLoading(false));
    }, []);

    const processPayout = async (id: string) => {
        try {
            await api.post(`/api/admin/payouts/${id}/process`);
            setPayouts(payouts.map((p) => p.id === id ? { ...p, status: 'completed', processed_at: new Date().toISOString() } : p));
        } catch {}
    };

    return (
        <AppLayout title="Vendor Payouts">
            <Head title="Vendor Payouts" />

            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vendor Payouts</h1>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading...</p></div>
                ) : payouts.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Wallet className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No payout requests</h3>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3">Vendor</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Method</th>
                                    <th className="px-4 py-3">Requested</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {payouts.map((p) => (
                                    <tr key={p.id}>
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{p.vendor_name}</td>
                                        <td className="px-4 py-3 font-semibold">{formatCurrency(p.amount)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                                p.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {p.status === 'completed' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{p.method ?? 'Bank Transfer'}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(p.created_at)}</td>
                                        <td className="px-4 py-3">
                                            {p.status === 'pending' && (
                                                <button onClick={() => processPayout(p.id)}
                                                    className="rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-500">
                                                    Process
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
