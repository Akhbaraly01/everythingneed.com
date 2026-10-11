import { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { api, errorMessage, rows } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import { toast } from 'sonner';
import PaySheet from '@/components/shared/PaySheet';
import {
    HardHat, Star, Briefcase, CalendarClock,
    MapPin, Wrench, ClipboardList,
} from 'lucide-react';

interface ServiceWorker {
    id: string;
    full_name: string;
    worker_type: string;
    bio?: string;
    hourly_rate?: number | string;
    experience_years?: number;
    completed_jobs?: number;
    rating?: number | string;
}

interface Booking {
    id: string;
    worker_type: string;
    service_category?: string;
    address: string;
    scheduled_date: string;
    scheduled_time?: string;
    estimated_cost?: number | string;
    status: string;
}

interface ServiceDef {
    id: string;
    name: string;
    category: string;
    description: string | null;
    provider: string | null;
    pricing_mode: string;
    base_price: number | string;
    currency: string;
    location: string | null;
    availability: { days?: string; hours?: string } | null;
    requires_booking: boolean;
    requires_payment: boolean;
    booking_fields: Array<{ label: string; type: string; required: boolean }> | null;
    cancellation_rules: string | null;
    delivery_rules: string | null;
    status: string;
}

interface ServiceBookingRow {
    id: string;
    booking_number: string;
    status: string;
    payment_status: string;
    amount: number | string;
    currency: string;
    created_at: string;
    service?: { id: string; name: string } | null;
}

interface Props {
    services: ServiceWorker[];
    myBookings: Booking[];
}

const bookingStatusStyles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    assigned: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-cyan-100 text-cyan-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-700',
};

