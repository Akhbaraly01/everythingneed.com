import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { api, ApiError } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
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
            toast.error(err instanceof ApiError ? err.message : 'Booking failed');
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
                                    {(w.rating ?? 0) > 0 && (
                                        <span className="flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-white">
                                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> {Number(w.rating).toFixed(1)}
                                        </span>
                                    )}
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">{w.full_name}</h3>
                                <p className="text-xs capitalize text-gray-500">{String(w.worker_type).replace('_', ' ')}</p>
                                {w.bio && <p className="mt-1.5 line-clamp-2 text-xs text-gray-500">{w.bio}</p>}
                                <div className="mt-3 flex items-center gap-3 text-[11px] text-gray-400">
                                    {w.hourly_rate && <span>{formatCurrency(Number(w.hourly_rate))}/hr</span>}
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
                                    {b.estimated_cost && <span className="text-sm font-semibold text-orange-600">{formatCurrency(Number(b.estimated_cost))}</span>}
                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${bookingStatusStyles[b.status] ?? ''}`}>{b.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
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
            </div>
        </AppLayout>
    );
}
