import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import {Stethoscope, Calendar, Pill} from 'lucide-react';

interface Ticket {
    id: string;
    ticket_number: string;
    symptoms: string;
    status: string;
    appointment_date: string;
    doctor: { full_name: string; specialization: string };
    created_at: string;
}

interface Consultation {
    id: string;
    diagnosis?: string;
    notes?: string | null;
}

export default function HealthcareHistory() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'appointments' | 'prescriptions'>('appointments');

    useEffect(() => {
        Promise.all([
            api.get<{ data: Ticket[] }>('/api/health/tickets').catch(() => ({ data: [] as Ticket[] })),
            api.get<{ data: Consultation[] }>('/api/health/consultations').catch(() => ({ data: [] as Consultation[] })),
        ]).then(([t, c]) => { setTickets(t.data || []); setConsultations(c.data || []); }).finally(() => setLoading(false));
    }, []);

    return (
        <AppLayout title="Healthcare History">
            <Head title="Healthcare History" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Stethoscope className="h-6 w-6" /> Healthcare History</h1>
                <div className="flex gap-2">
                    <button onClick={() => setTab('appointments')} className={`px-4 py-2 rounded-lg text-sm ${tab === 'appointments' ? 'bg-blue-600 text-white' : 'bg-white border dark:bg-gray-800 dark:border-gray-600'}`}>Appointments ({tickets.length})</button>
                    <button onClick={() => setTab('prescriptions')} className={`px-4 py-2 rounded-lg text-sm ${tab === 'prescriptions' ? 'bg-blue-600 text-white' : 'bg-white border dark:bg-gray-800 dark:border-gray-600'}`}>Prescriptions ({consultations.length})</button>
                </div>
                {loading ? <p className="text-gray-500">Loading...</p> : tab === 'appointments' ? (
                    tickets.length === 0 ? (
                        <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><Calendar className="mx-auto h-12 w-12 text-gray-400" /><p className="mt-4 text-gray-500">No appointments yet</p></div>
                    ) : (
                        <div className="space-y-3">
                            {tickets.map((t) => (
                                <Link key={t.id} href={`/healthcare/appointments/${t.id}`} className="block rounded-lg bg-white p-4 shadow hover:ring-2 hover:ring-blue-500 dark:bg-gray-800">
                                    <div className="flex justify-between"><span className="font-semibold dark:text-white">{t.doctor?.full_name || 'Doctor'}</span><span className={`text-xs px-2 py-1 rounded-full ${t.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{t.status}</span></div>
                                    <p className="text-sm text-gray-500">{t.symptoms?.slice(0, 80)}</p>
                                    <p className="text-xs text-gray-400 mt-1">{t.appointment_date || new Date(t.created_at).toLocaleDateString()}</p>
                                </Link>
                            ))}
                        </div>
                    )
                ) : (
                    consultations.length === 0 ? (
                        <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><Pill className="mx-auto h-12 w-12 text-gray-400" /><p className="mt-4 text-gray-500">No prescriptions yet</p></div>
                    ) : (
                        <div className="space-y-3">
                            {consultations.map((c) => (
                                <div key={c.id} className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                    <p className="font-semibold dark:text-white">{c.diagnosis || 'Consultation'}</p>
                                    <p className="text-sm text-gray-500">{c.notes?.slice(0, 100)}</p>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </AppLayout>
    );
}