export default function BuildingServicesIndex({ services, myBookings }: Props) {
    const [selected, setSelected] = useState<ServiceWorker | null>(null);
    const [busy, setBusy] = useState(false);

    const [form, setForm] = useState({
        worker_type: '',
        scheduled_date: '',
        scheduled_time: '',
        address: '',
        description: '',
    });

    // Admin-created services (spec 39/100): discoverable + bookable here.
    const [serviceDefs, setServiceDefs] = useState<ServiceDef[]>([]);
    const [serviceBookings, setServiceBookings] = useState<ServiceBookingRow[]>([]);
    const [bookTarget, setBookTarget] = useState<ServiceDef | null>(null);
    const [bookStep, setBookStep] = useState<'form' | 'pay'>('form');
    const [createdBooking, setCreatedBooking] = useState<ServiceBookingRow | null>(null);
    const [payTarget, setPayTarget] = useState<ServiceBookingRow | null>(null);
    const [serviceNotes, setServiceNotes] = useState('');
    const [serviceAnswers, setServiceAnswers] = useState<Record<string, string>>({});
    const [serviceBusy, setServiceBusy] = useState(false);

    const loadServiceDefs = async () => {
        try {
            const res = await api.get<{ data: ServiceDef[] }>('/api/services?category=building&per_page=12');
            setServiceDefs(rows<ServiceDef>(res));
        } catch {
            /* discovery section is best-effort */
        }
    };

    const loadServiceBookings = async () => {
        try {
            const res = await api.get<{ data: ServiceBookingRow[] }>('/api/services/bookings/mine?per_page=20');
            setServiceBookings(rows<ServiceBookingRow>(res));
        } catch {
            /* requires auth - section hidden for guests */
        }
    };

    useEffect(() => {
        void loadServiceDefs();
        void loadServiceBookings();
    }, []);

    const openServiceBooking = (svc: ServiceDef) => {
        setBookTarget(svc);
        setBookStep('form');
        setCreatedBooking(null);
        setServiceNotes('');
        setServiceAnswers({});
    };

    const submitServiceBooking = async () => {
        if (!bookTarget) return;
        setServiceBusy(true);
        try {
            const res = await api.post<{ data: ServiceBookingRow }>(`/api/services/${bookTarget.id}/book`, {
                notes: serviceNotes || null,
                answers: Object.keys(serviceAnswers).length ? serviceAnswers : null,
            });
            const booking = res.data;
            setCreatedBooking(booking);
            if (bookTarget.requires_payment && Number(booking.amount) > 0) {
                setBookStep('pay');
            } else {
                toast.success('Booking created', { description: `Reference ${booking.booking_number}` });
                setBookTarget(null);
                void loadServiceBookings();
            }
        } catch (err) {
            toast.error(errorMessage(err, 'Booking failed'));
        } finally {
            setServiceBusy(false);
        }
    };

    const cancelServiceBooking = async (booking: ServiceBookingRow) => {
        try {
            await api.post(`/api/services/bookings/${booking.id}/cancel`);
            toast.success(`Booking ${booking.booking_number} cancelled.`);
            void loadServiceBookings();
        } catch (err) {
            toast.error(errorMessage(err, 'Could not cancel booking'));
        }
    };

    const openBooking = (w: ServiceWorker) => {
        setSelected(w);
        setForm((f) => ({ ...f, worker_type: w.worker_type }));
    };

    const book = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        try {
            await api.post('/api/building-services/book', {
                worker_type: form.worker_type || selected?.worker_type || 'general',
                scheduled_date: form.scheduled_date,
                scheduled_time: form.scheduled_time || null,
                address: form.address,
                description: form.description || null,
            });
            toast.success('Request sent', { description: 'The provider will confirm your slot.' });
            setSelected(null);
            router.reload({ only: ['myBookings'] });
        } catch (err) {
            toast.error(errorMessage(err, 'Booking failed'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <AppLayout title="Building services">
            <Head title="Building & construction services" />
            <div className="mx-auto max-w-6xl px-4 py-8">
                <div className="mb-8 flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100"><HardHat className="h-6 w-6 text-orange-600" /></span>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Building Services</h1>
                        <p className="text-sm text-gray-500">Vetted masons, electricians, welders and general contractors</p>
                    </div>
                </div>

                {/* Providers */}
                <h2 className="mb-4 font-bold text-gray-900 dark:text-white">Available providers ({services.length})</h2>
                {services.length === 0 ? (
                    <div className="mb-8 rounded-xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-600">
                        <Wrench className="mx-auto mb-3 h-9 w-9 text-gray-300" />
                        <p className="text-sm text-gray-500">No providers available right now — check back soon.</p>
                    </div>
                ) : (
                    <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {services.map((w) => (
                            <div key={w.id} className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                                <div className="mb-2 flex items-start justify-between">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100"><HardHat className="h-5 w-5 text-orange-600" /></span>
                                    {Number(w.rating ?? 0) > 0 && (
                                        <span className="flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-white">
                                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> {Number(w.rating).toFixed(1)}
                                        </span>
                                    )}
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">{w.full_name}</h3>
                                <p className="text-xs capitalize text-gray-500">{String(w.worker_type).replace('_', ' ')}</p>
                                {w.bio && <p className="mt-1.5 line-clamp-2 text-xs text-gray-500">{w.bio}</p>}
                                <div className="mt-3 flex items-center gap-3 text-[11px] text-gray-400">
                                    {w.hourly_rate && <span>{formatPrice(Number(w.hourly_rate))}/hr</span>}
                                    <span>{w.experience_years ?? 0} yrs exp</span>
                                    <span>{w.completed_jobs ?? 0} jobs</span>
                                </div>
                                <button
                                    onClick={() => openBooking(w)}
                                    className="mt-4 w-full rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700"
                                >
                                    Request this provider
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Admin-created services (spec 100: auto-discoverable) */}
                <h2 className="mb-4 font-bold text-gray-900 dark:text-white">Building services ({serviceDefs.length})</h2>
                {serviceDefs.length === 0 ? (
                    <p className="mb-10 rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-400 dark:bg-gray-700/40">
                        No bookable services published yet.
                    </p>
                ) : (
                    <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {serviceDefs.map((svc) => (
                            <div key={svc.id} className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                                <div className="mb-2 flex items-start justify-between gap-2">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{svc.name}</h3>
                                    <div className="flex shrink-0 gap-1">
                                        {svc.requires_booking && (
                                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">Booking required</span>
                                        )}
                                        {svc.requires_payment && (
                                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">Payment required</span>
                                        )}
                                    </div>
                                </div>
                                {svc.description && <p className="line-clamp-2 text-xs text-gray-500">{svc.description}</p>}
                                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-400">
                                    {svc.provider && <span>{svc.provider}</span>}
                                    {svc.location && <span>{svc.location}</span>}
                                    {svc.availability?.days && <span>{svc.availability.days}{svc.availability.hours ? ` · ${svc.availability.hours}` : ''}</span>}
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-orange-600">
                                        {formatPrice(Number(svc.base_price))}
                                        <span className="text-xs font-normal text-gray-400"> / {svc.pricing_mode}</span>
                                    </span>
                                    <button
                                        onClick={() => openServiceBooking(svc)}
                                        className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700"
                                    >
                                        Book service
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* My bookings */}
                <h2 className="mb-4 flex items-center gap-2 font-bold text-gray-900 dark:text-white"><ClipboardList className="h-5 w-5" /> My bookings</h2>
                {myBookings.length === 0 ? (
                    <p className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-400 dark:bg-gray-700/40">No building-service bookings yet.</p>
                ) : (
                    <div className="space-y-2">
                        {myBookings.map((b) => (
                            <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                                <div>
                                    <p className="text-sm font-medium capitalize text-gray-900 dark:text-white">{String(b.worker_type).replace('_', ' ')}{b.service_category ? ` — ${b.service_category}` : ''}</p>
                                    <p className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                                        <CalendarClock className="h-3.5 w-3.5" /> {b.scheduled_date}{b.scheduled_time ? ` ${b.scheduled_time}` : ''}
                                        · <MapPin className="h-3.5 w-3.5" /> {b.address}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {b.estimated_cost && <span className="text-sm font-semibold text-orange-600">{formatPrice(Number(b.estimated_cost))}</span>}
                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${bookingStatusStyles[b.status] ?? ''}`}>{b.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* My service bookings (admin-created services) */}
                {serviceBookings.length > 0 && (
                    <>
                        <h2 className="mb-4 flex items-center gap-2 font-bold text-gray-900 dark:text-white"><ClipboardList className="h-5 w-5" /> My service bookings</h2>
                        <div className="mb-10 space-y-2">
                            {serviceBookings.map((b) => (
                                <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{b.service?.name ?? 'Service'} <span className="font-mono text-xs text-gray-400">({b.booking_number})</span></p>
                                        <p className="mt-0.5 text-xs text-gray-500">{new Date(b.created_at).toLocaleString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-orange-600">{formatPrice(Number(b.amount))}</span>
                                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${bookingStatusStyles[b.status] ?? ''}`}>{b.status}</span>
                                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">{b.payment_status}</span>
                                        {b.payment_status === 'unpaid' && Number(b.amount) > 0 && b.status !== 'cancelled' && (
                                            <button
                                                onClick={() => setPayTarget(b)}
                                                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                                            >
                                                Pay now
                                            </button>
                                        )}
                                        {(b.status === 'pending' || b.status === 'confirmed') && (
                                            <button
                                                onClick={() => void cancelServiceBooking(b)}
                                                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:border-red-800"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Booking modal */}
                {selected && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} />
                        <form onSubmit={book} className="relative w-full max-w-md space-y-3 rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                            <div className="flex items-center justify-between">
                                <h2 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white"><Briefcase className="h-5 w-5 text-orange-600" /> Book {selected.full_name}</h2>
                            </div>
                            <input required type="date" value={form.scheduled_date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setForm((f) => ({ ...f, scheduled_date: e.target.value }))} className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                            <input value={form.scheduled_time} onChange={(e) => setForm((f) => ({ ...f, scheduled_time: e.target.value }))} placeholder="Preferred time (e.g. morning)" className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                            <textarea required rows={2} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Site address" className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                            <textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Describe the work…" className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                            <div className="flex justify-end gap-2 pt-1">
                                <button type="button" onClick={() => setSelected(null)} className="rounded-lg px-4 py-2 text-sm text-gray-500">Cancel</button>
                                <button type="submit" disabled={busy} className="rounded-lg bg-orange-600 px-5 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60">
                                    {busy ? 'Sending…' : 'Send request'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Admin service booking modal (form -> pay) */}
                {bookTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/50" onClick={() => !serviceBusy && setBookTarget(null)} />
                        <div className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                                    <ClipboardList className="h-5 w-5 text-orange-600" />
                                    {bookStep === 'form' ? `Book ${bookTarget.name}` : 'Complete payment'}
                                </h2>
                                <button type="button" onClick={() => setBookTarget(null)} aria-label="Close" className="text-gray-400 hover:text-gray-600">✕</button>
                            </div>

                            {bookStep === 'form' ? (
                                <div className="space-y-3">
                                    <p className="text-xs text-gray-500">
                                        {formatPrice(Number(bookTarget.base_price))} · {bookTarget.pricing_mode}
                                        {bookTarget.cancellation_rules ? ` · ${bookTarget.cancellation_rules}` : ''}
                                    </p>
                                    {(bookTarget.booking_fields ?? []).map((f) => (
                                        <label key={f.label} className="block text-sm">
                                            <span className="text-xs text-gray-500">{f.label}{f.required ? ' *' : ''}</span>
                                            <input
                                                required={f.required}
                                                value={serviceAnswers[f.label] ?? ''}
                                                onChange={(e) => setServiceAnswers((a) => ({ ...a, [f.label]: e.target.value }))}
                                                className="mt-1 w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            />
                                        </label>
                                    ))}
                                    <textarea
                                        rows={2}
                                        value={serviceNotes}
                                        onChange={(e) => setServiceNotes(e.target.value)}
                                        placeholder="Notes for the provider (optional)"
                                        className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                    <div className="flex justify-end gap-2 pt-1">
                                        <button type="button" onClick={() => setBookTarget(null)} className="rounded-lg px-4 py-2 text-sm text-gray-500">Cancel</button>
                                        <button
                                            type="button"
                                            onClick={() => void submitServiceBooking()}
                                            disabled={serviceBusy}
                                            className="rounded-lg bg-orange-600 px-5 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
                                        >
                                            {serviceBusy ? 'Booking…' : 'Book'}
                                        </button>
                                    </div>
                                </div>
                            ) : createdBooking ? (
                                <PaySheet
                                    endpoint={`/api/services/bookings/${createdBooking.id}/pay`}
                                    amount={Number(createdBooking.amount)}
                                    title={`Pay for ${createdBooking.booking_number}`}
                                    onPaid={() => {
                                        setBookTarget(null);
                                        void loadServiceBookings();
                                    }}
                                />
                            ) : null}
                        </div>
                    </div>
                )}

                {/* Pay an existing service booking */}
                {payTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/50" onClick={() => setPayTarget(null)} />
                        <div className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                            <PaySheet
                                endpoint={`/api/services/bookings/${payTarget.id}/pay`}
                                amount={Number(payTarget.amount)}
                                title={`Pay for ${payTarget.booking_number}`}
                                onPaid={() => {
                                    setPayTarget(null);
                                    void loadServiceBookings();
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
