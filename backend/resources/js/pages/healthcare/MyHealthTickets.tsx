import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { Calendar, Clock, User, AlertCircle, Video, MapPin, RotateCw, Stethoscope, RefreshCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface HealthTicket {
    id: string;
    reference?: string;
    ticket_number?: string;
    symptoms?: string;
    reason?: string;
    description?: string | null;
    status: string;
    appointment_date?: string | null;
    appointment_time?: string | null;
    type?: string;
    consultation_type?: string | null;
    consultation_fee?: number | null;
    created_at: string;
    doctor?: { name?: string; full_name?: string; specialty?: string; specialization?: string } | null;
}

type TicketFilter = 'upcoming' | 'past' | 'cancelled';

const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    assigned: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-indigo-100 text-indigo-800',
    in_consultation: 'bg-indigo-100 text-indigo-800',
    confirmed: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
};

export default function MyHealthTickets() {
    const [tickets, setTickets] = useState<HealthTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<TicketFilter>('upcoming');

    const load = () => {
        setLoading(true);
        setError(null);
        api.get<{ data: HealthTicket[] }>('/api/health/tickets')
            .then((res) => setTickets(res.data ?? []))
            .catch((e) => {
                setError(errorMessage(e, 'Failed to load tickets'));
                setTickets([]);
            })
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const { upcoming, past, cancelled } = useMemo(() => {
        const now = new Date();
        const up: HealthTicket[] = [];
        const pa: HealthTicket[] = [];
        const ca: HealthTicket[] = [];
        for (const t of tickets) {
            if (t.status === 'cancelled') {
                ca.push(t);
                continue;
            }
            if (t.status === 'completed') {
                pa.push(t);
                continue;
            }
            if (!t.appointment_date) {
                up.push(t);
                continue;
            }
            const start = new Date(`${t.appointment_date}T${t.appointment_time || '00:00'}`);
            if (start.getTime() >= now.getTime()) up.push(t);
            else pa.push(t);
        }
        return { upcoming: up, past: pa, cancelled: ca };
    }, [tickets]);

    const visible = filter === 'upcoming' ? upcoming : filter === 'past' ? past : cancelled;

    return (
        <AppLayout title="My Appointments">
            <Head title="My Appointments" />

            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Health Tickets</h2>
                    <Link
                        href="/healthcare/doctors"
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                    >
                        Book Appointment
                    </Link>
                </div>

                <div className="flex flex-wrap gap-2">
                    {(['upcoming', 'past', 'cancelled'] as TicketFilter[]).map((f) => (
                        <button
                            key={f}
                            type="button"
                            onClick={() => setFilter(f)}
                            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${
                                filter === f
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                            }`}
                        >
                            {f} ({f === 'upcoming' ? upcoming.length : f === 'past' ? past.length : cancelled.length})
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">Loading your appointments…</p>
                    </div>
                ) : error ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-red-600 font-medium">{error}</p>
                        <button onClick={load} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                            <RefreshCcw className="h-4 w-4" /> Retry
                        </button>
                    </div>
                ) : visible.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No {filter} appointments</h3>
                        <p className="mt-2 text-sm text-gray-500">
                            {filter === 'upcoming' ? 'Book your next appointment with a doctor' : 'Nothing here yet'}
                        </p>
                        {filter === 'upcoming' && (
                            <Link
                                href="/healthcare/doctors"
                                className="mt-6 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                            >
                                Book Now
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {visible.map((ticket) => (
                            <div
                                key={ticket.id}
                                className="rounded-lg bg-white p-6 shadow transition hover:shadow-md dark:bg-gray-800"
                                data-ticket-status={ticket.status}
                            >
                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                    <div className="flex-1">
                                        <div className="mb-3 flex flex-wrap items-center gap-2">
                                            <span className="font-mono text-sm font-bold text-indigo-600">
                                                {ticket.ticket_number || ticket.reference || ticket.id.slice(0, 8)}
                                            </span>
                                            <span
                                                className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                                                    STATUS_STYLES[ticket.status] ?? 'bg-gray-100 text-gray-700'
                                                }`}
                                            >
                                                {ticket.status.replace(/_/g, ' ')}
                                            </span>
                                            {(ticket.consultation_type || ticket.type) && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700">
                                                    {(ticket.consultation_type || ticket.type) === 'virtual' ? (
                                                        <Video className="h-3 w-3" />
                                                    ) : (
                                                        <MapPin className="h-3 w-3" />
                                                    )}
                                                    {(ticket.consultation_type || ticket.type) === 'virtual' ? 'Virtual' : 'Physical'}
                                                </span>
                                            )}
                                        </div>

                                        <p className="mb-2 font-medium text-gray-900 dark:text-white">
                                            {ticket.symptoms || ticket.reason || 'Consultation'}
                                        </p>
                                        {ticket.description && (
                                            <p className="mb-3 line-clamp-2 text-sm text-gray-500">{ticket.description}</p>
                                        )}

                                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                            {ticket.doctor ? (
                                                <span className="inline-flex items-center gap-1">
                                                    <User className="h-4 w-4" />
                                                    Dr. {ticket.doctor.full_name || ticket.doctor.name}
                                                    {ticket.doctor.specialization || ticket.doctor.specialty
                                                        ? ` (${ticket.doctor.specialization || ticket.doctor.specialty})`
                                                        : ''}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1">
                                                    <AlertCircle className="h-4 w-4" />
                                                    Awaiting doctor assignment
                                                </span>
                                            )}
                                            {ticket.appointment_date && (
                                                <span className="inline-flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    {ticket.appointment_date}
                                                </span>
                                            )}
                                            {ticket.appointment_time && (
                                                <span className="inline-flex items-center gap-1">
                                                    <Clock className="h-4 w-4" />
                                                    {ticket.appointment_time}
                                                </span>
                                            )}
                                            {ticket.consultation_fee ? (
                                                <span className="inline-flex items-center gap-1">
                                                    <Stethoscope className="h-4 w-4" />
                                                    ${Number(ticket.consultation_fee).toFixed(2)}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 flex-col items-end gap-2">
                                        {filter === 'upcoming' && ticket.status !== 'completed' && (
                                            <Link
                                                href={
                                                    ticket.doctor && 'id' in ticket.doctor
                                                        ? `/healthcare/doctors/${(ticket.doctor as { id?: string }).id}`
                                                        : '/healthcare/doctors'
                                                }
                                                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                                            >
                                                <RotateCw className="h-3.5 w-3.5" />
                                                Reschedule
                                            </Link>
                                        )}
                                        <p className="text-xs text-gray-400">Created {formatDateTime(ticket.created_at)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
