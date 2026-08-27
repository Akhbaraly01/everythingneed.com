import AppLayout from '@/layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { api } from '@/lib/api';
import { useState } from 'react';
import { MapPin, ArrowRight } from 'lucide-react';

export default function CustomTransportRequest() {
    const [form, setForm] = useState({ pickup_address: '', dropoff_address: '', vehicle_type: 'car', description: '', scheduled_date: '' });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await api.post<{ data: { id: string } }>('/api/transport/requests', form);
            router.visit(`/transportation/tracking/${res.data.id}`);
        } catch { setSubmitting(false); }
    };

    return (
        <AppLayout title="Custom Transport Request">
            <Head title="Custom Transport Request" />
            <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Custom Transport Request</h1>
                <p className="text-gray-500">Request unavailable routes — our team will find a provider and send you a quote</p>
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-4">
                    <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Pickup Address</label><input required value={form.pickup_address} onChange={(e) => setForm({ ...form, pickup_address: e.target.value })} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></div>
                    <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Drop-off Address</label><input required value={form.dropoff_address} onChange={(e) => setForm({ ...form, dropoff_address: e.target.value })} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></div>
                    <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Vehicle Type</label><select value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700"><option value="car">Car</option><option value="truck">Truck</option><option value="motorcycle">Motorcycle</option><option value="lorry">Lorry</option><option value="other">Other</option></select></div>
                    <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Description</label><textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" placeholder="What do you need to transport?" /></div>
                    <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Preferred Date</label><input type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></div>
                </div>
                <button type="submit" disabled={submitting} className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {submitting ? 'Submitting...' : 'Submit Request'} <ArrowRight className="h-4 w-4" />
                </button>
            </form>
        </AppLayout>
    );
}
