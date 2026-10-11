import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { ArrowLeft, Home, User, ArrowRight } from 'lucide-react';

interface Professional {
    id: string;
    full_name: string;
    specialization: string;
    profession?: string;
    consultation_fee: number | string;
    home_visit_fee?: number | string | null;
    avatar_url?: string | null;
    rating?: number | null;
}

export default function HomeVisit() {
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Professional | null>(null);
    const [professionFilter, setProfessionFilter] = useState('');
    const [form, setForm] = useState({ symptoms: '', description: '', home_address: '', appointment_date: '', appointment_time: '' });
    const [submitting, setSubmitting] = useState(false);

    const professions = ['doctor', 'nurse', 'chew', 'dentist', 'pharmacist', 'medical_laboratory_scientist', 'physiotherapist', 'optometrist', 'midwife', 'dietitian', 'psychologist', 'other'];

    useEffect(() => {
        const params = new URLSearchParams();
        if (professionFilter) params.set('profession', professionFilter);
        const query = params.toString() ? `?${params.toString()}` : '';
        api.get<{ data: Professional[] }>(`/api/health/doctors${query}`)
            .then((res) => setProfessionals(Array.isArray(res.data) ? res.data : []))
            .catch(() => setProfessionals([]))
            .finally(() => setLoading(false));
    }, [professionFilter]);

    const feeOf = (p: Professional): number => {
        const home = Number(p.home_visit_fee);
        if (Number.isFinite(home) && home > 0) return home;
        return Number(p.consultation_fee) || 0;
    };

    const handleBook = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selected) return;
        if (!form.home_address.trim()) {
            toast.error('Home address is required for a home visit');
            return;
        }
        if (!form.appointment_date || !form.appointment_time) {
            toast.error('Visit date and time are required');
            return;
        }
        setSubmitting(true);
        try {
            const res = await api.post<{ data: { id: string } }>('/api/appointments', {
                doctor_id: selected.id,
                consultation_type: 'home_visit',
                symptoms: form.symptoms.trim() || 'Home visit request',
                description: form.description.trim() || undefined,
                home_address: form.home_address.trim(),
                appointment_date: form.appointment_date,
                appointment_time: form.appointment_time,
            });
            router.visit(`/healthcare/booking-confirmation?id=${res.data.id}`);
        } catch (err) {
            toast.error(errorMessage(err, 'Failed to book the home visit'));
            setSubmitting(false);
        }
    };

    if (loading) return <AppLayout title="Home Visit"><p className="p-12 text-center text-gray-500">Loading...</p></AppLayout>;

    return (
        <AppLayout title="Home Visit">
            <Head title="Home Visit" />
            <div className="mx-auto max-w-4xl space-y-6">
                <Link href="/healthcare/bookings" className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline">
                    <ArrowLeft className="h-4 w-4" /> Back to Health Bookings
                </Link>
                <div className="flex items-center gap-3">
                    <Home className="h-8 w-8 text-rose-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Home Visit</h1>
                        <p className="text-gray-500">A healthcare professional comes to your home — priced per professional</p>
                    </div>
                </div>

                {!selected ? (
                    <>
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
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {professionals.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setSelected(p)}
                                    className="rounded-lg bg-white p-4 text-left shadow hover:ring-2 hover:ring-rose-500 dark:bg-gray-800"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
                                            <User className="h-6 w-6 text-rose-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">{p.full_name}</p>
                                            <p className="text-sm capitalize text-gray-500">{(p.profession ?? 'doctor').replace('_', ' ')} • {p.specialization}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between text-sm">
                                        <span className="text-yellow-500">★ {p.rating || 'New'}</span>
                                        <span className="font-semibold text-green-600">{formatPrice(feeOf(p))} <span className="font-normal text-gray-400">/ visit</span></span>
                                    </div>
                                </button>
                            ))}
                            {professionals.length === 0 && (
                                <div className="col-span-full rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                                    <Home className="mx-auto h-12 w-12 text-gray-400" />
                                    <p className="mt-4 text-gray-500">No professionals available for home visits</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <form onSubmit={handleBook} className="mx-auto max-w-2xl space-y-6">
                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="font-semibold text-gray-900 dark:text-white">Selected Professional</h2>
                                <button type="button" onClick={() => setSelected(null)} className="text-sm text-blue-600 hover:underline">Change</button>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
                                        <User className="h-6 w-6 text-rose-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">{selected.full_name}</p>
                                        <p className="text-sm capitalize text-gray-500">{(selected.profession ?? 'doctor').replace('_', ' ')} • {selected.specialization}</p>
                                    </div>
                                </div>
                                <p className="font-semibold text-green-600">{formatPrice(feeOf(selected))}</p>
                            </div>
                        </div>

                        <div className="space-y-4 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            <h2 className="font-semibold text-gray-900 dark:text-white">Visit Details</h2>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Reason for visit</label>
                                <input
                                    required
                                    value={form.symptoms}
                                    onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                                    className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                                    placeholder="Brief description of symptoms or need"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Home address *</label>
                                <textarea
                                    required
                                    value={form.home_address}
                                    onChange={(e) => setForm({ ...form, home_address: e.target.value })}
                                    rows={2}
                                    className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                                    placeholder="Street, area, city — where should the professional come?"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Visit date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={form.appointment_date}
                                        onChange={(e) => setForm({ ...form, appointment_date: e.target.value })}
                                        className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Visit time *</label>
                                    <input
                                        type="time"
                                        required
                                        value={form.appointment_time}
                                        onChange={(e) => setForm({ ...form, appointment_time: e.target.value })}
                                        className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Additional details</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={3}
                                    className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-3 text-white hover:bg-rose-500 disabled:opacity-50"
                            >
                                {submitting ? 'Booking...' : `Book Home Visit — ${formatPrice(feeOf(selected))}`} <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </AppLayout>
    );
}
