import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import { useEffect, useState } from 'react';
import {Sprout} from 'lucide-react';

interface Product {
    id: string;
    slug?: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
    category: string;
    subcategory?: string | null;
}

export default function AgricultureProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [subFilter, setSubFilter] = useState('');

    useEffect(() => {
        api.get<{ data: Product[] }>('/api/products', { params: { category: 'agriculture' } })
            .then((res) => setProducts(res.data))
            .catch(() => setProducts([]))
            .finally(() => setLoading(false));
    }, []);

    // Equipment and other shelves derive from real subcategories - never hard-coded.
    const subcategories = Array.from(new Set(products.map((p) => (p.subcategory ?? '').trim()).filter(Boolean)));
    const visible = subFilter === '' ? products : products.filter((p) => (p.subcategory ?? '') === subFilter);

    return (
        <AppLayout title="Agriculture Products">
            <Head title="Agriculture Products" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Sprout className="h-6 w-6 text-green-600" /> Agriculture Products</h1>
                {subcategories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => setSubFilter('')} className={`rounded-full px-4 py-1.5 text-sm font-medium ${subFilter === '' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>All</button>
                        {subcategories.map((sub) => (
                            <button key={sub} onClick={() => setSubFilter(sub)} className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${subFilter === sub ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>{sub}</button>
                        ))}
                    </div>
                )}
                {loading ? <p className="text-gray-500">Loading...</p> : visible.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Sprout className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">No agriculture products yet</p>
                        <Link href="/products" className="mt-4 inline-block text-blue-600 hover:underline">Browse All Products</Link>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {visible.map((p) => (
                            <Link key={p.id} href={`/products/${p.slug ?? p.id}`} className="rounded-lg bg-white p-4 shadow hover:ring-2 hover:ring-blue-500 dark:bg-gray-800">
                                <h3 className="font-semibold dark:text-white">{p.name}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2">{p.description}</p>
                                <p className="mt-2 font-bold text-green-600">{formatPrice(Number(p.price ?? 0))}</p>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
