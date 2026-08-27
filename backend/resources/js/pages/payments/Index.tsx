import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { CreditCard, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Payment {
    id: string;
    amount: number;
    currency: string;
    status: string;
    description?: string;
    method?: string;
    created_at: string;
}

export default function PaymentsIndex() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ data: Payment[] }>('/api/payments')
            .then((res) => setPayments(res.data))
            .catch(() => setPayments([]))
            .finally(() => setLoading(false));
    }, []);

    const statusColors: Record<string, string> = {
        completed: 'bg-green-100 text-green-800',
        pending: 'bg-yellow-100 text-yellow-800',
        failed: 'bg-red-100 text-red-800',
        refunded: 'bg-orange-100 text-orange-800',
    };

    return (
        <AppLayout title="Payments">
            <Head title="Payments" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment History</h1>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : payments.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">No payments yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {payments.map((p) => (
                            <div key={p.id} className="flex items-center justify-between rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{p.description ?? 'Payment'}</p>
                                    <p className="text-xs text-gray-500">{formatDateTime(p.created_at)}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[p.status] ?? 'bg-gray-100 text-gray-800'}`}>{p.status}</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(p.amount)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
