import { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import Image from '@/components/shared/Image';
import { api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import {
    Sparkles,
    MapPin,
    Clock,
    CalendarCheck,
    CheckCircle2,
    ChevronLeft,
} from 'lucide-react';

interface ServiceRow {
    id: string;
    name: string;
    category: string;
    categoryRef?: { id: string; name: string; slug: string; color?: string | null } | null;
    description: string | null;
    image_url: string | null;
    provider: string | null;
    pricing_mode: string;
    base_price: string | number;
    currency: string;
    location: string | null;
    availability: { days?: string; hours?: string } | null;
    requires_booking: boolean;
    requires_payment: boolean;
    cancellation_rules: string | null;
    delivery_rules: string | null;
    documents: string[] | null;
}

interface Props {
    service: ServiceRow;
    related: ServiceRow[];
}

const money = (value: string | number, currency: string) => `${currency} ${Number(value).toFixed(2)}`;

export default function ServiceShow({ service, related }: Props) {
    const { auth } = usePage().props as { auth?: { user?: { id: string } } };
    const [notes, setNotes] = useState('');
    const [booking, setBooking] = useState(false);
    const [booked, setBooked] = useState<string | null>(null);

    const book = async () => {
        setBooking(true);
        try {
            const res = await api.post<{ message: string; data: { booking_number: string } }>(
                `/api/services/${service.id}/book`,
                { notes: notes.trim() || null },
            );
            setBooked(res.data?.booking_number ?? 'created');
            toast.success(res.message ?? 'Booking created.');
        } catch (e) {
            toast.error(errorMessage(e, 'Could not create booking'));
        } finally {
            setBooking(false);
        }
    };

    return (
        <AppLayout title={service.name}>
            <Head title={service.name} />
            <div className="mx-auto max-w-6xl px-4 py-8">
                <Link href="/services" className="mb-4 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline">
                    <ChevronLeft className="h-4 w-4" /> All services
                </Link>

                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <div className="flex h-72 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/20">
                            {service.image_url ? (
                                <Image src={service.image_url} alt={service.name} className="h-full w-full object-cover" />
                            ) : (
                                <Sparkles className="h-16 w-16 text-indigo-500/60" />
                            )}
                        </div>

                        <div className="mt-6">
                            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
                                {service.categoryRef?.name ?? service.category}
                            </span>
                            <h1 data-testid="service-detail-name" className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
                                {service.name}
                            </h1>
                            {service.provider && <p className="mt-1 text-sm text-gray-500">by {service.provider}</p>}
                            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                {service.location && (
                                    <span className="inline-flex items-center gap-1">
                                        <MapPin className="h-4 w-4" /> {service.location}
                                    </span>
                                )}
                                {service.availability?.days && (
                                    <span className="inline-flex items-center gap-1">
                                        <Clock className="h-4 w-4" /> {service.availability.days}
                                        {service.availability.hours ? ` · ${service.availability.hours}` : ''}
                                    </span>
                                )}
                            </div>
                            {service.description && (
                                <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                                    {service.description}
                                </p>
                            )}

                            {(service.documents ?? []).length > 0 && (
                                <div className="mt-6 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">What to prepare</h2>
                                    <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                        {(service.documents ?? []).map((doc) => (
                                            <li key={doc} className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-indigo-500" /> {doc}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {service.cancellation_rules && (
                                <p className="mt-4 text-xs text-gray-500">Cancellation: {service.cancellation_rules}</p>
                            )}
                            {service.delivery_rules && (
                                <p className="mt-1 text-xs text-gray-500">Delivery: {service.delivery_rules}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {money(service.base_price, service.currency || 'USD')}
                                <span className="ml-1 text-sm font-normal text-gray-400">/ {service.pricing_mode}</span>
                            </div>
                            {service.requires_booking ? (
                                booked ? (
                                    <div
                                        data-testid="booking-confirmation"
                                        className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-200"
                                    >
                                        <p className="font-semibold">Booking confirmed</p>
                                        <p className="mt-1 font-mono text-xs">{booked}</p>
                                        {service.requires_payment && (
                                            <p className="mt-2 text-xs">Complete payment to lock the appointment.</p>
                                        )}
                                    </div>
                                ) : auth?.user ? (
                                    <div className="mt-4">
                                        <label className="block text-sm text-gray-600 dark:text-gray-300">
                                            Notes for the provider (optional)
                                            <textarea
                                                data-testid="booking-notes"
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                rows={3}
                                                maxLength={1000}
                                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                                placeholder="Address, preferred time, special instructions…"
                                            />
                                        </label>
                                        <button
                                            type="button"
                                            data-testid="book-service-btn"
                                            onClick={() => void book()}
                                            disabled={booking}
                                            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                                        >
                                            <CalendarCheck className="h-4 w-4" />
                                            {booking ? 'Booking…' : 'Book this service'}
                                        </button>
                                    </div>
                                ) : (
                                    <Link
                                        href="/login"
                                        data-testid="book-service-login"
                                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
                                    >
                                        <CalendarCheck className="h-4 w-4" /> Login to book
                                    </Link>
                                )
                            ) : (
                                <p className="mt-4 text-sm text-gray-500">
                                    This service is arranged directly - contact {service.provider ?? 'the provider'} to
                                    proceed.
                                </p>
                            )}
                            <p className="mt-4 text-[11px] text-gray-400">
                                Booking is free to create; the provider confirms within 24 hours.
                            </p>
                        </div>
                    </div>
                </div>

                {related.length > 0 && (
                    <div className="mt-12">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">More in this category</h2>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            {related.map((r) => (
                                <Link
                                    key={r.id}
                                    href={`/services/${r.id}`}
                                    className="overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                                >
                                    <div className="flex h-28 items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/20">
                                        {r.image_url ? (
                                            <Image src={r.image_url} alt={r.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <Sparkles className="h-10 w-10 text-indigo-500/60" />
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <h3 className="line-clamp-1 text-sm font-semibold text-gray-900 dark:text-white">
                                            {r.name}
                                        </h3>
                                        <p className="mt-1 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                                            {money(r.base_price, r.currency || 'USD')}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
