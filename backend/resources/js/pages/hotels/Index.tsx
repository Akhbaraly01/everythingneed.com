import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import type { Hotel } from '@/types';
import { MapPin, Star, Search, X } from 'lucide-react';
import Image from '@/components/shared/Image';
import { useEffect, useState } from 'react';

interface HotelsProps {
    hotels: { data: Hotel[]; meta: { current_page: number; last_page: number; per_page: number; total: number } };
    filters?: { city?: string; min_stars?: string | number; q?: string };
}

export default function Hotels({ hotels, filters = {} }: HotelsProps) {
    const [q, setQ] = useState(filters.q ?? '');
    const [city, setCity] = useState(filters.city ?? '');
    const [minStars, setMinStars] = useState(String(filters.min_stars ?? ''));

    const apply = (next: { q?: string; city?: string; min_stars?: string }) => {
        router.get(
            '/hotels',
            Object.fromEntries(Object.entries(next).filter(([, v]) => v !== '' && v != null)),
            { preserveState: true, preserveScroll: true },
        );
    };

    // Back/forward restores the server answer into the inputs.
    useEffect(() => {
        setQ(filters.q ?? '');
        setCity(filters.city ?? '');
        setMinStars(String(filters.min_stars ?? ''));
    }, [filters.q, filters.city, filters.min_stars]);

    const hasFilters = Boolean(q || city || minStars);

    return (
        <AppLayout title="Hotels">
            <Head title="Hotels" />

            <div className="mb-6 space-y-3">
                <form
                    onSubmit={(e) => { e.preventDefault(); apply({ q, city, min_stars: minStars }); }}
                    className="flex flex-col gap-3 sm:flex-row"
                    data-testid="hotel-filters"
                >
                    <input
                        type="search"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search hotels or cities..."
                        aria-label="Search hotels"
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                    />
                    <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        aria-label="Filter by city"
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 sm:w-40"
                    />
                    <select
                        value={minStars}
                        onChange={(e) => { setMinStars(e.target.value); apply({ q, city, min_stars: e.target.value }); }}
                        aria-label="Minimum stars"
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                    >
                        <option value="">Any stars</option>
                        <option value="3">3+ stars</option>
                        <option value="4">4+ stars</option>
                        <option value="5">5 stars</option>
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
                        <span>{hotels.meta.total} hotel{hotels.meta.total === 1 ? '' : 's'} found</span>
                        <button
                            onClick={() => { setQ(''); setCity(''); setMinStars(''); apply({}); }}
                            className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-500"
                        >
                            <X className="h-3.5 w-3.5" /> Clear filters
                        </button>
                    </div>
                )}
            </div>

            {hotels.data.length === 0 ? (
                <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                    <p className="text-gray-500">No hotels match your search.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {hotels.data.map((hotel) => (
                        <Link key={hotel.id} href={`/hotels/${hotel.id}`} className="block rounded-lg bg-white shadow overflow-hidden hover:shadow-md dark:bg-gray-800">
                            <div className="aspect-video bg-gray-100">{hotel.image_url && <Image src={hotel.image_url} alt={hotel.name} className="h-full w-full object-cover" />}</div>
                            <div className="p-4">
                                <h3 className="font-semibold text-gray-900 dark:text-white">{hotel.name}</h3>
                                <div className="mt-1 flex items-center gap-1 text-sm text-gray-500"><MapPin className="h-3 w-3" />{hotel.city}, {hotel.country}</div>
                                <div className="mt-2 flex items-center gap-1">{Array.from({length: hotel.star_rating}).map((_, i) => <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />)}</div>
                                <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">${hotel.rooms?.[0]?.price_per_night ?? 'N/A'}/night</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </AppLayout>
    );
}
