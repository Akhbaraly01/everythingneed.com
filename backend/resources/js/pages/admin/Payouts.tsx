import AdminLayout from '@/layouts/AdminLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import DataTable from '@/components/shared/DataTable';
import { CheckCircle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

/** Real vendor_withdrawals row (VendorQueryService::withdrawals + notes). */
interface Payout {
    id: string;
    vendor_id: string;
    vendor_name: string;
    amount: number;
    status: 'pending' | 'paid';
    notes?: string | null;
    processed_at?: string | null;
    created_at: string;
}

export default function AdminPayouts() {
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [loading, setLoading] = useState(true);
    const { workspace } = usePage().props as { workspace?: { adminHrefs?: string[] } };
    const canSeeVendorPage = (workspace?.adminHrefs ?? []).includes('/admin/vendors');

    useEffect(() => {
        api.get<{ data: Payout[] }>('/api/admin/finance/withdrawals')
            .then((res) => setPayouts((res.data ?? []).map((p) => ({ ...p, vendor_name: p.vendor_name ?? 'Vendor' }))))
            .catch((e) => {
                setPayouts([]);
                toast.error(errorMessage(e, 'Failed to load payouts'));
            })
            .finally(() => setLoading(false));
    }, []);

    const processPayout = async (id: string) => {
        try {
            await api.post(`/api/admin/finance/withdrawals/${id}/process`);
            setPayouts(payouts.map((p) => (p.id === id ? { ...p, status: 'paid', processed_at: new Date().toISOString() } : p)));
            toast.success('Withdrawal processed.');
        } catch (e) {
            toast.error(errorMessage(e, 'Processing failed'));
        }
    };

    return (
        <AdminLayout title="Vendor Payouts">
            <Head title="Vendor Payouts" />

            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vendor Payouts</h1>

                <DataTable
                    columns={[
                        {
                            key: 'vendor', header: 'Vendor', accessor: 'vendor_name', sortable: true,
                            render: (p) => (canSeeVendorPage && p.vendor_id ? (
                                <Link href={`/admin/vendors/${p.vendor_id}`} className="font-medium text-indigo-600 hover:underline">
                                    {p.vendor_name}
                                </Link>
                            ) : (
                                <span className="font-medium text-gray-900 dark:text-white">{p.vendor_name}</span>
                            )),
                        },
                        {
                            key: 'amount', header: 'Amount', accessor: 'amount', sortable: true,
                            render: (p) => <span className="font-semibold">{formatCurrency(p.amount)}</span>,
                        },
                        {
                            key: 'status', header: 'Status', accessor: 'status', sortable: true,
                            render: (p) => (
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                    p.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {p.status === 'paid' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                    {p.status}
                                </span>
                            ),
                        },
                        {
                            key: 'notes', header: 'Notes',
                            render: (p) => <span className="text-sm text-gray-500">{p.notes || '—'}</span>,
                        },
                        {
                            key: 'requested', header: 'Requested', accessor: 'created_at', sortable: true,
                            render: (p) => <span className="text-xs text-gray-500">{formatDateTime(p.created_at)}</span>,
                        },
                        {
                            key: 'actions', header: 'Actions',
                            render: (p) => (
                                <div className="flex items-center gap-3">
                                    <Link href={`/admin/payouts/${p.id}`} className="text-xs font-medium text-indigo-600 hover:underline">
                                        Details
                                    </Link>
                                    {p.status === 'pending' && (
                                        <button onClick={() => processPayout(p.id)}
                                            className="rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-500">
                                            Process
                                        </button>
                                    )}
                                </div>
                            ),
                        },
                    ]}
                    data={payouts}
                    loading={loading}
                    emptyTitle="No payout requests"
                />
            </div>
        </AdminLayout>
    );
}
