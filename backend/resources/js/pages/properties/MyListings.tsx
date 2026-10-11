import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { Building2, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/currency';

interface Property {
    id: string;
    title: string;
    property_type: string;
    listing_type?: string;
    price: number;
    city: string;
}

export default function MyListings() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get<{ data: Property[] }>('/api/properties/my-listings')
            .then((res) => setProperties(Array.isArray(res.data) ? res.data : []))
            .catch((e) => setError(errorMessage(e, 'Failed to load your listings')))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AppLayout title="My Listings">
            <Head title="My Listings" />
            <div className="mx-auto max-w-3xl space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Listings</h1>
                    <Link href="/real-estate/create" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                        <Plus className="h-4 w-4" /> List a property
                    </Link>
                </div>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">Loading your listings...</p>
                    </div>
                ) : error ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">{error}</p>
                    </div>
                ) : properties.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">You have not listed any property yet.</p>
                    </div>
                ) : (
                    <div className="divide-y rounded-lg bg-white shadow dark:divide-gray-700 dark:bg-gray-800">
                        {properties.map((property) => (
                            <Link key={property.id} href={`/real-estate/${property.id}`}
                                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{property.title}</p>
                                    <p className="text-xs capitalize text-gray-500">
                                        {property.listing_type ?? 'sale'} · {property.property_type} · {property.city}
                                    </p>
                                </div>
                                <span className="text-sm font-semibold">{formatPrice(property.price)}</span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
