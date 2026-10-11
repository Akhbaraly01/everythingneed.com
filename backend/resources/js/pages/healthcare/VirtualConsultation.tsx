import AppLayout from '@/layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import {Video, User, ArrowRight} from 'lucide-react';

interface Doctor {
    id: string;
    full_name: string;
    specialization: string;
    profession?: string;
    virtual_fee: number;
    avatar_url: string;
    rating: number;
}

export default function VirtualConsultation() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [professionFilter, setProfessionFilter] = useState('');
    const [form, setForm] = useState({ symptoms: '', description: '', preferred_date: '', preferred_time: '' });
    const [submitting, setSubmitting] = useState(false);

    const professions = ['doctor', 'nurse', 'chew', 'dentist', 'pharmacist', 'medical_laboratory_scientist', 'physiotherapist', 'optometrist', 'midwife', 'dietitian', 'psychologist', 'other'];

    useEffect(() => {
        const params = new URLSearchParams();
        params.set('virtual', 'true');
        if (professionFilter) params.set('profession', professionFilter);
        api.get<{ data: Doctor[] }>(`/api/health/doctors?${params.toString()}`)
            .then((res) => setDoctors(res.data))
            .catch(() => setDoctors([]))
            .finally(() => setLoading(false));
    }, [professionFilter]);

    const handleBook = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDoctor) return;
        setSubmitting(true);
        try {
            const res = await api.post<{ data: { id: string } }>('/api/health/tickets', {
                doctor_id: selectedDoctor.id,
                consultation_type: 'virtual',
                ...form,
            });
            router.visit(`/healthcare/booking-confirmation?id=${res.data.id}`);
        } catch (err) {
            toast.error(errorMessage(err, 'Failed to book the consultation'));
            setSubmitting(false);
        }
    };

    if (loading) return <AppLayout title="Virtual Consultation"><p className="p-12 text-center text-gray-500">Loading...</p></AppLayout>;

    return (
        <AppLayout title="Virtual Consultation">
            <Head title="Virtual Consultation" />
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Video className="h-8 w-8 text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Virtual Consultation</h1>
                        <p className="text-gray-500">Connect with a healthcare professional from anywhere</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button onClick={() => setProfessionFilter('')} className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                        !professionFilter ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                    }`}>All Professions</button>
                    {professions.map((p) => (
                        <button key={p} onClick={() => setProfessionFilter(p)} className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                            professionFilter === p ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                        }`}>{p.charAt(0).toUpperCase() + p.slice(1).replace('_', ' ')}</button>
                    ))}
                </div>

                {!selectedDoctor ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {doctors.map((d) => (
                            <button
                                key={d.id}
                                onClick={() => setSelectedDoctor(d)}
                                className="rounded-lg bg-white p-4 shadow text-left hover:ring-2 hover:ring-blue-500 dark:bg-gray-800"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                        <User className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">{d.full_name}</p>
                                        <p className="text-sm text-gray-500">{d.specialization}</p>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between text-sm">
                                    <span className="text-yellow-500">★ {d.rating || 'New'}</span>
                                    <span className="font-semibold text-green-600">${d.virtual_fee}</span>
                                </div>
                            </button>
                        ))}
                        {doctors.length === 0 && (
                            <div className="col-span-full rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                                <Video className="mx-auto h-12 w-12 text-gray-400" />
                                <p className="mt-4 text-gray-500">No virtual consultation doctors available</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <form onSubmit={handleBook} className="mx-auto max-w-2xl space-y-6">
                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold text-gray-900 dark:text-white">Selected Doctor</h2>
                                <button type="button" onClick={() => setSelectedDoctor(null)} className="text-sm text-blue-600 hover:underline">Change</button>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                    <User className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">{selectedDoctor.full_name}</p>
                                    <p className="text-sm text-gray-500">{selectedDoctor.specialization} • ${selectedDoctor.virtual_fee}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-4">
                            <h2 className="font-semibold text-gray-900 dark:text-white">Consultation Details</h2>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Symptoms</label>
                                <input
                                    required
                                    value={form.symptoms}
                                    onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                                    className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                                    placeholder="Brief description of symptoms"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Additional Details</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={3}
                                    className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preferred Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={form.preferred_date}
                                        onChange={(e) => setForm({ ...form, preferred_date: e.target.value })}
                                        className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preferred Time</label>
                                    <input
                                        type="time"
                                        required
                                        value={form.preferred_time}
                                        onChange={(e) => setForm({ ...form, preferred_time: e.target.value })}
                                        className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submitting ? 'Booking...' : 'Book Virtual Consultation'} <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </AppLayout>
    );
}
