import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import { Scale, X, Star, DollarSign } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    price: number;
    image_url: string;
    rating: number;
    category: string;
    stock_quantity: number;
}

export default function ProductCompare() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const load = () => {
        api.get<{ data: Product[] }>('/api/products/comparison')
            .then((res) => setProducts(res.data))
            .catch(() => setProducts([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const remove = async (id: string) => {
        await api.delete(`/api/products/comparison/${id}`).catch(() => {});
        load();
    };

    return (
        <AppLayout title="Compare Products">
            <Head title="Compare Products" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Scale className="h-6 w-6" /> Compare Products</h1>
                {loading ? <p className="text-gray-500">Loading...</p> : products.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Scale className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">No products to compare</p>
                        <p className="text-sm text-gray-400">Add products to comparison from product pages</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-sm">
                            <thead><tr className="border-b dark:border-gray-700"><th className="px-4 py-3 text-left">Feature</th>{products.map((p) => <th key={p.id} className="px-4 py-3 text-left"><div className="flex items-center justify-between"><span className="truncate max-w-[120px]">{p.name}</span><button onClick={() => remove(p.id)} className="text-red-500 hover:text-red-700"><X className="h-4 w-4" /></button></div></th>)}</tr></thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                <tr><td className="px-4 py-3 font-medium">Price</td>{products.map((p) => <td key={p.id} className="px-4 py-3 font-bold text-green-600">${p.price}</td>)}</tr>
                                <tr><td className="px-4 py-3 font-medium">Rating</td>{products.map((p) => <td key={p.id} className="px-4 py-3 flex items-center gap-1"><Star className="h-4 w-4 text-yellow-400" />{p.rating || 'N/A'}</td>)}</tr>
                                <tr><td className="px-4 py-3 font-medium">Category</td>{products.map((p) => <td key={p.id} className="px-4 py-3">{p.category}</td>)}</tr>
                                <tr><td className="px-4 py-3 font-medium">Stock</td>{products.map((p) => <td key={p.id} className="px-4 py-3">{p.stock_quantity > 0 ? `${p.stock_quantity} in stock` : 'Out of stock'}</td>)}</tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
