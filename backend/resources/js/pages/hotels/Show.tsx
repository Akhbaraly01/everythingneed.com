import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import type { Hotel, HotelRoom } from '@/types';
import { MapPin, Star, Wifi, Car, Coffee, Users, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface HotelShowProps {
    hotel: Hotel & { rooms?: HotelRoom[] };
}

const amenityIcons: Record<string, typeof Wifi> = {
    wifi: Wifi,
    parking: Car,
    breakfast: Coffee,
};

export default function HotelShow({ hotel }: HotelShowProps) {
    return (
        <AppLayout>
            <Head title={hotel.name} />

            <div className="space-y-8">
                {/* Header */}
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="flex flex-col gap-6 lg:flex-row">
                        <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-100 lg:w-1/2">
                            {hotel.image_url ? (
                                <img src={hotel.image_url} alt={hotel.name} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full items-center justify-center text-gray-400">No image</div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{hotel.name}</h1>
                            <div className="mt-1 flex items-center gap-2">
                                {Array.from({ length: hotel.star_rating }).map((_, i) => (
                                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                ))}
                                <span className="text-sm text-gray-500">({hotel.star_rating} star)</span>
                            </div>
                            <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{hotel.address}, {hotel.city}, {hotel.country}</span>
                            </div>
                            {hotel.phone && <p className="mt-2 text-sm text-gray-500">{hotel.phone}</p>}
                            {hotel.email && <p className="text-sm text-gray-500">{hotel.email}</p>}
                            {hotel.description && (
                                <p className="mt-4 text-gray-600 dark:text-gray-400">{hotel.description}</p>
                            )}
                            {hotel.amenities && hotel.amenities.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {hotel.amenities.map((amenity) => {
                                        const Icon = amenityIcons[amenity.toLowerCase()];
                                        return (
                                            <span key={amenity} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                                {Icon && <Icon className="h-3 w-3" />}
                                                {amenity}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Rooms */}
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Available Rooms</h2>
                    <div className="mt-6 space-y-4">
                        {!hotel.rooms || hotel.rooms.length === 0 ? (
                            <p className="py-8 text-center text-gray-500">No rooms available.</p>
                        ) : (
                            hotel.rooms.filter((r) => r.is_available).map((room) => (
                                <div key={room.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                    <div>
                                        <h3 className="font-medium text-gray-900 dark:text-white">{room.room_type}</h3>
                                        <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                                            <span className="flex items-center gap-1"><Users className="h-3 w-3" />Up to {room.capacity} guests</span>
                                            {room.amenities && room.amenities.map((a) => (
                                                <span key={a} className="text-xs text-gray-400">{a}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(room.price_per_night)}</p>
                                        <p className="text-xs text-gray-500">per night</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
