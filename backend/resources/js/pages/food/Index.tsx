import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import type { Restaurant } from '@/types';
import {MapPin, Star} from 'lucide-react';
import Image from '@/components/shared/Image';

interface RestaurantsProps {
    restaurants: { data: Restaurant[]; meta: { current_page: number; last_page: number; per_page: number; total: number } };
}

export default function Restaurants({ restaurants }: RestaurantsProps) {
    return (
        <AppLayout title="Restaurants">
            <Head title="Restaurants" />
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
        </AppLayout>
    );
}
