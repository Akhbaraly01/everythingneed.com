import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { FlaskConical } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import EmptyState from '@/components/shared/EmptyState';
import LoadingState, { ErrorState } from '@/components/shared/LoadingState';

interface LabBooking {
    id: string;
    booking_number: string;
    appointment_date?: string | null;
    appointment_time?: string | null;
    status: string;
    is_paid: boolean;
    price: number;
    lab_test?: { id?: string; name?: string; category?: string } | null;
    created_at: string;
}

export default function LabBookings() {
    const [bookings, setBookings] = useState<LabBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        setLoading(true);
        setError(null);
        api.get<{ data: LabBooking[] }>('/api/health/labs/bookings?per_page=50')
            .then((res) => setBookings(Array.isArray(res.data) ? res.data : []))
            .catch((e) => setError(errorMessage(e, 'Failed to load lab bookings')))
            .finally(() => setLoading(false));
    }, [attempt]);

    return (
        <AppLayout title="My Lab Bookings">
            <Head title="My Lab Bookings" />
            <div className="mx-auto max-w-3xl space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Lab Bookings</h1>
                <div className="flex flex-wrap gap-2 text-sm">
                    <Link href="/healthcare/bookings" className="font-medium text-indigo-600 hover:underline">← Health Bookings</Link>
                    <Link href="/healthcare/labs" className="font-medium text-indigo-600 hover:underline">Browse lab tests</Link>
                </div>

                {loading ? (
                    <LoadingState message="Loading bookings..." />
                ) : error ? (
                    <ErrorState message={error} onRetry={() => setAttempt((n) => n + 1)} />
                ) : bookings.length === 0 ? (
                    <EmptyState
                        icon={<FlaskConical className="h-10 w-10" />}
                        title="No lab bookings"
                        hint="Your lab test bookings will appear here."
                    >
                        <Link href="/healthcare/labs" className="mt-2 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                            Browse lab tests
                        </Link>
                    </EmptyState>
                ) : (
                    <div className="divide-y rounded-lg bg-white shadow dark:divide-gray-700 dark:bg-gray-800">
                        {bookings.map((booking) => (
                            <Link key={booking.id} href={`/healthcare/labs/bookings/${booking.id}`}
                                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {booking.lab_test?.name ?? 'Lab test'} · {booking.booking_number}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {[booking.appointment_date, booking.appointment_time].filter(Boolean).join(' ') || formatDateTime(booking.created_at)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                                        booking.is_paid
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                    }`}>
                                        {booking.is_paid ? 'Paid' : 'Unpaid'}
                                    </span>
                                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                        {booking.status}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
