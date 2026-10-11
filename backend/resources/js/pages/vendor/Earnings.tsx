import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Wallet, TrendingUp, ArrowDownToLine, Hourglass } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { TableSkeleton } from '@/components/shared/Ui';
import VendorTabs from '@/components/vendor/VendorTabs';

interface Earnings {
    total_earned: number;
    withdrawn: number;
    pending_withdrawals: number;
    available: number;
    currency: string;
}

export default function VendorEarnings() {
    const [data, setData] = useState<Earnings | null>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(() => {
        api.get<{ data: Earnings }>('/api/vendor/earnings')
            .then((res) => setData(res.data))
            .catch((err) => toast.error(errorMessage(err, 'Could not load earnings')))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <AppLayout title="Vendor earnings">
            <Head title="Earnings" />
            <div className="mx-auto max-w-5xl space-y-4">
                <VendorTabs />

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Earnings</h1>
                        <p className="text-sm text-gray-500">Cleared commission from delivered orders.</p>
                    </div>
                    <Link
                        href="/vendor/payouts"
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                        Payouts
                    </Link>
                </div>

                {loading ? (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <TableSkeleton rows={1} cols={4} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <TrendingUp className="h-4 w-4 text-green-600" /> Total earned
                            </div>
                            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(data?.total_earned ?? 0, data?.currency ?? 'USD')}
                            </p>
                        </div>
                        <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Wallet className="h-4 w-4 text-indigo-600" /> Available
                            </div>
                            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(data?.available ?? 0, data?.currency ?? 'USD')}
                            </p>
                        </div>
                        <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Hourglass className="h-4 w-4 text-amber-600" /> Pending withdrawal
                            </div>
                            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(data?.pending_withdrawals ?? 0, data?.currency ?? 'USD')}
                            </p>
                        </div>
                        <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <ArrowDownToLine className="h-4 w-4 text-gray-500" /> Withdrawn
                            </div>
                            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(data?.withdrawn ?? 0, data?.currency ?? 'USD')}
                            </p>
                        </div>
                    </div>
                )}

                <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Earnings clear once an order is delivered and the commission is recorded.
                        Request a payout from the{' '}
                        <Link href="/vendor/payouts" className="font-medium text-indigo-600 hover:underline">
                            payouts page
                        </Link>
                        .
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
