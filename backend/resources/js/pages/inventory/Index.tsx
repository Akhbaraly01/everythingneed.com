import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { Package } from 'lucide-react';
import { useEffect, useState } from 'react';

interface StockItem {
    id: string;
    product_name: string;
    sku?: string;
    quantity: number;
    reserved: number;
    available: number;
    low_stock_threshold?: number;
    updated_at: string;
}

export default function InventoryIndex() {
    const [items, setItems] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ data: StockItem[] }>('/api/stock')
            .then((res) => setItems(res.data))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AppLayout title="Inventory">
            <Head title="Inventory" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory Management</h1>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : items.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Package className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">No inventory items</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3">Product</th>
                                    <th className="px-4 py-3">SKU</th>
                                    <th className="px-4 py-3">Quantity</th>
                                    <th className="px-4 py-3">Reserved</th>
                                    <th className="px-4 py-3">Available</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.product_name}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500 font-mono">{item.sku}</td>
                                        <td className="px-4 py-3">{item.quantity}</td>
                                        <td className="px-4 py-3">{item.reserved}</td>
                                        <td className="px-4 py-3 font-semibold">{item.available}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                item.available <= 0 ? 'bg-red-100 text-red-800' :
                                                item.low_stock_threshold && item.available <= item.low_stock_threshold ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                                {item.available <= 0 ? 'Out of Stock' : item.low_stock_threshold && item.available <= item.low_stock_threshold ? 'Low Stock' : 'In Stock'}
                                            </span>
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
