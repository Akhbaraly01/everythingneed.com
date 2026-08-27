import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Package, CheckCircle, XCircle, Eye } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Product {
    id: string;
    name: string;
    vendor_name?: string;
    category?: string;
    price: number;
    stock_quantity: number;
    status: string;
    approved_at?: string;
    created_at: string;
}

export default function AdminProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
        api.get<{ data: Product[] }>(`/api/admin/products${params}`)
            .then((res) => setProducts(res.data))
            .catch(() => setProducts([]))
            .finally(() => setLoading(false));
    }, [statusFilter]);

    const approveProduct = async (id: string) => {
        try {
            await api.post(`/api/admin/products/${id}/approve`);
            setProducts(products.map((p) => p.id === id ? { ...p, status: 'approved', approved_at: new Date().toISOString() } : p));
        } catch {}
    };

    const rejectProduct = async (id: string) => {
        const reason = prompt('Reason for rejection:');
        if (reason === null) return;
        try {
            await api.post(`/api/admin/products/${id}/reject`, { reason });
            setProducts(products.map((p) => p.id === id ? { ...p, status: 'rejected' } : p));
        } catch {}
    };

    return (
        <AppLayout title="Manage Products">
            <Head title="Manage Products" />

            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Products</h1>

                <div className="flex gap-2">
                    {['all', 'pending', 'approved', 'rejected'].map((s) => (
                        <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${
                            statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700'
                        }`}>{s}</button>
                    ))}
                </div>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading...</p></div>
                ) : products.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Package className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No products</h3>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3">Product</th>
                                    <th className="px-4 py-3">Vendor</th>
                                    <th className="px-4 py-3">Price</th>
                                    <th className="px-4 py-3">Stock</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {products.map((p) => (
                                    <tr key={p.id}>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900 dark:text-white">{p.name}</p>
                                            <p className="text-xs text-gray-500">{p.category}</p>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{p.vendor_name}</td>
                                        <td className="px-4 py-3">{formatCurrency(p.price)}</td>
                                        <td className="px-4 py-3">{p.stock_quantity}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                p.status === 'approved' ? 'bg-green-100 text-green-800' : p.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>{p.status}</span>
                                        </td>
                                        <td className="px-4 py-3 flex gap-2">
                                            <a href={`/products/${p.id}`} target="_blank" className="text-gray-400 hover:text-gray-600"><Eye className="h-4 w-4" /></a>
                                            {p.status === 'pending' && (
                                                <>
                                                    <button onClick={() => approveProduct(p.id)} className="text-green-600 hover:text-green-800"><CheckCircle className="h-4 w-4" /></button>
                                                    <button onClick={() => rejectProduct(p.id)} className="text-red-600 hover:text-red-800"><XCircle className="h-4 w-4" /></button>
                                                </>
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
