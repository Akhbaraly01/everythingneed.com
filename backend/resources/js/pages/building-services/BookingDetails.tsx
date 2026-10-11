import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { errorMessage, api } from '@/lib/api';
import { statusTone } from '@/lib/lifecycle';
import { useEffect, useState } from 'react';
import {HardHat, Calendar, MapPin, DollarSign} from 'lucide-react';

interface Booking {
    id: string;
    worker_type: string;
    service_category: string;
    description: string;
    address: string;
    scheduled_date: string;
    scheduled_time: string;
    estimated_cost: number;
    notes: string;
    status: string;
}

const NEXT_STEPS: Record<string, { status: string; label: string; primary: boolean }[]> = {
    pending: [
        { status: 'confirmed', label: 'Confirm booking', primary: true },
        { status: 'cancelled', label: 'Cancel', primary: false },
    ],
    confirmed: [
        { status: 'in_progress', label: 'Start work', primary: true },
        { status: 'cancelled', label: 'Cancel', primary: false },
    ],
    in_progress: [
        { status: 'completed', label: 'Mark completed', primary: true },
        { status: 'cancelled', label: 'Cancel', primary: false },
    ],
};

export default function BuildingServiceBookingDetails({ booking_id }: { booking_id?: string }) {
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const id = booking_id || new URLSearchParams(window.location.search).get('id') || window.location.pathname.split('/').pop();
        if (id) {
            api.get<{ data: Booking }>(`/api/building-services/bookings/${id}`)
                .then((res) => setBooking(res.data))
                .catch(() => {})
                .finally(() => setLoading(false));
        } else setLoading(false);
    }, [booking_id]);

    const transition = async (status: string) => {
        if (!booking) return;
        setBusy(true);
        setError(null);
        try {
            const res = await api.post<{ data: Booking }>(`/api/building-services/bookings/${booking.id}/transition`, { status });
            setBooking(res.data);
        } catch (e) {
            setError(errorMessage(e, 'Could not update the booking'));
        } finally {
            setBusy(false);
        }
    };

    if (loading) return <AppLayout title="Booking Details"><p className="p-12 text-center text-gray-500">Loading...</p></AppLayout>;
    if (!booking) return <AppLayout title="Booking Details"><p className="p-12 text-center text-red-500">Booking not found</p></AppLayout>;

    const steps = NEXT_STEPS[booking.status] ?? [];

    return (
        <AppLayout title="Booking Details">
            <Head title="Booking Details" />
            <div className="mx-auto max-w-2xl space-y-6">
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="flex items-center gap-3 mb-4">
                        <HardHat className="h-6 w-6 text-blue-600" />
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white capitalize">{booking.worker_type} — {booking.service_category}</h1>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusTone(booking.status)}`}>{booking.status}</span>

                    {steps.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-3">
                            {steps.map((step) => (
                                <button
                                    key={step.status}
                                    type="button"
                                    disabled={busy}
                                    onClick={() => transition(step.status)}
                                    className={
                                        step.primary
                                            ? 'rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50'
                                            : 'rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-700 dark:text-red-400'
                                    }
                                >
                                    {step.label}
                                </button>
                            ))}
                        </div>
                    )}
                    {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
                </div>
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-3">
                    <p className="text-gray-700 dark:text-gray-300">{booking.description}</p>
                    <div className="divide-y dark:divide-gray-700">
                        <div className="flex justify-between py-2"><span className="text-gray-500 flex items-center gap-1"><MapPin className="h-4 w-4" /> Address</span><span className="font-medium dark:text-white">{booking.address}</span></div>
                        <div className="flex justify-between py-2"><span className="text-gray-500 flex items-center gap-1"><Calendar className="h-4 w-4" /> Date</span><span className="font-medium dark:text-white">{booking.scheduled_date} {booking.scheduled_time}</span></div>
                        <div className="flex justify-between py-2"><span className="text-gray-500 flex items-center gap-1"><DollarSign className="h-4 w-4" /> Budget</span><span className="font-medium dark:text-white">${booking.estimated_cost || 'TBD'}</span></div>
                    </div>
                    {booking.notes && <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded dark:bg-gray-700">{booking.notes}</p>}
                </div>
            </div>
        </AppLayout>
    );
}
