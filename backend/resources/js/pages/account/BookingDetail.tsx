import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

interface Booking {
    id: string;
    service_type: string;
    status: string;
    details?: Record<string, unknown> | null;
    created_at: string;
}

interface DetailProps {
    booking_id: string;
}

export default function BookingDetail({ booking_id }: DetailProps) {
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get<{ data: Booking[] }>('/api/bookings?per_page=100')
            .then((res) => {
                const found = (Array.isArray(res.data) ? res.data : []).find((b) => b.id === booking_id);
                if (!found) setError('Booking not found');
                else setBooking(found);
            })
            .catch((e) => setError(errorMessage(e, 'Booking not found')))
            .finally(() => setLoading(false));
    }, [booking_id]);

    return (
        <AppLayout title="Booking">
            <Head title="Booking" />
            <div className="mx-auto max-w-2xl space-y-6">
                <Link href="/account/bookings" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    ← My bookings
                </Link>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">Loading booking...</p>
                    </div>
                ) : error || !booking ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Booking not found</h3>
                        <p className="mt-1 text-sm text-gray-500">{error ?? 'This booking does not exist.'}</p>
                    </div>
                ) : (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                            <span className="rounded bg-blue-50 px-2 py-1 text-sm font-medium capitalize dark:bg-blue-900/30 dark:text-blue-300">
                                {booking.service_type}
                            </span>
                            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium capitalize text-yellow-800">
                                {booking.status}
                            </span>
                        </div>
                        {booking.details && (
                            <pre className="mt-4 overflow-x-auto rounded-lg bg-gray-50 p-4 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                {JSON.stringify(booking.details, null, 2)}
                            </pre>
                        )}
                        <p className="mt-4 text-xs text-gray-400">Booked {formatDateTime(booking.created_at)}</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
