import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { formatPrice } from '@/lib/currency';
import { CheckCircle2, Printer, Plane, MapPin, CalendarDays, Users } from 'lucide-react';

interface BookingDetails {
    reference: string;
    flight_number: string;
    airline: string;
    route: string;
    departure_time?: string;
    arrival_time?: string;
    travel_date: string;
    passengers: { name: string; passport?: string | null }[];
    contact_email?: string | null;
    total_price: number;
    seat_count: number;
}

interface Props {
    booking: {
        id: string;
        status: string;
        details: BookingDetails;
        user?: { name: string; email: string };
    };
}

export default function FlightConfirmation({ booking }: Props) {
    const d = booking.details;

    return (
        <AppLayout title="Booking confirmed">
            <Head title={`Booking ${d.reference}`} />
            <div className="mx-auto max-w-2xl px-4 py-8">
                <div className="mb-6 text-center">
                    <CheckCircle2 className="mx-auto mb-3 h-14 w-14 text-green-500" />
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Flight Confirmed!</h1>
                    <p className="text-sm text-gray-500">
                        A confirmation has been sent to {d.contact_email || booking.user?.email || 'your account email'}.
                    </p>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-center justify-between bg-sky-600 px-6 py-4 text-white">
                        <span className="flex items-center gap-2 font-semibold"><Plane className="h-5 w-5" /> E-Ticket</span>
                        <span className="font-mono text-lg tracking-wider">{d.reference}</span>
                    </div>

                    <div className="p-6">
                        <div className="mb-5 grid grid-cols-1 justify-items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
                            <div className="text-center sm:text-left">
                                <p className="text-xs uppercase tracking-wide text-gray-400">Departure</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{d.departure_time ?? '--:--'}</p>
                                <p className="flex items-center gap-1 text-sm text-gray-500"><MapPin className="h-3.5 w-3.5" />{d.route?.split('→')[0]?.trim()}</p>
                            </div>
                            <Plane className="hidden h-6 w-6 rotate-90 self-center text-sky-400 sm:block" />
                            <div className="text-center sm:text-right">
                                <p className="text-xs uppercase tracking-wide text-gray-400">Arrival</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{d.arrival_time ?? '--:--'}</p>
                                <p className="flex items-center justify-end gap-1 text-sm text-gray-500">{d.route?.split('→')[1]?.trim()} <MapPin className="h-3.5 w-3.5" /></p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-dashed border-gray-200 pt-4 text-sm dark:border-gray-600">
                            <Info label="Airline / Flight">{d.airline} · {d.flight_number}</Info>
                            <Info label="Travel date"><span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{d.travel_date}</span></Info>
                            <Info label="Passengers"><span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{d.seat_count}</span></Info>
                            <Info label="Total paid">{formatPrice(Number(d.total_price))}</Info>
                            <Info label="Status">
                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium capitalize text-green-800">{booking.status}</span>
                            </Info>
                        </div>

                        <div className="mt-5 border-t border-dashed border-gray-200 pt-4 dark:border-gray-600">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Passenger manifest</p>
                            <ol className="space-y-1">
                                {d.passengers?.map((p, i) => (
                                    <li key={i} className="flex justify-between rounded-md bg-gray-50 px-3 py-2 text-sm dark:bg-gray-700/40">
                                        <span className="text-gray-800 dark:text-gray-200">{i + 1}. {p.name}</span>
                                        {p.passport && <span className="font-mono text-xs text-gray-400">{p.passport}</span>}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>

                    <div className="border-t border-dashed border-gray-300 bg-gray-50 px-6 py-3 text-center text-xs text-gray-500 dark:border-gray-600 dark:bg-gray-700/30">
                        Present this reference at check-in · Arrive 2 hours before departure
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                    >
                        <Printer className="h-4 w-4" /> Print ticket
                    </button>
                    <Link href="/bookings" className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">
                        View all my bookings
                    </Link>
                    <Link href="/flights" className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400">
                        Book another flight
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
            <p className="font-medium text-gray-900 dark:text-white">{children}</p>
        </div>
    );
}
