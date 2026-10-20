import { statusTone } from '@/lib/lifecycle';
import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import { formatDate } from '@/lib/utils';
import { Button, buttonClasses } from '@/components/shared/Button';
import { Calendar, Clock, ChevronRight, RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Appointment {
    id: string;
    ticket_number: string;
    symptoms: string;
    description?: string | null;
    consultation_type: string;
    consultation_fee?: number | string | null;
    appointment_date: string | null;
    appointment_time: string | null;
    status: string;
    payment_status?: string;
    doctor?: { full_name?: string; specialization?: string } | null;
    created_at: string;
}

function paymentBadge(status?: string): { label: string; className: string } {
    switch (status) {
        case 'paid':
            return { label: 'Paid', className: 'bg-emerald-100 text-emerald-800' };
        case 'refunded':
            return { label: 'Refunded', className: 'bg-blue-100 text-blue-800' };
        case 'processing':
            return { label: 'Payment processing', className: 'bg-indigo-100 text-indigo-800' };
        default:
            return { label: 'Payment due', className: 'bg-amber-100 text-amber-800' };
    }
}

/**
 * The API emits `appointment_date` as an ISO datetime (model cast) while
 * timestamps may also be plain `Y-m-d`; parse both, never throw away a row
 * because of an unparsable value (fall back to the unscheduled branch).
 */
function slotDate(a: Appointment): Date | null {
    if (!a.appointment_date) return null;
    const raw = String(a.appointment_date);
    const iso = raw.includes('T') ? raw : `${raw}T${a.appointment_time ?? '00:00'}`;
    const parsed = new Date(iso);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function slotLabel(a: Appointment): string {
    if (!a.appointment_date) return '';
    const raw = String(a.appointment_date);
    return raw.includes('T') ? formatDate(raw) : raw;
}

export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

    const load = () => {
        setLoading(true);
        setError(null);
        api.get<{ data: Appointment[] }>('/api/appointments')
            .then((res) => setAppointments(res.data))
            .catch((e) => {
                setError(errorMessage(e, 'Failed to load appointments'));
                setAppointments([]);
            })
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const now = new Date();
    const filtered = appointments.filter((a) => {
        const d = slotDate(a);
        // Unscheduled tickets (no confirmed slot yet) stay in Upcoming so a
        // fresh booking never disappears from both tabs.
        if (!d) {
            return tab === 'upcoming' && a.status !== 'cancelled';
        }
        return tab === 'upcoming'
            ? d >= now && a.status !== 'cancelled'
            : d < now || a.status === 'cancelled' || a.status === 'completed';
    });

    return (
        <AppLayout title="My Appointments">
            <Head title="My Appointments" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Appointments</h1>
                    <Link href="/healthcare/doctors" className={buttonClasses('primary', 'sm')}>
                        Book New
                    </Link>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                    <Link href="/healthcare/bookings" className="font-medium text-indigo-600 hover:underline">← Health Bookings</Link>
                    <Link href="/healthcare/records" className="font-medium text-indigo-600 hover:underline">Health Records</Link>
                    <Link href="/healthcare/prescriptions" className="font-medium text-indigo-600 hover:underline">My Prescriptions</Link>
                </div>

                <div className="flex gap-2">
                    <Button onClick={() => setTab('upcoming')} variant={tab === 'upcoming' ? 'primary' : 'outline'} size="sm" className="rounded-lg px-4 py-2">
                        Upcoming
                    </Button>
                    <Button onClick={() => setTab('past')} variant={tab === 'past' ? 'primary' : 'outline'} size="sm" className="rounded-lg px-4 py-2">
                        Past
                    </Button>
                </div>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading...</p></div>
                ) : error ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-red-600 font-medium">{error}</p>
                        <Button onClick={load} variant="ghost" size="sm" className="mt-4 gap-2" iconLeft={<RefreshCcw className="h-4 w-4" />}>
                            Retry
                        </Button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No {tab} appointments</h3>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map((a) => {
                            const badge = paymentBadge(a.payment_status);
                            const fee = a.consultation_fee != null ? Number(a.consultation_fee) : null;

                            return (
                                <div key={a.id} className="rounded-lg bg-white p-6 shadow dark:bg-gray-800" data-testid={`appointment-card-${a.id}`}>
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-mono text-sm text-gray-500">{a.ticket_number}</span>
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusTone(a.status)}`}>
                                                    {a.status.replace(/_/g, ' ')}
                                                </span>
                                                <span data-testid={`appointment-payment-${a.id}`} className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                                                    {badge.label}
                                                </span>
                                            </div>
                                            <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                                                {a.doctor?.full_name
                                                    ? `Dr. ${a.doctor.full_name}${a.doctor.specialization ? ` — ${a.doctor.specialization}` : ''}`
                                                    : 'Awaiting doctor assignment'}
                                            </p>
                                            <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                                {slotLabel(a) ? (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" /> {slotLabel(a)}
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" /> To be scheduled
                                                    </span>
                                                )}
                                                {a.appointment_time && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" /> {a.appointment_time.slice(0, 5)}
                                                    </span>
                                                )}
                                                {fee != null && fee > 0 && <span>{formatPrice(fee)}</span>}
                                            </div>
                                            {a.symptoms && <p className="mt-1 text-sm text-gray-500">{a.symptoms}</p>}
                                        </div>
                                        <Link
                                            href={`/healthcare/appointments/${a.id}`}
                                            data-testid={`appointment-track-${a.id}`}
                                            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                        >
                                            Track schedule & receipt <ChevronRight className="h-3.5 w-3.5" />
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
