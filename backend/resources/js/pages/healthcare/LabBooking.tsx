import AppLayout from '@/layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import { TestTube, Calendar, Clock, FileText, ArrowRight } from 'lucide-react';

interface LabTest {
    id: string;
    name: string;
    description: string;
    price: number;
    preparation_instructions: string;
    result_time: string;
}

export default function LabBooking({ test_id }: { test_id?: string }) {
    const [test, setTest] = useState<LabTest | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        preferred_date: '',
        preferred_time: '',
        notes: '',
    });

    useEffect(() => {
        if (test_id) {
            api.get<{ data: LabTest }>(`/api/health/labs/${test_id}`)
                .then((res) => setTest(res.data))
                .catch(() => {})
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [test_id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await api.post<{ data: { id: string } }>('/api/health/labs/book', {
                test_id,
                ...form,
            });
            router.visit(`/healthcare/lab-confirmation?id=${res.data.id}`);
        } catch {
            setSubmitting(false);
        }
    };

    if (loading) return <AppLayout title="Book Lab Test"><p className="p-12 text-center text-gray-500">Loading...</p></AppLayout>;
    if (!test) return <AppLayout title="Book Lab Test"><p className="p-12 text-center text-red-500">Test not found</p></AppLayout>;

    return (
        <AppLayout title={`Book ${test.name}`}>
            <Head title={`Book ${test.name}`} />
            <div className="mx-auto max-w-2xl space-y-6">
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="flex items-center gap-3 mb-4">
                        <TestTube className="h-6 w-6 text-blue-600" />
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{test.name}</h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{test.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="rounded bg-gray-50 p-3 dark:bg-gray-700">
                            <span className="text-gray-500">Price</span>
                            <p className="font-semibold text-gray-900 dark:text-white">${test.price}</p>
                        </div>
                        <div className="rounded bg-gray-50 p-3 dark:bg-gray-700">
                            <span className="text-gray-500">Results In</span>
                            <p className="font-semibold text-gray-900 dark:text-white">{test.result_time}</p>
                        </div>
                    </div>
                    {test.preparation_instructions && (
                        <div className="mt-4 rounded bg-yellow-50 p-4 dark:bg-yellow-900/20">
                            <h3 className="font-medium text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Preparation Instructions
                            </h3>
                            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">{test.preparation_instructions}</p>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-4">
                    <h2 className="font-semibold text-gray-900 dark:text-white">Schedule Appointment</h2>
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                        <textarea
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            rows={3}
                            className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                            placeholder="Any special requirements..."
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {submitting ? 'Booking...' : 'Book Lab Test'} <ArrowRight className="h-4 w-4" />
                    </button>
                </form>
            </div>
        </AppLayout>
    );
}
