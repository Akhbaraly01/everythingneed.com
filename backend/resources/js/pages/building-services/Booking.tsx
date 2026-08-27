import AppLayout from '@/layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { api } from '@/lib/api';
import { useState } from 'react';
import { HardHat, Calendar, MapPin, DollarSign, ArrowRight } from 'lucide-react';

export default function BuildingServiceBooking({ worker_id }: { worker_id?: string }) {
    const [form, setForm] = useState({
        worker_type: 'plumber',
        service_category: '',
        description: '',
        address: '',
        scheduled_date: '',
        scheduled_time: '',
        estimated_cost: '',
        notes: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            const res = await api.post<{ data: { id: string } }>('/api/building-services/bookings', { ...form, worker_id });
            router.visit(`/building-services/bookings/${res.data.id}`);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Booking failed');
            setSubmitting(false);
        }
    };

    return (
        <AppLayout title="Book Building Service">
            <Head title="Book Building Service" />
            <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><HardHat className="h-6 w-6" /> Book Building Service</h1>
                {error && <div className="rounded bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20">{error}</div>}
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Worker Type</label>
                            <select value={form.worker_type} onChange={(e) => setForm({ ...form, worker_type: e.target.value })} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
                                <option value="plumber">Plumber</option>
                                <option value="electrician">Electrician</option>
                                <option value="carpenter">Carpenter</option>
                                <option value="mason">Mason</option>
                                <option value="painter">Painter</option>
                                <option value="welder">Welder</option>
                                <option value="general">General Contractor</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Service Category</label>
                            <input required value={form.service_category} onChange={(e) => setForm({ ...form, service_category: e.target.value })} placeholder="e.g. Pipe repair" className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Description</label>
                        <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" placeholder="Describe the work needed..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Address</label>
                        <input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" placeholder="Service address" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Date</label>
                            <input type="date" required value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Time</label>
                            <input type="time" value={form.scheduled_time} onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Estimated Budget</label>
                        <input type="number" min="0" step="0.01" value={form.estimated_cost} onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })} placeholder="Optional" className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Notes</label>
                        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" />
                    </div>
                </div>
                <button type="submit" disabled={submitting} className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {submitting ? 'Booking...' : 'Confirm Booking'} <ArrowRight className="h-4 w-4" />
                </button>
            </form>
        </AppLayout>
    );
}
