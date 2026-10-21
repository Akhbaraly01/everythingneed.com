import AppLayout from '@/layouts/AppLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import { useCallback, useEffect, useState } from 'react';
import {Scale, X, Star} from 'lucide-react';

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
    const { auth } = usePage().props as { auth?: { id?: string; user?: { id?: string } } | null };
    const isLoggedIn = Boolean(auth?.id ?? auth?.user?.id);

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(() => {
        api.get<{ data: Product[] }>('/api/products/comparison')
            .then((res) => setProducts(res.data))
            .catch(() => setProducts([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!isLoggedIn) {
            setLoading(false);
            return;
        }
        load();
    }, [isLoggedIn, load]);

    const remove = async (id: string) => {
        await api.del(`/api/compare/${id}`).catch(() => {});
        load();
    };

    return (
        <AppLayout title="Compare Products">
            <Head title="Compare Products" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Scale className="h-6 w-6" /> Compare Products</h1>
                {!isLoggedIn ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Scale className="mx-auto h-12 w-12 text-gray-400" />
                        <h2 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Sign in to continue</h2>
                        <p className="mt-2 text-sm text-gray-500">
                            Your comparison list is tied to your account — sign in to see the products you saved.
                        </p>
                        <Link
                            href="/login"
                            className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                        >
                            Sign in
                        </Link>
                    </div>
                ) : loading ? <p className="text-gray-500">Loading...</p> : products.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Scale className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">No products to compare</p>
                        <p className="text-sm text-gray-400">Add products to comparison from product pages</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-sm">
                            <thead><tr className="border-b dark:border-gray-700"><th className="px-4 py-3 text-left">Feature</th>{products.map((p) => <th key={p.id} className="px-4 py-3 text-left"><div className="flex items-center justify-between"><span className="truncate max-w-[120px]">{p.name}</span><button onClick={() => void remove(p.id)} className="text-red-500 hover:text-red-700"><X className="h-4 w-4" /></button></div></th>)}</tr></thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                <tr><td className="px-4 py-3 font-medium">Price</td>{products.map((p) => <td key={p.id} className="px-4 py-3 font-bold text-green-600">{formatPrice(p.price)}</td>)}</tr>
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
