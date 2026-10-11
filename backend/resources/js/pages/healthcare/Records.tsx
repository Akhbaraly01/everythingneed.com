import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { formatDate } from '@/lib/utils';
import { FileText, Stethoscope, Pill, ClipboardList } from 'lucide-react';

interface DoctorRef {
    full_name: string;
    specialization?: string;
}

interface Ticket {
    id: string;
    ticket_number: string;
    symptoms?: string;
    appointment_date?: string;
    status: string;
    doctor?: DoctorRef | null;
}

interface Consultation {
    id: string;
    diagnosis?: string | null;
    notes?: string | null;
    prescription_items?: unknown;
    follow_up_date?: string | null;
    ticket?: { ticket_number?: string; appointment_date?: string } | null;
}

interface Prescription {
    id: string;
    code: string;
    status: string;
    is_expired?: boolean;
    items: { name: string }[];
    created_at?: string;
    doctor?: DoctorRef | null;
}

interface Props {
    tickets: Ticket[];
    consultations: Consultation[];
    prescriptions: Prescription[];
}

function statusTone(status: string): string {
    switch (status) {
        case 'completed':
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
        case 'cancelled':
            return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
        default:
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
    }
}

export default function HealthcareRecords({ tickets, consultations, prescriptions }: Props) {
    return (
        <AppLayout title="My health records">
            <Head title="My health records" />
            <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
                <div className="flex flex-wrap gap-2 text-sm">
                    <Link href="/healthcare/bookings" className="font-medium text-indigo-600 hover:underline">← Health Bookings</Link>
                    <Link href="/healthcare/appointments" className="font-medium text-indigo-600 hover:underline">My Appointments</Link>
                </div>
                <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-100">
                        <ClipboardList className="h-6 w-6 text-teal-600" />
                    </span>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My health records</h1>
                        <p className="text-sm text-gray-500">
                            {tickets.length} appointments · {consultations.length} consultations · {prescriptions.length} prescriptions
                        </p>
                    </div>
                </div>

                <section className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-100 px-5 py-3 dark:border-gray-700">
                        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                            <Stethoscope className="h-4 w-4 text-teal-500" /> Appointments
                        </h2>
                    </div>
                    {tickets.length === 0 ? (
                        <p className="px-5 py-6 text-sm text-gray-500">No appointments yet.</p>
                    ) : (
                        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                            {tickets.map((t) => (
                                <li key={t.id} className="flex items-center justify-between px-5 py-3">
                                    <div>
                                        <Link href={`/healthcare/appointments/${t.id}`} className="text-sm font-medium text-teal-700 hover:underline dark:text-teal-400">
                                            {t.ticket_number}
                                        </Link>
                                        <p className="text-xs text-gray-500">
                                            {t.appointment_date ? formatDate(t.appointment_date) : 'No date'}
                                            {t.doctor ? ` · ${t.doctor.full_name}` : ''}
                                        </p>
                                    </div>
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(t.status)}`}>{t.status}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-100 px-5 py-3 dark:border-gray-700">
                        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                            <FileText className="h-4 w-4 text-teal-500" /> Consultations
                        </h2>
                    </div>
                    {consultations.length === 0 ? (
                        <p className="px-5 py-6 text-sm text-gray-500">No consultations yet.</p>
                    ) : (
                        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                            {consultations.map((c) => (
                                <li key={c.id} className="px-5 py-3">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {c.diagnosis || 'Consultation'}
                                    </p>
                                    {c.notes && <p className="mt-1 text-xs text-gray-500">{c.notes}</p>}
                                    {c.follow_up_date && (
                                        <p className="mt-1 text-xs text-gray-500">Follow-up: {formatDate(c.follow_up_date)}</p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-gray-700">
                        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                            <Pill className="h-4 w-4 text-teal-500" /> Prescriptions
                        </h2>
                        <Link href="/healthcare/prescriptions" className="text-xs font-medium text-teal-700 hover:underline dark:text-teal-400">
                            View all
                        </Link>
                    </div>
                    {prescriptions.length === 0 ? (
                        <p className="px-5 py-6 text-sm text-gray-500">No prescriptions yet.</p>
                    ) : (
                        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                            {prescriptions.map((p) => (
                                <li key={p.id} className="flex items-center justify-between px-5 py-3">
                                    <div>
                                        <p className="font-mono text-xs text-gray-400">{p.code}</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {p.items.map((it) => it.name).join(', ')}
                                        </p>
                                    </div>
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${p.status === 'filled' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : p.status === 'expired' ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'}`}>
                                        {p.status}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
