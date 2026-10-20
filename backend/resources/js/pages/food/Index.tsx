import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import type { Restaurant } from '@/types';
import { MapPin, Star, Search, X } from 'lucide-react';
import Image from '@/components/shared/Image';
import { useEffect, useState } from 'react';

interface RestaurantsProps {
    restaurants: { data: Restaurant[]; meta: { current_page: number; last_page: number; per_page: number; total: number } };
    filters?: { city?: string; cuisine?: string; q?: string };
}

const CUISINES = ['Italian', 'Chinese', 'Indian', 'Mexican', 'Japanese', 'Nigerian', 'American', 'Thai', 'Mediterranean', 'Local'];

export default function Restaurants({ restaurants, filters = {} }: RestaurantsProps) {
    const [q, setQ] = useState(filters.q ?? '');
    const [city, setCity] = useState(filters.city ?? '');
    const [cuisine, setCuisine] = useState(filters.cuisine ?? '');

    const apply = (next: { q?: string; city?: string; cuisine?: string }) => {
        router.get(
            '/food',
            Object.fromEntries(Object.entries(next).filter(([, v]) => v !== '')),
            { preserveState: true, preserveScroll: true },
        );
    };

    useEffect(() => {
        setQ(filters.q ?? '');
        setCity(filters.city ?? '');
        setCuisine(filters.cuisine ?? '');
    }, [filters.q, filters.city, filters.cuisine]);

    const hasFilters = Boolean(q || city || cuisine);

    return (
        <AppLayout title="Restaurants">
            <Head title="Restaurants" />

            <div className="mb-6 space-y-3">
                <form
                    onSubmit={(e) => { e.preventDefault(); apply({ q, city, cuisine }); }}
                    className="flex flex-col gap-3 sm:flex-row"
                    data-testid="food-filters"
                >
                    <input
                        type="search"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search restaurants or cities..."
                        aria-label="Search restaurants"
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                    />
                    <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        aria-label="Filter by city"
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 sm:w-36"
                    />
                    <select
                        value={cuisine}
                        onChange={(e) => { setCuisine(e.target.value); apply({ q, city, cuisine: e.target.value }); }}
                        aria-label="Cuisine"
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                    >
                        <option value="">Any cuisine</option>
                        {CUISINES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button
                        type="submit"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                    >
                        <Search className="h-4 w-4" /> Search
                    </button>
                </form>
                {hasFilters && (
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>{restaurants.meta.total} restaurant{restaurants.meta.total === 1 ? '' : 's'} found</span>
                        <button
                            onClick={() => { setQ(''); setCity(''); setCuisine(''); apply({}); }}
                            className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-500"
                        >
                            <X className="h-3.5 w-3.5" /> Clear filters
                        </button>
                    </div>
                )}
            </div>

            {restaurants.data.length === 0 ? (
                <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                    <p className="text-gray-500">No restaurants match your search.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {restaurants.data.map((r) => (
                        <Link key={r.id} href={`/food/${r.id}`} className="block rounded-lg bg-white shadow overflow-hidden hover:shadow-md dark:bg-gray-800">
                            <div className="aspect-video bg-gray-100">{r.image_url && <Image src={r.image_url} alt={r.name} className="h-full w-full object-cover" />}</div>
                            <div className="p-4">
                                <h3 className="font-semibold text-gray-900 dark:text-white">{r.name}</h3>
                                <p className="text-sm text-indigo-600">{r.cuisine_type}</p>
                                <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                                    <MapPin className="h-3 w-3" />{r.city}
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{r.rating ?? 'N/A'}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </AppLayout>
    );
}
