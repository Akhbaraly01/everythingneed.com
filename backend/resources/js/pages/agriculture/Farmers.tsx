import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { Tractor } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/lib/api';

interface Farmer {
    id: string;
    store_name: string;
    slug?: string;
    is_verified?: boolean;
    rating?: number | null;
}

export default function AgricultureFarmers() {
    const [farmers, setFarmers] = useState<Farmer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get<{ data: Farmer[] }>('/api/vendors', { params: { category: 'agriculture', per_page: 50 } })
            .then((res) => setFarmers(Array.isArray(res.data) ? res.data : []))
            .catch((e) => setError(errorMessage(e, 'Failed to load farmers')))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AppLayout title="Farmers">
            <Head title="Farmers" />
            <div className="space-y-6">
                <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                    <Tractor className="h-6 w-6 text-green-600" /> Farmers
                </h1>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : error ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">{error}</p>
                    </div>
                ) : farmers.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Tractor className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">No agriculture vendors yet</p>
                        <Link href="/agriculture/products" className="mt-4 inline-block text-blue-600 hover:underline">
                            Browse agriculture products
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {farmers.map((farmer) => (
                            <Link key={farmer.id} href={`/vendors/${farmer.slug ?? farmer.id}`}
                                className="rounded-lg bg-white p-4 shadow hover:ring-2 hover:ring-blue-500 dark:bg-gray-800">
                                <h3 className="font-semibold dark:text-white">{farmer.store_name}</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {farmer.is_verified ? 'Verified seller' : 'Seller'}
                                    {farmer.rating != null ? ` · ★ ${farmer.rating}` : ''}
                                </p>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
