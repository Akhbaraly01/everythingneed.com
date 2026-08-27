import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Store, Star, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

interface StoreItem {
    id: string;
    name: string;
    description?: string;
    image_url?: string;
    rating?: number;
    city?: string;
    products_count?: number;
    vendor_name?: string;
}

export default function StoresIndex() {
    const [stores, setStores] = useState<StoreItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ data: StoreItem[] }>('/api/stores')
            .then((res) => setStores(res.data))
            .catch(() => setStores([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AppLayout title="Stores">
            <Head title="Stores" />

            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stores</h1>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading...</p></div>
                ) : stores.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Store className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No stores found</h3>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {stores.map((store) => (
                            <Link key={store.id} href={`/stores/${store.id}`}
                                className="group overflow-hidden rounded-lg bg-white shadow transition hover:shadow-lg dark:bg-gray-800">
                                <div className="h-40 bg-gray-100 dark:bg-gray-700">
                                    {store.image_url ? <img src={store.image_url} alt="" className="h-full w-full object-cover" /> : null}
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white">{store.name}</h3>
                                    <p className="text-sm text-gray-500">{store.vendor_name}</p>
                                    {store.city && <p className="mt-1 flex items-center gap-1 text-xs text-gray-400"><MapPin className="h-3 w-3" /> {store.city}</p>}
                                    {store.products_count != null && <p className="text-xs text-gray-500">{store.products_count} products</p>}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
