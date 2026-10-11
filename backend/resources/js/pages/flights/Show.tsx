import { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { type Flight } from '@/types';
import { api, errorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import { toast } from 'sonner';
import {
    ArrowLeft, Plane, ArrowRight, Clock, Users, ShieldCheck, Plus, Trash2,
} from 'lucide-react';

interface PassengerForm {
    name: string;
    passport: string;
}

interface Props {
    flight: Flight & { days_of_week?: number[] };
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function FlightShow({ flight }: Props) {
    const [passengers, setPassengers] = useState<PassengerForm[]>([{ name: '', passport: '' }]);
    const [travelDate, setTravelDate] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const seatCount = passengers.length;
    const total = useMemo(() => (Number(flight.price) * seatCount).toFixed(2), [flight.price, seatCount]);
    const seatsLeft = flight.seats_available;

    const addPassenger = () => {
        if (seatCount >= 6 || seatCount >= seatsLeft) return;
        setPassengers((p) => [...p, { name: '', passport: '' }]);
    };

    const removePassenger = (idx: number) => {
        if (seatCount === 1) return;
        setPassengers((p) => p.filter((_, i) => i !== idx));
    };

    const updatePassenger = (idx: number, patch: Partial<PassengerForm>) =>
        setPassengers((p) => p.map((x, i) => (i === idx ? { ...x, ...patch } : x)));

    const book = async () => {
        setSubmitting(true);
        try {
            const res = await api.post<{ data: { booking_id: string; reference: string } }>(`/api/flights/${flight.id}/book`, {
                travel_date: travelDate,
                contact_email: contactEmail || null,
                passengers: passengers.map((p) => ({ name: p.name.trim(), passport: p.passport.trim() || null })),
            });
            toast.success('Flight booked', { description: `Reference ${res.data.reference}` });
            router.visit(`/flights/confirmation/${res.data.booking_id}`);
        } catch (err) {
            toast.error(errorMessage(err, 'Booking failed'));
        } finally {
            setSubmitting(false);
        }
    };

    const valid =
        travelDate &&
        passengers.every((p) => p.name.trim().length > 1) &&
        seatCount <= seatsLeft;

    return (
        <AppLayout title="Flight details">
            <Head title={`${flight.flight_number} — ${flight.origin_city} to ${flight.destination_city}`} />
            <div className="mx-auto max-w-4xl px-4 py-8">
                <Link href="/flights" className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-sky-600">
                    <ArrowLeft className="h-4 w-4" /> Back to search
                </Link>

                {/* Flight summary */}
                <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{flight.airline} · {flight.flight_number}</p>
                            <p className="text-xs text-gray-500">Operates: {(flight.days_of_week ?? []).map((d) => DAYS[d]).join(', ')}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${seatsLeft <= 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-800'}`}>
                            {seatsLeft} seats left
                        </span>
                    </div>

                    <div className="flex items-center justify-between border-y border-dashed border-gray-200 py-5 dark:border-gray-600">
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{flight.departure_time?.slice(0, 5)}</p>
                            <p className="text-sm font-medium text-gray-600">{flight.origin_code}</p>
                            <p className="text-xs text-gray-400">{flight.origin_city}</p>
                        </div>
                        <div className="flex flex-col items-center px-4">
                            <Clock className="mb-1 h-4 w-4 text-gray-400" />
                            <span className="text-xs text-gray-500">{Math.floor(flight.duration_minutes / 60)}h {flight.duration_minutes % 60}m</span>
                            <Plane className="my-1 h-5 w-5 rotate-90 text-sky-500" />
                            <span className="text-[10px] uppercase tracking-wide text-gray-400">Direct</span>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{flight.arrival_time?.slice(0, 5)}</p>
                            <p className="text-sm font-medium text-gray-600">{flight.destination_code}</p>
                            <p className="text-xs text-gray-400">{flight.destination_city}</p>
                        </div>
                    </div>

                    <div className="mt-4 flex items-baseline justify-between">
                        <span className="text-sm text-gray-500">Fare per passenger</span>
                        <span className="text-2xl font-bold text-sky-600">{formatPrice(Number(flight.price))}</span>
                    </div>
                </div>

                {/* Booking form */}
                <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                        <Users className="h-5 w-5" /> Passenger information ({seatCount})
                    </h2>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Travel date</label>
                            <input
                                type="date"
                                min={new Date().toISOString().slice(0, 10)}
                                value={travelDate}
                                onChange={(e) => setTravelDate(e.target.value)}
                                className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Contact email <span className="font-normal text-gray-400">(optional)</span></label>
                            <input
                                type="email"
                                value={contactEmail}
                                onChange={(e) => setContactEmail(e.target.value)}
                                placeholder="Confirmations go to your account email by default"
                                className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>

                    {passengers.map((p, i) => (
                        <div key={i} className="grid grid-cols-1 gap-3 rounded-lg bg-gray-50 p-4 sm:grid-cols-[auto_1fr_1fr_auto] dark:bg-gray-700/40">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">{i + 1}</span>
                            <input
                                required
                                value={p.name}
                                onChange={(e) => updatePassenger(i, { name: e.target.value })}
                                placeholder="Full name (as on ID)"
                                className="rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                            <input
                                value={p.passport}
                                onChange={(e) => updatePassenger(i, { passport: e.target.value })}
                                placeholder="Passport / ID number (optional)"
                                className="rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                            {seatCount > 1 && (
                                <button type="button" onClick={() => removePassenger(i)} className="text-gray-400 hover:text-red-500">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={addPassenger}
                        disabled={seatCount >= 6 || seatCount >= seatsLeft}
                        className="flex items-center gap-1.5 text-sm font-medium text-sky-600 hover:text-sky-700 disabled:text-gray-300"
                    >
                        <Plus className="h-4 w-4" /> Add another passenger
                    </button>

                    {/* Review + confirm */}
                    <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                        <div className="mb-3 space-y-1.5 text-sm">
                            <Row label={`${formatPrice(Number(flight.price))} × ${seatCount} passenger${seatCount > 1 ? 's' : ''}`} value={formatPrice(Number(total))} />
                            <Row label="Taxes & fees" value="Included" muted />
                            <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900 dark:border-gray-700 dark:text-white">
                                <span>Total</span><span>{formatPrice(Number(total))}</span>
                            </div>
                        </div>
                        <p className="mb-4 flex items-center gap-1.5 text-xs text-gray-500"><ShieldCheck className="h-4 w-4 text-green-500" /> Free cancellation — seats are released back to inventory.</p>
                        <div className="flex justify-end">
                            <button
                                onClick={book}
                                disabled={!valid || submitting}
                                className="flex items-center gap-2 rounded-lg bg-sky-600 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {submitting ? 'Processing…' : <>Confirm booking <ArrowRight className="h-4 w-4" /></>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
    return (
        <div className={`flex justify-between ${muted ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>
            <span>{label}</span><span>{value}</span>
        </div>
    );
}
