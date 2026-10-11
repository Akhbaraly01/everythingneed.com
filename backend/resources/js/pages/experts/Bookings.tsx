import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/currency';
import ConfirmDialog from '@/components/shared/Ui';
import PaySheet from '@/components/shared/PaySheet';
import { statusTone } from '@/lib/lifecycle';
import { CalendarCheck, ArrowLeft, X, CreditCard, RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ExpertBookingRow {
    id: string;
    booking_number: string;
    scheduled_date: string;
    scheduled_time: string;
    duration_minutes: number;
    mode: string;
    amount: number;
    currency: string;
    status: string;
    payment_status: string;
    notes?: string;
    expert?: { full_name?: string; name?: string; specialization?: string };
    created_at: string;
}

export default function ExpertBookingsPage() {
    const [bookings, setBookings] = useState<ExpertBookingRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cancelFor, setCancelFor] = useState<string | null>(null);
    const [payFor, setPayFor] = useState<string | null>(null);

    const fetchBookings = () => {
        setLoading(true);
        setError(null);
        api.get<{ data: ExpertBookingRow[] }>('/api/experts/bookings')
            .then((res) => setBookings(res.data))
            .catch((e) => {
                setError(errorMessage(e, 'Failed to load sessions'));
                setBookings([]);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchBookings(); }, []);

    const cancelBooking = async (id: string) => {
        try {
            await api.post(`/api/experts/bookings/${id}/cancel`);
            toast.success('Booking cancelled.');
            setCancelFor(null);
            fetchBookings();
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to cancel booking'));
        }
    };

    const expertName = (b: ExpertBookingRow) =>
        b.expert?.name ?? b.expert?.full_name ?? 'Expert';

    return (
        <AppLayout title="My Expert Sessions">
            <Head title="Expert Bookings" />

            <div className="space-y-6">
                <Link href="/experts" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4" /> Browse Experts
                </Link>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading...</p></div>
                ) : error ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-red-600 font-medium">{error}</p>
                        <button onClick={fetchBookings} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                            <RefreshCcw className="h-4 w-4" /> Retry
                        </button>
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <CalendarCheck className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No sessions booked yet</h3>
                        <Link href="/experts" className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                            Browse Experts
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {bookings.map((b) => (
                            <div key={b.id} className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm text-gray-500">{b.booking_number}</span>
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(b.status)}`}>{b.status}</span>
                                            {b.payment_status === 'unpaid' && b.status !== 'cancelled' && (
                                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">unpaid</span>
                                            )}
                                        </div>
                                        <p className="mt-1 font-semibold text-gray-900 dark:text-white">{expertName(b)}</p>
                                        <p className="text-sm text-gray-500">
                                            {b.scheduled_date} at {b.scheduled_time} - {b.mode} - {b.duration_minutes} min
                                        </p>
                                        <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{formatPrice(b.amount)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {b.status === 'pending' && b.payment_status === 'unpaid' && (
                                            <button
                                                onClick={() => setPayFor(payFor === b.id ? null : b.id)}
                                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                                            >
                                                <CreditCard className="h-4 w-4" /> Pay now
                                            </button>
                                        )}
                                        {['pending', 'confirmed'].includes(b.status) && (
                                            <button onClick={() => setCancelFor(b.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                                                <X className="h-5 w-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {payFor === b.id && (
                                    <div className="mt-4">
                                        <PaySheet
                                            endpoint={`/api/experts/bookings/${b.id}/pay`}
                                            amount={b.amount}
                                            title="Confirm your session"
                                            onPaid={() => { setPayFor(null); fetchBookings(); }}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <ConfirmDialog
                    open={cancelFor !== null}
                    title="Cancel session?"
                    description="Cancel this expert session? Paid sessions are refunded in full."
                    confirmLabel="Cancel session"
                    danger
                    onConfirm={() => cancelFor && cancelBooking(cancelFor)}
                    onCancel={() => setCancelFor(null)}
                />
            </div>
        </AppLayout>
    );
}
