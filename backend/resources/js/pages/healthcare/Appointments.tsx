import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Stethoscope, CalendarClock, ArrowRight, FileText, Video, MapPin } from 'lucide-react';

interface Appointment {
    id: string;
    ticket_number: string;
    symptoms: string;
    consultation_type: string;
    consultation_fee?: number | string;
    appointment_date?: string;
    appointment_time?: string;
    status: 'pending' | 'assigned' | 'in_consultation' | 'completed' | 'cancelled';
    created_at: string;
    doctor?: { id: string; full_name: string; specialization?: string; consultation_fee?: number | string } | null;
}

interface Props {
    appointments: { data: Appointment[]; current_page: number; last_page: number; total: number };
}

const statusStyles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    assigned: 'bg-blue-100 text-blue-800',
    in_consultation: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-700',
};

export default function HealthcareAppointments({ appointments }: Props) {
    return (
        <AppLayout title="My appointments">
            <Head title="My appointments" />
            <div className="mx-auto max-w-3xl px-4 py-8">
                <div className="mb-6 flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100"><Stethoscope className="h-6 w-6 text-rose-600" /></span>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Appointments</h1>
                        <p className="text-sm text-gray-500">{appointments.total} total</p>
                    </div>
                </div>

                {appointments.data.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 p-16 text-center dark:border-gray-600">
                        <CalendarClock className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                        <p className="font-medium text-gray-900 dark:text-white">No appointments yet</p>
                        <Link href="/healthcare/book" className="mt-3 inline-block rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700">
                            Book a consultation
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {appointments.data.map((a) => (
                            <Link
                                key={a.id}
                                href={`/healthcare/appointments/${a.id}`}
                                className="block rounded-xl border border-gray-200 bg-white p-4 transition hover:border-rose-300 dark:border-gray-700 dark:bg-gray-800"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{a.symptoms}</p>
                                        <p className="mt-0.5 text-xs text-gray-500">
                                            {a.ticket_number} · {a.doctor?.full_name ?? 'Awaiting assignment'}
                                            {a.doctor?.specialization ? ` (${a.doctor.specialization})` : ''}
                                        </p>
                                        <p className="mt-1 flex flex-wrap gap-3 text-[11px] text-gray-400">
                                            <span className="flex items-center gap-1">
                                                {a.consultation_type === 'virtual'
                                                    ? <><Video className="h-3 w-3" /> Virtual</>
                                                    : <><MapPin className="h-3 w-3" /> In-person</>}
                                            </span>
                                            {a.appointment_date && <span>📅 {formatDate(a.appointment_date)}{a.appointment_time ? ` ${a.appointment_time.slice(0, 5)}` : ''}</span>}
                                            {a.consultation_fee && <span>{formatCurrency(Number(a.consultation_fee))}</span>}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[a.status]}`}>{a.status.replace('_', ' ')}</span>
                                        <ArrowRight className="h-4 w-4 text-gray-400" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Quick links */}
                <div className="mt-8 flex flex-wrap gap-3">
                    <Link href="/healthcare/prescriptions" className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200">
                        <FileText className="h-4 w-4" /> My prescriptions
                    </Link>
                    <Link href="/healthcare/labs" className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200">
                        <Stethoscope className="h-4 w-4" /> Lab tests
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}
