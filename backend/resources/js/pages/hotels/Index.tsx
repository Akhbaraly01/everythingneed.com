import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import type { Hotel } from '@/types';
import {MapPin, Star} from 'lucide-react';
import Image from '@/components/shared/Image';

interface HotelsProps {
    hotels: { data: Hotel[]; meta: { current_page: number; last_page: number; per_page: number; total: number } };
}

export default function Hotels({ hotels }: HotelsProps) {
    return (
        <AppLayout title="Hotels">
            <Head title="Hotels" />
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
        </AppLayout>
    );
}
