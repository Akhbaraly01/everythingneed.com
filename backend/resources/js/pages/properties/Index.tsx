import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import type { Property } from '@/types';
import { formatPrice } from '@/lib/currency';
import { Bed, Bath, Maximize, MapPin, Heart } from 'lucide-react';
import Image from '@/components/shared/Image';
import { useWishlist } from '@/hooks/useWishlist';
import { errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { useState } from 'react';

interface PropertiesProps {
    properties: { data: Property[]; meta: { current_page: number; last_page: number; per_page: number; total: number } };
}

export default function Properties({ properties }: PropertiesProps) {
    const { auth } = usePage().props as { auth?: { user?: { id: string } } };
    const { has: isSaved, toggle: toggleSaved } = useWishlist('property');
    const [pendingId, setPendingId] = useState<string | null>(null);

    const handleSave = async (e: React.MouseEvent, property: Property) => {
        e.preventDefault();
        e.stopPropagation();
        if (!auth?.user) {
            router.visit('/login');
            return;
        }
        setPendingId(property.id);
        try {
            const nowSaved = await toggleSaved(property.id);
            toast.success(nowSaved ? 'Property saved' : 'Removed from saved homes');
        } catch (e2) {
            toast.error(errorMessage(e2, 'Could not save property'));
        } finally {
            setPendingId(null);
        }
    };

    return (
        <AppLayout title="Properties">
            <Head title="Properties" />
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Properties</h1>
                <div className="flex gap-2">
                    <Link href="/properties/my-listings" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                        My listings
                    </Link>
                    <Link href="/properties/create" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                        List a property
                    </Link>
                </div>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {properties.data.map((p) => (
                    <div key={p.id} className="relative overflow-hidden rounded-lg bg-white shadow hover:shadow-md dark:bg-gray-800">
                        <Link href={`/properties/${p.id}`} className="block">
                            <div className="aspect-video bg-gray-100">{p.images?.[0] && <Image src={p.images[0]} alt={p.title} className="h-full w-full object-cover" />}</div>
                            <div className="p-4">
                                <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-800">{p.property_type}</span>
                                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">{p.type}</span>
                                </div>
                                <h3 className="mt-2 font-semibold text-gray-900 dark:text-white">{p.title}</h3>
                                <div className="mt-1 flex items-center gap-1 text-sm text-gray-500"><MapPin className="h-3 w-3" />{p.city}, {p.country}</div>
                                <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                                    {p.bedrooms && <span className="flex items-center gap-1"><Bed className="h-3 w-3" />{p.bedrooms} bed</span>}
                                    {p.bathrooms && <span className="flex items-center gap-1"><Bath className="h-3 w-3" />{p.bathrooms} bath</span>}
                                    {p.area_sqft && <span className="flex items-center gap-1"><Maximize className="h-3 w-3" />{p.area_sqft} sqft</span>}
                                </div>
                                <p className="mt-3 text-xl font-bold text-gray-900 dark:text-white">{formatPrice(p.price)}</p>
                            </div>
                        </Link>
                        <button
                            type="button"
                            onClick={(e) => handleSave(e, p)}
                            disabled={pendingId === p.id}
                            aria-pressed={isSaved(p.id)}
                            aria-label={isSaved(p.id) ? 'Remove from saved homes' : 'Save this home'}
                            className={`absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow transition hover:bg-white disabled:opacity-50 dark:bg-gray-900/80 ${
                                isSaved(p.id) ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-300'
                            }`}
                        >
                            <Heart className={`h-4 w-4 ${isSaved(p.id) ? 'fill-current' : ''}`} />
                        </button>
                    </div>
                ))}
            </div>
        </AppLayout>
    );
}
