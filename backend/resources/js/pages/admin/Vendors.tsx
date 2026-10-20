import AdminLayout from '@/layouts/AdminLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import DataTable from '@/components/shared/DataTable';
import { useConfirm } from '@/lib/confirm';
import { CheckCircle, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

/**
 * Real shape from VendorQueryService::paginate(): a vendor is either
 * verified or pending - "suspend"/"reject" simply clear is_verified.
 */
interface Vendor {
    id: string;
    store_name: string;
    category: string;
    user_name?: string | null;
    user_email?: string | null;
    status: 'verified' | 'pending';
    is_verified: boolean;
    total_products: number;
    total_orders: number;
    revenue: number;
    created_at: string;
}

export default function AdminVendors() {
    const ask = useConfirm();
    const permissions =
        (usePage().props.auth as { permissions?: string[] } | null)?.permissions ?? [];
    const canApprove = permissions.includes('*') || permissions.includes('vendors.vendors.approve');
    const canSuspend = permissions.includes('*') || permissions.includes('vendors.vendors.suspend');
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('all');

    const fetchVendors = useCallback(() => {
        setLoading(true);
        const params = filter === 'all' ? '' : `?status=${filter}`;
        api.get<{ data: Vendor[] }>(`/api/admin/vendors${params}`)
            .then((res) => setVendors(Array.isArray(res.data) ? res.data : []))
            .catch((e) => {
                setVendors([]);
                toast.error(errorMessage(e, 'Failed to load vendors'));
            })
            .finally(() => setLoading(false));
    }, [filter]);
    useEffect(() => { fetchVendors(); }, [fetchVendors]);

    const updateStatus = async (vendor: Vendor, next: 'verified' | 'pending') => {
        if (next === 'pending') {
            const ok = await ask({
                title: `Suspend ${vendor.store_name}?`,
                description: 'Verification is cleared immediately; the storefront drops off verified-only surfaces.',
                confirmLabel: 'Suspend',
                danger: true,
            });
            if (!ok) return;
        }
        try {
            if (next === 'verified') {
                await api.post(`/api/admin/vendors/${vendor.id}/approve`);
                toast.success(`${vendor.store_name} approved.`);
            } else {
                await api.post(`/api/admin/vendors/${vendor.id}/suspend`);
                toast.success(`${vendor.store_name} suspended (unverified).`);
            }
            fetchVendors();
        } catch (e) {
            toast.error(errorMessage(e, 'Action failed'));
        }
    };

    return (
        <AdminLayout title="Manage Vendors">
            <Head title="Manage Vendors" />

            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Vendors</h1>

                <div className="flex gap-2" role="group" aria-label="Filter vendors by status">
                    {(['all', 'pending', 'verified'] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            aria-pressed={filter === s}
                            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${
                                filter === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                <DataTable
                    columns={[
                        {
                            key: 'store', header: 'Store', accessor: 'store_name', sortable: true,
                            render: (v) => (
                                <>
                                    <Link href={`/admin/vendors/${v.id}`} className="font-medium text-gray-900 hover:text-indigo-600 dark:text-white">
                                        {v.store_name}
                                    </Link>
                                    <p className="text-xs text-gray-500">{v.user_email ?? v.user_name ?? ''}</p>
                                </>
                            ),
                        },
                        {
                            key: 'category', header: 'Category', accessor: 'category', sortable: true,
                            render: (v) => <span className="capitalize">{v.category}</span>,
                        },
                        {
                            key: 'status', header: 'Status', accessor: 'status', sortable: true,
                            render: (v) => (
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                    v.status === 'verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {v.status}
                                </span>
                            ),
                        },
                        { key: 'products', header: 'Products', accessor: 'total_products', sortable: true },
                        { key: 'orders', header: 'Orders', accessor: 'total_orders', sortable: true },
                        {
                            key: 'revenue', header: 'Revenue', accessor: 'revenue', sortable: true,
                            render: (v) => <>{formatCurrency(Number(v.revenue ?? 0))}</>,
                        },
                        {
                            key: 'joined', header: 'Joined', accessor: 'created_at', sortable: true,
                            render: (v) => <span className="text-xs text-gray-500">{formatDateTime(v.created_at)}</span>,
                        },
                        {
                            key: 'actions', header: 'Actions',
                            render: (v) => {
                                if (!canApprove && !canSuspend) {
                                    return <span className="text-xs text-gray-400">View only</span>;
                                }
                                return (
                                    <div className="flex gap-3">
                                        {canApprove && v.status !== 'verified' && (
                                            <button
                                                onClick={() => updateStatus(v, 'verified')}
                                                aria-label={`Approve ${v.store_name}`}
                                                title="Approve vendor"
                                                className="text-green-600 hover:text-green-800"
                                            >
                                                <CheckCircle className="h-4 w-4" aria-hidden="true" />
                                            </button>
                                        )}
                                        {canSuspend && v.status === 'verified' && (
                                            <button
                                                onClick={() => updateStatus(v, 'pending')}
                                                aria-label={`Suspend ${v.store_name}`}
                                                title="Suspend vendor"
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <XCircle className="h-4 w-4" aria-hidden="true" />
                                            </button>
                                        )}
                                    </div>
                                );
                            },
                        },
                    ]}
                    data={vendors}
                    loading={loading}
                    emptyTitle="No vendors"
                    emptyDescription={filter === 'all' ? 'No vendors registered yet.' : `No ${filter} vendors.`}
                />
            </div>
        </AdminLayout>
    );
}
