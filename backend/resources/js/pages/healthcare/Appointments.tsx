import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { Video, FileText, Calendar, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Appointment {
    id: string;
    reference: string;
    appointment_date: string;
    appointment_time: string;
    status: string;
    type: string;
    reason?: string;
    doctor?: { name: string; specialty: string };
    consultation?: { id: string; diagnosis?: string; notes?: string; prescription?: string };
    video_room_id?: string;
    created_at: string;
}

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
};

export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

    useEffect(() => {
        api.get<{ data: Appointment[] }>('/api/appointments')
            .then((res) => setAppointments(res.data))
            .catch(() => setAppointments([]))
            .finally(() => setLoading(false));
    }, []);

    const now = new Date();
    const filtered = appointments.filter((a) => {
        const d = new Date(a.appointment_date + 'T' + a.appointment_time);
        return tab === 'upcoming' ? d >= now && a.status !== 'cancelled' : d < now || a.status === 'cancelled' || a.status === 'completed';
    });

    return (
        <AppLayout title="My Appointments">
            <Head title="My Appointments" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Appointments</h1>
                    <Link href="/healthcare/doctors" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                        Book New
                    </Link>
                </div>

                <div className="flex gap-2">
                    <button onClick={() => setTab('upcoming')} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'upcoming' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                        Upcoming
                    </button>
                    <button onClick={() => setTab('past')} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'past' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                        Past
                    </button>
                </div>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading...</p></div>
                ) : filtered.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No {tab} appointments</h3>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map((a) => (
                            <div key={a.id} className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm text-gray-500">{a.reference}</span>
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[a.status] ?? 'bg-gray-100 text-gray-800'}`}>
                                                {a.status}
                                            </span>
                                        </div>
                                        <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                                            {a.doctor?.name ?? 'Doctor'} — {a.doctor?.specialty ?? a.type}
                                        </p>
                                        <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {a.appointment_date}</span>
                                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {a.appointment_time}</span>
                                        </div>
                                        {a.reason && <p className="mt-1 text-sm text-gray-500">{a.reason}</p>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {a.video_room_id && a.status === 'confirmed' && (
                                            <a href={`/video/${a.video_room_id}`} target="_blank"
                                                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500">
                                                <Video className="h-4 w-4" /> Join Video
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {a.consultation && (
                                    <div className="mt-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                                        <p className="flex items-center gap-1 text-sm font-semibold text-gray-900 dark:text-white">
                                            <FileText className="h-4 w-4" /> Consultation Notes
                                        </p>
                                        {a.consultation.diagnosis && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Diagnosis: {a.consultation.diagnosis}</p>}
                                        {a.consultation.notes && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{a.consultation.notes}</p>}
                                        {a.consultation.prescription && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Rx: {a.consultation.prescription}</p>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
