import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import type { Property } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Bed, Bath, Maximize, MapPin } from 'lucide-react';

interface PropertiesProps {
    properties: { data: Property[]; meta: { current_page: number; last_page: number; per_page: number; total: number } };
}

export default function Properties({ properties }: PropertiesProps) {
    return (
        <AppLayout title="Properties">
            <Head title="Properties" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {properties.data.map((p) => (
                    <Link key={p.id} href={`/properties/${p.id}`} className="block rounded-lg bg-white shadow overflow-hidden hover:shadow-md dark:bg-gray-800">
                        <div className="aspect-video bg-gray-100">{p.images?.[0] && <img src={p.images[0]} alt={p.title} className="h-full w-full object-cover" />}</div>
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
                            <p className="mt-3 text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(p.price)}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </AppLayout>
    );
}
