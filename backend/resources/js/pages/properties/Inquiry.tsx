import AppLayout from '@/layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { useState } from 'react';
import { Home, ArrowRight } from 'lucide-react';

export default function PropertyInquiry({ property_id }: { property_id?: string }) {
    const [form, setForm] = useState({ name: '', email: '', phone: '', message: '', viewing_date: '' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const id = property_id || (typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : undefined);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true); setError('');
        try {
            await api.post(`/api/properties/${id}/inquiries`, form);
            router.visit(`/properties/${id}`);
        } catch (err) { setError(errorMessage(err, 'Failed to send inquiry')); setSubmitting(false); }
    };

    return (
        <AppLayout title="Property Inquiry">
            <Head title="Property Inquiry" />
            <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Home className="h-6 w-6" /> Inquire About Property</h1>
                {error && <div className="rounded bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20">{error}</div>}
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Name</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></div>
                        <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Phone</label><input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></div>
                    </div>
                    <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Email</label><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></div>
                    <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Preferred Viewing Date</label><input type="date" value={form.viewing_date} onChange={(e) => setForm({ ...form, viewing_date: e.target.value })} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></div>
                    <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Message</label><textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} placeholder="Tell us about your interest..." className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></div>
                </div>
                <button type="submit" disabled={submitting} className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {submitting ? 'Sending...' : 'Send Inquiry'} <ArrowRight className="h-4 w-4" />
                </button>
            </form>
        </AppLayout>
    );
}
