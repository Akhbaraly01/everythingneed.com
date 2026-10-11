import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { formatPrice } from '@/lib/currency';

interface Reservation {
    id: string;
    reference: string;
    check_in_date: string;
    check_out_date: string;
    guests: number;
    total_amount: number;
    status: string;
    hotel?: { name: string; city: string } | null;
    checked_in_at?: string | null;
    checked_out_at?: string | null;
    created_at: string;
}

interface DetailProps {
    reservation_id: string;
}

export default function ReservationDetail({ reservation_id }: DetailProps) {
    const [reservation, setReservation] = useState<Reservation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get<{ data: Reservation }>(`/api/hotels/bookings/${reservation_id}`)
            .then((res) => setReservation(res.data))
            .catch((e) => setError(errorMessage(e, 'Reservation not found')))
            .finally(() => setLoading(false));
    }, [reservation_id]);

    return (
        <AppLayout title="Reservation">
            <Head title="Reservation" />
            <div className="mx-auto max-w-2xl space-y-6">
                <Link href="/hotels/bookings" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    ← My bookings
                </Link>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">Loading reservation...</p>
                    </div>
                ) : error || !reservation ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Reservation not found</h3>
                        <p className="mt-1 text-sm text-gray-500">{error ?? 'This reservation does not exist.'}</p>
                    </div>
                ) : (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{reservation.reference}</h1>
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-600">
                                {reservation.status}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                            {reservation.hotel?.name ?? 'Hotel'}{reservation.hotel?.city ? ` · ${reservation.hotel.city}` : ''}
                        </p>
                        <dl className="mt-6 space-y-3 text-sm">
                            <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
                                <dt className="text-gray-500">Check-in</dt>
                                <dd className="font-medium text-gray-900 dark:text-white">{formatDateTime(reservation.check_in_date)}</dd>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
                                <dt className="text-gray-500">Check-out</dt>
                                <dd className="font-medium text-gray-900 dark:text-white">{formatDateTime(reservation.check_out_date)}</dd>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
                                <dt className="text-gray-500">Guests</dt>
                                <dd className="font-medium text-gray-900 dark:text-white">{reservation.guests}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Total</dt>
                                <dd className="font-bold text-gray-900 dark:text-white">{formatPrice(reservation.total_amount)}</dd>
                            </div>
                        </dl>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
