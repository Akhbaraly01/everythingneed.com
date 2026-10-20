import { statusTone } from '@/lib/lifecycle';
import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/currency';
import ConfirmDialog from '@/components/shared/Ui';
import PaySheet from '@/components/shared/PaySheet';
import { CalendarCheck, ArrowLeft, X, CreditCard, RefreshCcw, LogIn, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Reservation {
    id: string;
    reference: string;
    check_in_date: string;
    check_out_date: string;
    guests: number;
    total_amount: number;
    status: string;
    payment_status?: string;
    hotel_id?: string;
    hotel?: { name: string; city: string };
    room?: { room_type: string; price_per_night: number };
    checked_in_at?: string;
    checked_out_at?: string;
    created_at: string;
}

export default function ReservationsPage() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cancelFor, setCancelFor] = useState<string | null>(null);
    const [payFor, setPayFor] = useState<string | null>(null);

    const fetchReservations = () => {
        setLoading(true);
        setError(null);
        api.get<{ data: Reservation[] }>('/api/hotels/reservations/mine')
            .then((res) => setReservations(res.data))
            .catch((e) => {
                setError(errorMessage(e, 'Failed to load reservations'));
                setReservations([]);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchReservations(); }, []);

    const cancelReservation = async (id: string) => {
        try {
            await api.post(`/api/hotels/reservations/${id}/cancel`);
            toast.success('Reservation cancelled.');
            setCancelFor(null);
            fetchReservations();
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to cancel reservation'));
        }
    };

    const stayAction = async (id: string, action: 'check-in' | 'check-out') => {
        try {
            await api.post(`/api/hotels/reservations/${id}/${action}`);
            toast.success(action === 'check-in' ? 'Checked in. Enjoy your stay!' : 'Checked out. Safe travels!');
            fetchReservations();
        } catch (e) {
            toast.error(errorMessage(e, action === 'check-in' ? 'Failed to check in' : 'Failed to check out'));
        }
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
                ) : error ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-red-600 font-medium">{error}</p>
                        <button onClick={fetchReservations} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                            <RefreshCcw className="h-4 w-4" /> Retry
                        </button>
                    </div>
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
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(r.status)}`}>
                                                {r.status}
                                            </span>
                                        </div>
                                        <p className="mt-1 font-semibold text-gray-900 dark:text-white">{r.hotel?.name ?? 'Hotel'}</p>
                                        <p className="text-sm text-gray-500">{r.room?.room_type} — {r.guests} guest{r.guests !== 1 ? 's' : ''}</p>
                                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                                            <span>Check-in: {r.check_in_date}</span>
                                            <span>Check-out: {r.check_out_date}</span>
                                        </div>
                                        <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{formatPrice(r.total_amount)}</p>
                                        {['completed', 'checked_out'].includes(r.status) && r.hotel_id && (
                                            <Link
                                                href={`/reviews/create?type=hotel&id=${r.hotel_id}`}
                                                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
                                            >
                                                ★ Review your stay
                                            </Link>
                                        )}
                                        {r.status === 'pending' && r.payment_status !== 'paid' && (
                                            <button
                                                onClick={() => setPayFor(payFor === r.id ? null : r.id)}
                                                className="mt-2 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                                            >
                                                <CreditCard className="h-4 w-4" /> Pay now
                                            </button>
                                        )}
                                        {r.status === 'confirmed' && (
                                            <button
                                                onClick={() => stayAction(r.id, 'check-in')}
                                                className="mt-2 inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500"
                                            >
                                                <LogIn className="h-4 w-4" /> Check in
                                            </button>
                                        )}
                                        {r.status === 'checked_in' && (
                                            <button
                                                onClick={() => stayAction(r.id, 'check-out')}
                                                className="mt-2 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500"
                                            >
                                                <LogOut className="h-4 w-4" /> Check out
                                            </button>
                                        )}
                                        {r.checked_in_at && (
                                            <p className="mt-1 text-xs text-gray-500">Checked in: {new Date(r.checked_in_at).toLocaleString()}</p>
                                        )}
                                        {r.checked_out_at && (
                                            <p className="mt-1 text-xs text-gray-500">Checked out: {new Date(r.checked_out_at).toLocaleString()}</p>
                                        )}
                                    </div>
                                    {['pending', 'confirmed'].includes(r.status) && (
                                        <button onClick={() => setCancelFor(r.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                                            <X className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                                {payFor === r.id && r.status === 'pending' && (
                                    <div className="mt-4">
                                        <PaySheet
                                            endpoint={`/api/hotels/reservations/${r.id}/pay`}
                                            amount={r.total_amount}
                                            title="Confirm your reservation"
                                            onPaid={() => { setPayFor(null); fetchReservations(); }}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <ConfirmDialog
                    open={cancelFor !== null}
                    title="Cancel reservation?"
                    description="Cancel this hotel reservation? This cannot be undone."
                    confirmLabel="Cancel reservation"
                    danger
                    onConfirm={() => cancelFor && cancelReservation(cancelFor)}
                    onCancel={() => setCancelFor(null)}
                />
            </div>
        </AppLayout>
    );
}
