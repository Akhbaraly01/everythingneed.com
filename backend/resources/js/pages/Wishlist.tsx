import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Heart, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface WishlistItem {
    id: string;
    product_id: string;
    name: string;
    price: number;
    image_url?: string;
    vendor_name?: string;
    created_at: string;
}

export default function WishlistPage() {
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ data: WishlistItem[] }>('/api/wishlist')
            .then((res) => setItems(res.data))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, []);

    const removeItem = async (id: string) => {
        try {
            await api.del(`/api/wishlist/${id}`);
            setItems(items.filter((i) => i.id !== id));
        } catch {}
    };

    return (
        <AppLayout title="Wishlist">
            <Head title="Wishlist" />

            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Wishlist</h1>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading...</p></div>
                ) : items.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Heart className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Your wishlist is empty</h3>
                        <Link href="/products" className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                            Browse Products
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((item) => (
                            <div key={item.id} className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                <Link href={`/products/${item.product_id}`}>
                                    <div className="h-40 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                                        {item.image_url ? <img src={item.image_url} alt="" className="h-full w-full object-cover" /> : null}
                                    </div>
                                    <p className="mt-2 font-semibold text-gray-900 hover:text-indigo-600 dark:text-white">{item.name}</p>
                                </Link>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(item.price)}</span>
                                    <button onClick={() => removeItem(item.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                                {item.vendor_name && <p className="text-xs text-gray-500">by {item.vendor_name}</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
