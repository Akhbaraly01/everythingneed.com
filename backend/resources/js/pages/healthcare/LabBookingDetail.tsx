import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import LoadingState, { ErrorState } from '@/components/shared/LoadingState';
import { toast } from 'sonner';

interface LabBookingDetail {
    id: string;
    booking_number: string;
    appointment_date?: string | null;
    appointment_time?: string | null;
    status: string;
    is_paid: boolean;
    price: number;
    notes?: string | null;
    lab_test?: {
        id?: string;
        name?: string;
        preparation_instructions?: string | null;
        result_time_hours?: number | null;
    } | null;
    created_at: string;
}

interface DetailProps {
    booking_id: string;
}

export default function LabBookingDetail({ booking_id }: DetailProps) {
    const [booking, setBooking] = useState<LabBookingDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [paying, setPaying] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        setLoading(true);
        setError(null);
        api.get<{ data: LabBookingDetail }>(`/api/health/labs/bookings/${booking_id}`)
            .then((res) => setBooking(res.data))
            .catch((e) => setError(errorMessage(e, 'Booking not found')))
            .finally(() => setLoading(false));
    }, [booking_id, attempt]);

    const handlePay = async () => {
        setPaying(true);
        try {
            const res = await api.post<{ data: LabBookingDetail }>(`/api/health/labs/bookings/${booking_id}/pay`, { method: 'wallet' });
            setBooking(res.data);
            toast.success('Booking paid');
        } catch (err) {
            toast.error(errorMessage(err, 'Payment failed'));
        } finally {
            setPaying(false);
        }
    };

    const handleCancel = async () => {
        setCancelling(true);
        try {
            const res = await api.post<{ data: LabBookingDetail }>(`/api/health/labs/bookings/${booking_id}/cancel`);
            setBooking(res.data);
            toast.success('Booking cancelled');
        } catch (err) {
            toast.error(errorMessage(err, 'Cancellation failed'));
        } finally {
            setCancelling(false);
        }
    };

    return (
        <AppLayout title="Lab Booking">
            <Head title="Lab Booking" />
            <div className="mx-auto max-w-2xl space-y-6">
                <Link href="/healthcare/labs/bookings" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    ← My lab bookings
                </Link>

                {loading ? (
                    <LoadingState message="Loading booking..." />
                ) : error || !booking ? (
                    <ErrorState
                        message={error ?? 'This booking does not exist or belongs to another patient.'}
                        onRetry={() => setAttempt((n) => n + 1)}
                    />
                ) : (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{booking.lab_test?.name ?? 'Lab test'}</h1>
                        <p className="mt-1 text-sm text-gray-500">{booking.booking_number}</p>

                        {booking.lab_test?.preparation_instructions && (
                            <div className="mt-4 rounded bg-amber-50 p-4 dark:bg-amber-900/20">
                                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Preparation</p>
                                <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">{booking.lab_test.preparation_instructions}</p>
                            </div>
                        )}

                        <dl className="mt-6 space-y-3 text-sm">
                            <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
                                <dt className="text-gray-500">Status</dt>
                                <dd className="font-medium capitalize text-gray-900 dark:text-white">{booking.status}</dd>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
                                <dt className="text-gray-500">Payment</dt>
                                <dd className="font-medium text-gray-900 dark:text-white">
                                    {booking.is_paid ? 'Paid' : `Unpaid · $${booking.price}`}
                                </dd>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
                                <dt className="text-gray-500">Scheduled</dt>
                                <dd className="font-medium text-gray-900 dark:text-white">
                                    {[booking.appointment_date, booking.appointment_time].filter(Boolean).join(' ') || 'Not scheduled'}
                                </dd>
                            </div>
                            {booking.lab_test?.result_time_hours != null && (
                                <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
                                    <dt className="text-gray-500">Results ready</dt>
                                    <dd className="font-medium text-gray-900 dark:text-white">Within {booking.lab_test.result_time_hours} hours</dd>
                                </div>
                            )}
                            {booking.notes && (
                                <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
                                    <dt className="text-gray-500">Notes</dt>
                                    <dd className="font-medium text-gray-900 dark:text-white">{booking.notes}</dd>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Booked</dt>
                                <dd className="font-medium text-gray-900 dark:text-white">{formatDateTime(booking.created_at)}</dd>
                            </div>
                        </dl>

                        <div className="mt-6 flex flex-wrap gap-3">
                            {!booking.is_paid && booking.status !== 'cancelled' && (
                                <button
                                    type="button"
                                    onClick={handlePay}
                                    disabled={paying}
                                    className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                                >
                                    {paying ? 'Paying...' : 'Pay now'}
                                </button>
                            )}
                            {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    disabled={cancelling}
                                    className="rounded-lg border border-red-300 px-5 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                                >
                                    {cancelling ? 'Cancelling...' : 'Cancel booking'}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
