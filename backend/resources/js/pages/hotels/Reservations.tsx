import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { CalendarCheck, ArrowLeft, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Reservation {
    id: string;
    reference: string;
    check_in_date: string;
    check_out_date: string;
    guests: number;
    total_amount: number;
    status: string;
    hotel?: { name: string; city: string };
    room?: { room_type: string; price_per_night: number };
    checked_in_at?: string;
    checked_out_at?: string;
    created_at: string;
}

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    checked_in: 'bg-green-100 text-green-800',
    checked_out: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
};

export default function ReservationsPage() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchReservations = () => {
        api.get<{ data: Reservation[] }>('/api/hotels/reservations/mine')
            .then((res) => setReservations(res.data))
            .catch(() => setReservations([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchReservations(); }, []);

    const cancelReservation = async (id: string) => {
        if (!confirm('Cancel this reservation?')) return;
        try {
            await api.post(`/api/hotels/reservations/${id}/cancel`);
            fetchReservations();
        } catch {}
    };

    return (
        <AppLayout title="My Reservations">
            <Head title="Hotel Reservations" />

            <div className="space-y-6">
                <Link href="/hotels" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4" /> Browse Hotels
                </Link>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading...</p></div>
                ) : reservations.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <CalendarCheck className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No reservations</h3>
                        <Link href="/hotels" className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                            Browse Hotels
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reservations.map((r) => (
                            <div key={r.id} className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm text-gray-500">{r.reference}</span>
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[r.status] ?? 'bg-gray-100 text-gray-800'}`}>
                                                {r.status}
                                            </span>
                                        </div>
                                        <p className="mt-1 font-semibold text-gray-900 dark:text-white">{r.hotel?.name ?? 'Hotel'}</p>
                                        <p className="text-sm text-gray-500">{r.room?.room_type} — {r.guests} guest{r.guests !== 1 ? 's' : ''}</p>
                                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                                            <span>Check-in: {r.check_in_date}</span>
                                            <span>Check-out: {r.check_out_date}</span>
                                        </div>
                                        <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(r.total_amount)}</p>
                                    </div>
                                    {['pending', 'confirmed'].includes(r.status) && (
                                        <button onClick={() => cancelReservation(r.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                                            <X className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
