import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

export default function NeedsRequest() {
    const { auth } = usePage().props as { auth?: { user?: { id: string } } };
    const [form, setForm] = useState({ title: '', description: '', category: '', budget: '', urgency: 'normal', location: '' });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!auth?.user) { router.visit('/login'); return; }
        setSubmitting(true);
        try {
            await api.post('/api/need-requests', {
                ...form,
                budget: parseFloat(form.budget) || undefined,
            });
            router.visit('/requests');
        } catch (e: any) {
            alert(e.message ?? 'Failed');
        }
        setSubmitting(false);
    };

    const inputClass = "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white";

    return (
        <AppLayout title="Submit a Need">
            <Head title="Submit a Need" />
            <div className="max-w-2xl mx-auto space-y-6">
                <Link href="/needs" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4" /> Back to Needs
                </Link>
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Submit a Service Request</h1>
                    <div className="mt-6 space-y-4">
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title *</label>
                            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What do you need?" className={inputClass} /></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className={inputClass} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                                <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass} /></div>
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Budget ($)</label>
                                <input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} className={inputClass} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Urgency</label>
                                <select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })} className={inputClass}>
                                    <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option>
                                </select></div>
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                                <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputClass} /></div>
                        </div>
                    </div>
                    <button onClick={handleSubmit} disabled={submitting || !form.title}
                        className="mt-6 w-full rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
                        {submitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                </div>
            </div>
        </AppLayout>
    );
}
