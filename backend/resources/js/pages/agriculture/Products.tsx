import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import { Sprout, ShoppingCart, DollarSign } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
    category: string;
}

export default function AgricultureProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ data: Product[] }>('/api/products', { params: { category: 'agriculture' } })
            .then((res) => setProducts(res.data))
            .catch(() => setProducts([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AppLayout title="Agriculture Products">
            <Head title="Agriculture Products" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Sprout className="h-6 w-6 text-green-600" /> Agriculture Products</h1>
                {loading ? <p className="text-gray-500">Loading...</p> : products.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Sprout className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">No agriculture products yet</p>
                        <Link href="/products" className="mt-4 inline-block text-blue-600 hover:underline">Browse All Products</Link>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {products.map((p) => (
                            <Link key={p.id} href={`/products/${p.id}`} className="rounded-lg bg-white p-4 shadow hover:ring-2 hover:ring-blue-500 dark:bg-gray-800">
                                <h3 className="font-semibold dark:text-white">{p.name}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2">{p.description}</p>
                                <p className="mt-2 font-bold text-green-600">${p.price}</p>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
