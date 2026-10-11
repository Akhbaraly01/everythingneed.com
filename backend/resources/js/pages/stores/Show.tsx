import AppLayout from '@/layouts/AppLayout';
import {Head, Link} from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import {Store, ArrowLeft, MapPin} from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from '@/components/shared/Image';

interface StoreDetailProps {
    store: { id: string; name: string; description?: string; image_url?: string; city?: string; rating?: number; vendor_name?: string };
    products: Array<{ id: string; slug?: string; name: string; price: number; image_url?: string }>;
}

export default function StoreShow({ store: initialStore, products: initialProducts }: Partial<StoreDetailProps>) {
    const [store, setStore] = useState<StoreDetailProps['store'] | null>(initialStore ?? null);
    const [products, setProducts] = useState<StoreDetailProps['products']>(initialProducts ?? []);
    const [loading, setLoading] = useState(!initialStore);

    useEffect(() => {
        if (initialStore) return;
        const id = window.location.pathname.split('/').pop() ?? '';
        Promise.all([
            api.get<{ data: StoreDetailProps['store'] }>(`/api/vendors/${id}`).catch(() => ({ data: null })),
            api.get<{ data: StoreDetailProps['products'] }>(`/api/products?vendor_id=${id}&per_page=24`).catch(() => ({ data: [] })),
        ])
            .then(([s, p]) => {
                if (s.data) {
                    setStore({
                        ...s.data,
                        name: (s.data as unknown as Record<string, string>).store_name ?? s.data.name,
                    } as StoreDetailProps['store']);
                }
                setProducts(p.data ?? []);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [initialStore]);

    if (loading) {
        return (
            <AppLayout>
                <Head title="Store" />
                <p className="p-12 text-center text-gray-500">Loading...</p>
            </AppLayout>
        );
    }

    if (!store) {
        return (
            <AppLayout>
                <Head title="Store not found" />
                <p className="p-12 text-center text-gray-500">Store not found.</p>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title={store.name} />

            <div className="space-y-6">
                <Link href="/stores" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4" /> All Stores
                </Link>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="flex items-center gap-4">
                        {store.image_url ? <Image src={store.image_url} alt="" className="h-20 w-20 rounded-lg object-cover" /> :
                            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100"><Store className="h-10 w-10 text-gray-400" /></div>}
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{store.name}</h1>
                            {store.vendor_name && <p className="text-sm text-gray-500">by {store.vendor_name}</p>}
                            {store.city && <p className="flex items-center gap-1 text-xs text-gray-400"><MapPin className="h-3 w-3" /> {store.city}</p>}
                        </div>
                    </div>
                    {store.description && <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{store.description}</p>}
                </div>

                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Products</h2>
                {products.length === 0 ? (
                    <p className="text-gray-500">No products yet.</p>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {products.map((p) => (
                                <Link key={p.id} href={`/products/${p.slug ?? p.id}`} className="rounded-lg bg-white p-4 shadow transition hover:shadow-md dark:bg-gray-800">
                                <div className="h-32 rounded-lg bg-gray-100 dark:bg-gray-700">
                                    {p.image_url && <Image src={p.image_url} alt="" className="h-full w-full rounded-lg object-cover" />}
                                </div>
                                <p className="mt-2 font-medium text-gray-900 dark:text-white">{p.name}</p>
                                <p className="text-lg font-bold text-indigo-600">{formatPrice(p.price)}</p>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
