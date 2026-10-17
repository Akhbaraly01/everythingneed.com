import AppLayout from '@/layouts/AppLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import {Bed, Maximize, DollarSign, ArrowRight} from 'lucide-react';
import ReviewSection from '@/components/reviews/ReviewSection';

interface Room {
    id: string;
    room_type: string;
    price_per_night: number;
    capacity: number;
    amenities: string[];
    is_available: boolean;
    image_url: string;
}

interface Hotel {
    id: string;
    name: string;
    star_rating: number;
    city: string;
    amenities: string[];
}

export default function RoomDetails({ hotel_id, room_id }: { hotel_id?: string; room_id?: string }) {
    const { auth } = usePage().props as { auth?: { user?: { id: string } } };
    const [hotel, setHotel] = useState<Hotel | null>(null);
    const [room, setRoom] = useState<Room | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (hotel_id && room_id) {
            api.get<{ data: { hotel: Hotel; room: Room } }>(`/api/hotels/${hotel_id}/rooms/${room_id}`)
                .then((res) => { setHotel(res.data.hotel); setRoom(res.data.room); })
                .catch(() => {})
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [hotel_id, room_id]);

    if (loading) return <AppLayout title="Room Details"><p className="p-12 text-center text-gray-500">Loading...</p></AppLayout>;
    if (!room || !hotel) return <AppLayout title="Room Details"><p className="p-12 text-center text-red-500">Room not found</p></AppLayout>;

    return (
        <AppLayout title={room.room_type}>
            <Head title={`${room.room_type} - ${hotel.name}`} />
            <div className="mx-auto max-w-3xl space-y-6">
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{room.room_type}</h1>
                    <p className="text-gray-500">{hotel.name} • {hotel.city} • {'★'.repeat(hotel.star_rating)}</p>
                </div>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-4">
                    <h2 className="font-semibold text-gray-900 dark:text-white">Room Details</h2>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="rounded bg-gray-50 p-4 dark:bg-gray-700">
                            <DollarSign className="mx-auto h-6 w-6 text-green-600" />
                            <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">${room.price_per_night}</p>
                            <p className="text-xs text-gray-500">per night</p>
                        </div>
                        <div className="rounded bg-gray-50 p-4 dark:bg-gray-700">
                            <Bed className="mx-auto h-6 w-6 text-blue-600" />
                            <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">{room.capacity}</p>
                            <p className="text-xs text-gray-500">guests</p>
                        </div>
                        <div className="rounded bg-gray-50 p-4 dark:bg-gray-700">
                            <Maximize className="mx-auto h-6 w-6 text-purple-600" />
                            <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">{room.is_available ? 'Available' : 'Booked'}</p>
                            <p className="text-xs text-gray-500">status</p>
                        </div>
                    </div>

                    {room.amenities && room.amenities.length > 0 && (
                        <div>
                            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Amenities</h3>
                            <div className="flex flex-wrap gap-2">
                                {room.amenities.map((a, i) => (
                                    <span key={i} className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{a}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* N-40: hotel reviews follow you to the room page */}
                <ReviewSection reviewableType="hotel" reviewableId={hotel.id} authenticated={Boolean(auth?.user)} />

                <button
                    onClick={() => router.visit(`/hotels/${hotel.id}/book?room=${room.id}`)}
                    disabled={!room.is_available}
                    className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {room.is_available ? 'Book This Room' : 'Unavailable'} <ArrowRight className="h-4 w-4" />
                </button>
            </div>
        </AppLayout>
    );
}
