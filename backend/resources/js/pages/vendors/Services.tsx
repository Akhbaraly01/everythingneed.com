import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { BadgeCheck, Clock, DollarSign, Star, ArrowLeft, CalendarCheck } from 'lucide-react';
import type { Vendor } from '@/types';
import { api, errorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import { EmptyState } from '@/components/shared/Ui';

interface VendorService {
    id: string;
    name: string;
    description?: string | null;
    price: number | string;
    duration_minutes?: number | null;
    is_active: boolean;
}

interface Pager<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
}

interface Props {
    vendor: Vendor;
    services: Pager<VendorService>;
}

export default function VendorServices({ vendor, services }: Props) {
    const { auth } = usePage().props as { auth?: { id?: string; user?: { id: string } } | null };
    const isLoggedIn = Boolean(auth?.id ?? auth?.user);
    const [booking, setBooking] = useState<VendorService | null>(null);
    const [form, setForm] = useState({ scheduled_date: '', scheduled_time: '', notes: '' });
    const [busy, setBusy] = useState(false);

    const submitBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!booking) return;
        setBusy(true);
        try {
            await api.post('/api/bookings', {
                service_type: 'vendor_service',
                service_id: booking.id,
                scheduled_date: form.scheduled_date,
                scheduled_time: form.scheduled_time,
                notes: form.notes || undefined,
            });
            toast.success('Booking requested - the store will confirm shortly');
            setBooking(null);
            setForm({ scheduled_date: '', scheduled_time: '', notes: '' });
        } catch (err) {
            toast.error(errorMessage(err, 'Booking failed'));
        } finally {
            setBusy(false);
        }
    };

    const startBooking = (service: VendorService) => {
        if (!isLoggedIn) {
            router.visit('/login');
            return;
        }
        setBooking(service);
    };

    const pagerLink = (page: number) => `/vendors/${vendor.slug ?? vendor.id}/services?page=${page}`;

    return (
        <AppLayout>
            <Head title={`${vendor.store_name} - services`} />

            <div className="mx-auto max-w-4xl space-y-6">
                <Link
                    href={`/vendors/${vendor.slug ?? vendor.id}`}
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to {vendor.store_name}
                </Link>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                                {vendor.store_name}
                                {vendor.is_verified && <BadgeCheck className="h-6 w-6 text-green-500" />}
                            </h1>
                            <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                                <span className="capitalize">{vendor.category}</span>
                                <span className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    {Number(vendor.rating ?? 0).toFixed(1)}
                                </span>
                                <span>{services.total} service{services.total !== 1 ? 's' : ''}</span>
                            </div>
                        </div>
                        <div className="flex gap-2 text-sm">
                            <Link href={`/vendors/${vendor.slug ?? vendor.id}/products`} className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">Products</Link>
                            <Link href={`/vendors/${vendor.slug ?? vendor.id}/reviews`} className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">Reviews</Link>
                        </div>
                    </div>
                </div>

                {services.data.length === 0 ? (
                    <div className="rounded-lg bg-white p-8 shadow dark:bg-gray-800">
                        <EmptyState icon={<CalendarCheck className="h-10 w-10" />} title="No services listed yet" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {services.data.map((service) => (
                            <div key={service.id} className="flex flex-wrap items-start justify-between gap-4 rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                                <div className="min-w-0 flex-1">
                                    <h2 className="font-semibold text-gray-900 dark:text-white">{service.name}</h2>
                                    {service.description && (
                                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{service.description}</p>
                                    )}
                                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-1 font-semibold text-indigo-600">
                                            <DollarSign className="h-4 w-4" />
                                            {formatPrice(Number(service.price))}
                                        </span>
                                        {service.duration_minutes ? (
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                {service.duration_minutes} min
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => startBooking(service)}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                                >
                                    Book service
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {services.last_page > 1 && (
                    <div className="flex items-center justify-center gap-3 text-sm">
                        {services.current_page > 1 && (
                            <Link href={pagerLink(services.current_page - 1)} className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">Previous</Link>
                        )}
                        <span className="text-gray-500">Page {services.current_page} of {services.last_page}</span>
                        {services.current_page < services.last_page && (
                            <Link href={pagerLink(services.current_page + 1)} className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">Next</Link>
                        )}
                    </div>
                )}

                {booking && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/50" onClick={() => !busy && setBooking(null)} />
                        <form onSubmit={submitBooking} className="relative w-full max-w-md space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                            <h2 className="font-bold text-gray-900 dark:text-white">Book: {booking.name}</h2>
                            <div>
                                <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Date</label>
                                <input
                                    required
                                    type="date"
                                    value={form.scheduled_date}
                                    min={new Date().toISOString().slice(0, 10)}
                                    onChange={(e) => setForm((f) => ({ ...f, scheduled_date: e.target.value }))}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Time</label>
                                <input
                                    required
                                    type="time"
                                    value={form.scheduled_time}
                                    onChange={(e) => setForm((f) => ({ ...f, scheduled_time: e.target.value }))}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Notes (optional)</label>
                                <textarea
                                    value={form.notes}
                                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                                    rows={3}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setBooking(null)} disabled={busy} className="rounded-lg px-4 py-2 text-sm text-gray-500">
                                    Cancel
                                </button>
                                <button type="submit" disabled={busy} className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
                                    {busy ? 'Booking…' : 'Request booking'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
