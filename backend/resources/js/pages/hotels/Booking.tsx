import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Calendar, Users, ArrowLeft, Check } from 'lucide-react';
import { useState } from 'react';

interface HotelRoom {
    id: string;
    room_type: string;
    price_per_night: number;
    capacity: number;
    is_available: boolean;
}

interface HotelBookingProps {
    hotel: { id: string; name: string; city: string; star_rating: number; image_url?: string };
    rooms: HotelRoom[];
}

export default function HotelBooking({ hotel, rooms }: HotelBookingProps) {
    const { auth } = usePage().props as { auth?: { user?: { id: string } } };
    const [selectedRoom, setSelectedRoom] = useState('');
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [guests, setGuests] = useState(2);
    const [specialRequests, setSpecialRequests] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const selectedRoomData = rooms.find((r) => r.id === selectedRoom);
    const nights = checkIn && checkOut ? Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)) : 0;
    const total = selectedRoomData ? selectedRoomData.price_per_night * nights : 0;

    const handleReserve = async () => {
        if (!auth?.user) { router.visit('/login'); return; }
        if (!selectedRoom || !checkIn || !checkOut) return;
        setSubmitting(true);
        try {
            await api.post(`/api/hotels/${hotel.id}/reserve`, {
                room_id: selectedRoom,
                check_in_date: checkIn,
                check_out_date: checkOut,
                guests,
                special_requests: specialRequests || undefined,
            });
            router.visit('/hotels/reservations');
        } catch (e: any) {
            alert(e.message ?? 'Failed to reserve');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AppLayout>
            <Head title={`Book ${hotel.name}`} />

            <div className="space-y-6 max-w-3xl">
                <Link href={`/hotels/${hotel.id}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4" /> Back to hotel
                </Link>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reserve at {hotel.name}</h1>
                    <p className="text-sm text-gray-500">{hotel.city}</p>

                    <div className="mt-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Room *</label>
                            <div className="mt-2 space-y-2">
                                {rooms.filter((r) => r.is_available).map((room) => (
                                    <label key={room.id} className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 ${
                                        selectedRoom === room.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700'
                                    }`}>
                                        <div className="flex items-center gap-3">
                                            <input type="radio" name="room" value={room.id} checked={selectedRoom === room.id} onChange={() => setSelectedRoom(room.id)} className="text-indigo-600" />
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{room.room_type}</p>
                                                <p className="text-xs text-gray-500">Up to {room.capacity} guests</p>
                                            </div>
                                        </div>
                                        <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(room.price_per_night)}/night</p>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Check-in *</label>
                                <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Check-out *</label>
                                <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)}
                                    min={checkIn || new Date().toISOString().split('T')[0]}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Guests</label>
                            <input type="number" min={1} max={10} value={guests} onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                                className="mt-1 block w-32 rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Special Requests</label>
                            <textarea value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} rows={2}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700" />
                        </div>
                    </div>

                    {nights > 0 && selectedRoomData && (
                        <div className="mt-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                            <div className="flex justify-between text-sm"><span className="text-gray-500">Room</span><span>{selectedRoomData.room_type}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-gray-500">{formatCurrency(selectedRoomData.price_per_night)} x {nights} nights</span></div>
                            <div className="mt-2 flex justify-between text-lg font-bold"><span>Total</span><span>{formatCurrency(total)}</span></div>
                        </div>
                    )}

                    <button onClick={handleReserve} disabled={submitting || !selectedRoom || !checkIn || !checkOut || nights <= 0}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
                        <Check className="h-5 w-5" /> {submitting ? 'Reserving...' : 'Confirm Reservation'}
                    </button>
                </div>
            </div>
        </AppLayout>
    );
}
