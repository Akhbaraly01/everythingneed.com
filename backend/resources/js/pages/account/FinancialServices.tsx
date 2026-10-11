import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { Landmark, RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { formatPrice } from '@/lib/currency';

interface BillPurchase {
    id: string;
    service: string;
    amount: number;
    status: string;
    reference: string;
    created_at: string;
}

const LINKS = [
    { name: 'Pay Bills & Utilities', href: '/bills', blurb: 'Airtime, data, electricity, internet, TV.' },
    { name: 'Wallet', href: '/wallet', blurb: 'Balance, deposits, withdrawals, transfers.' },
    { name: 'Payment Methods', href: '/account/payment-methods', blurb: 'Available and saved references.' },
    { name: 'Payment History', href: '/payments', blurb: 'Every charge, refund and webhook event.' },
    { name: 'Identity Verification', href: '/kyc', blurb: 'Unlock withdrawals and wallet payments.' },
];

export default function FinancialServices() {
    const [recent, setRecent] = useState<BillPurchase[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        setError(null);
        api.get<{ data: BillPurchase[] }>('/api/bills/purchases?per_page=5')
            .then((res) => setRecent(Array.isArray(res.data) ? res.data : []))
            .catch((e) => {
                setError(errorMessage(e, 'Failed to load recent bill purchases'));
                setRecent([]);
            })
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    return (
        <AppLayout title="Financial Services">
            <Head title="Financial Services" />
            <div className="mx-auto max-w-3xl space-y-6">
                <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                    <Landmark className="h-6 w-6" /> Financial Services
                </h1>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {LINKS.map((link) => (
                        <Link key={link.href} href={link.href}
                            className="rounded-lg bg-white p-5 shadow hover:shadow-md dark:bg-gray-800">
                            <p className="font-semibold text-gray-900 dark:text-white">{link.name}</p>
                            <p className="mt-1 text-sm text-gray-500">{link.blurb}</p>
                        </Link>
                    ))}
                </div>

                <div className="rounded-lg bg-white shadow dark:bg-gray-800">
                    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent bill purchases</h3>
                        <Link href="/bills" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                            Pay bills →
                        </Link>
                    </div>
                    {loading ? (
                        <p className="p-6 text-center text-sm text-gray-500">Loading...</p>
                    ) : error ? (
                        <div className="p-6 text-center">
                            <p className="text-sm font-medium text-red-600">{error}</p>
                            <button onClick={load} className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                <RefreshCcw className="h-4 w-4" /> Retry
                            </button>
                        </div>
                    ) : recent.length === 0 ? (
                        <p className="p-6 text-center text-sm text-gray-500">No bill purchases yet.</p>
                    ) : (
                        <div className="divide-y dark:divide-gray-700">
                            {recent.map((purchase) => (
                                <div key={purchase.id} className="flex items-center justify-between px-6 py-4">
                                    <div>
                                        <p className="text-sm font-medium capitalize text-gray-900 dark:text-white">{purchase.service}</p>
                                        <p className="text-xs text-gray-500">{purchase.reference} · {formatDateTime(purchase.created_at)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold">{formatPrice(purchase.amount)}</p>
                                        <p className="text-xs capitalize text-gray-500">{purchase.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
