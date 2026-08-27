import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Store, CheckCircle, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Vendor {
    id: string;
    store_name: string;
    user_name?: string;
    user_email?: string;
    status: string;
    total_products: number;
    total_orders: number;
    revenue: number;
    created_at: string;
}

export default function AdminVendors() {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ data: Vendor[] }>('/api/admin/vendors')
            .then((res) => setVendors(res.data))
            .catch(() => setVendors([]))
            .finally(() => setLoading(false));
    }, []);

    const updateStatus = async (vendorId: string, status: string) => {
        try {
            await api.put(`/api/admin/vendors/${vendorId}/status`, { status });
            setVendors(vendors.map((v) => v.id === vendorId ? { ...v, status } : v));
        } catch {}
    };

    return (
        <AppLayout title="Manage Vendors">
            <Head title="Manage Vendors" />

            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Vendors</h1>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading...</p></div>
                ) : vendors.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Store className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No vendors</h3>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3">Store</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Products</th>
                                    <th className="px-4 py-3">Orders</th>
                                    <th className="px-4 py-3">Revenue</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {vendors.map((v) => (
                                    <tr key={v.id}>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900 dark:text-white">{v.store_name}</p>
                                            <p className="text-xs text-gray-500">{v.user_email}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                v.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>{v.status}</span>
                                        </td>
                                        <td className="px-4 py-3">{v.total_products}</td>
                                        <td className="px-4 py-3">{v.total_orders}</td>
                                        <td className="px-4 py-3">{formatCurrency(v.revenue)}</td>
                                        <td className="px-4 py-3 flex gap-2">
                                            {v.status !== 'approved' && (
                                                <button onClick={() => updateStatus(v.id, 'approved')} className="text-green-600 hover:text-green-800">
                                                    <CheckCircle className="h-4 w-4" />
                                                </button>
                                            )}
                                            {v.status !== 'suspended' && (
                                                <button onClick={() => updateStatus(v.id, 'suspended')} className="text-red-600 hover:text-red-800">
                                                    <XCircle className="h-4 w-4" />
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
