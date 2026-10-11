import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { type Flight } from '@/types';
import { formatPrice } from '@/lib/currency';
import {Search as SearchIcon, Plane, CalendarDays, ChevronLeft, ChevronRight} from 'lucide-react';

interface Props {
    flights: { data: Flight[]; current_page: number; last_page: number; total: number };
    filters: { origin?: string; destination?: string; date?: string; max_price?: string };
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function FlightsSearch({ flights, filters }: Props) {
    const [origin, setOrigin] = useState(filters.origin ?? '');
    const [destination, setDestination] = useState(filters.destination ?? '');
    const [date, setDate] = useState(filters.date ?? '');
    const [maxPrice, setMaxPrice] = useState(filters.max_price ?? '');

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const params: Record<string, string> = {};
        if (origin) params.origin = origin;
        if (destination) params.destination = destination;
        if (date) params.date = date;
        if (maxPrice) params.max_price = maxPrice;
        router.get('/flights', params, { preserveState: true });
    };

    return (
        <AppLayout title="Flights">
            <Head title="Flight search" />
            <div className="mx-auto max-w-6xl px-4 py-8">
                <div className="mb-6 flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100"><Plane className="h-6 w-6 text-sky-600" /></span>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Book a Flight</h1>
                        <p className="text-sm text-gray-500">{flights.total} departures available</p>
                    </div>
                </div>

                {/* Search form */}
                <form onSubmit={submit} className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-5 dark:border-gray-700 dark:bg-gray-800">
                    <Input label="From" value={origin} onChange={setOrigin} placeholder="City or code (ACC)" />
                    <Input label="To" value={destination} onChange={setDestination} placeholder="City or code (LHR)" />
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Departure date</label>
                        <input
                            type="date"
                            value={date}
                            min={new Date().toISOString().slice(0, 10)}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                    <Input label="Max price" value={maxPrice} onChange={setMaxPrice} type="number" placeholder="$" />
                    <button
                        type="submit"
                        className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-700"
                    >
                        <SearchIcon className="h-4 w-4" /> Search flights
                    </button>
                </form>

                {/* Results */}
                {flights.data.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="space-y-3">
                        {flights.data.map((flight) => (
                            <Link
                                key={flight.id}
                                href={`/flights/${flight.id}`}
                                className="block rounded-xl border border-gray-200 bg-white p-5 transition hover:border-sky-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    {/* Route */}
                                    <div className="flex items-center gap-4">
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-gray-900 dark:text-white">{flight.departure_time?.slice(0, 5)}</p>
                                            <p className="text-xs font-medium text-gray-500">{flight.origin_code}</p>
                                        </div>
                                        <div className="flex flex-col items-center px-2">
                                            <span className="text-[10px] uppercase tracking-wide text-gray-400">{Math.floor(flight.duration_minutes / 60)}h {flight.duration_minutes % 60}m</span>
                                            <div className="my-0.5 flex w-28 items-center gap-1">
                                                <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                                                <span className="h-px flex-1 bg-gradient-to-r from-gray-300 to-sky-400" />
                                                <Plane className="h-3.5 w-3.5 rotate-90 text-sky-500" />
                                                <span className="h-px flex-1 bg-gradient-to-l from-gray-300 to-sky-400" />
                                                <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                                            </div>
                                            <span className="text-[10px] text-gray-400">Non-stop</span>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-gray-900 dark:text-white">{flight.arrival_time?.slice(0, 5)}</p>
                                            <p className="text-xs font-medium text-gray-500">{flight.destination_code}</p>
                                        </div>
                                    </div>
                                    {/* Meta */}
                                    <div className="min-w-40">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{flight.airline}</p>
                                        <p className="text-xs text-gray-500">{flight.flight_number}</p>
                                        <p className="mt-0.5 text-[11px] text-gray-400">{DAYS.filter((_, i) => (flight.days_of_week ?? []).includes(i)).join(' · ')}</p>
                                    </div>
                                    {/* Price */}
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-sky-600">{formatPrice(Number(flight.price))}</p>
                                        <p className="text-[11px] text-gray-400">{flight.seats_available} seats left</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {flights.last_page > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-3">
                        {flights.current_page > 1 && (
                            <Link href={`/flights?page=${flights.current_page - 1}`} preserveState className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white">
                                <ChevronLeft className="h-4 w-4" />
                            </Link>
                        )}
                        <span className="text-sm text-gray-600 dark:text-gray-300">Page {flights.current_page} of {flights.last_page}</span>
                        {flights.current_page < flights.last_page && (
                            <Link href={`/flights?page=${flights.current_page + 1}`} preserveState className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white">
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function Input({ label, value, onChange, placeholder, type = 'text' }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
    return (
        <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
        </div>
    );
}

function EmptyState() {
    return (
        <div className="rounded-xl border border-dashed border-gray-300 p-16 text-center dark:border-gray-600">
            <CalendarDays className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="font-medium text-gray-900 dark:text-white">No flights match your search</p>
            <p className="text-sm text-gray-500">Try different dates or airports — not all routes operate daily.</p>
        </div>
    );
}
