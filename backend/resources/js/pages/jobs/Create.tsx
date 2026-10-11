import AppLayout from '@/layouts/AppLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { useState } from 'react';

const JOB_TYPES = ['full_time', 'part_time', 'contract', 'internship', 'temporary'];

export default function JobCreate() {
    const { auth } = usePage().props as { auth?: { user?: { id: string } } };
    const [form, setForm] = useState({
        title: '', description: '', company: '', location: '',
        job_type: 'full_time', salary_min: '', salary_max: '', currency: 'USD', expires_at: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const set = (key: string, value: string) => setForm({ ...form, [key]: value });

    const submit = async () => {
        if (!auth?.user) {
            router.visit('/login');
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            await api.post('/api/jobs', {
                ...form,
                salary_min: form.salary_min === '' ? undefined : parseFloat(form.salary_min),
                salary_max: form.salary_max === '' ? undefined : parseFloat(form.salary_max),
                expires_at: form.expires_at === '' ? undefined : form.expires_at,
            });
            router.visit('/jobs/my-jobs');
        } catch (e) {
            setError(errorMessage(e, 'Failed to post job'));
        } finally {
            setSubmitting(false);
        }
    };

    const inputClass = "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white";

    return (
        <AppLayout title="Post a Job">
            <Head title="Post a Job" />
            <div className="mx-auto max-w-2xl space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Post a Job</h1>
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="space-y-4">
                        <div><label className="block text-sm font-medium">Title *</label>
                            <input value={form.title} onChange={(e) => set('title', e.target.value)} className={inputClass} /></div>
                        <div><label className="block text-sm font-medium">Description *</label>
                            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={5} className={inputClass} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium">Company *</label>
                                <input value={form.company} onChange={(e) => set('company', e.target.value)} className={inputClass} /></div>
                            <div><label className="block text-sm font-medium">Location *</label>
                                <input value={form.location} onChange={(e) => set('location', e.target.value)} className={inputClass} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium">Job type</label>
                                <select value={form.job_type} onChange={(e) => set('job_type', e.target.value)} className={inputClass}>
                                    {JOB_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                                </select></div>
                            <div><label className="block text-sm font-medium">Currency</label>
                                <input value={form.currency} onChange={(e) => set('currency', e.target.value.toUpperCase())} maxLength={3} className={inputClass} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium">Min salary</label>
                                <input type="number" min="0" value={form.salary_min} onChange={(e) => set('salary_min', e.target.value)} className={inputClass} /></div>
                            <div><label className="block text-sm font-medium">Max salary</label>
                                <input type="number" min="0" value={form.salary_max} onChange={(e) => set('salary_max', e.target.value)} className={inputClass} /></div>
                        </div>
                        <div><label className="block text-sm font-medium">Expires at</label>
                            <input type="date" value={form.expires_at} onChange={(e) => set('expires_at', e.target.value)} className={inputClass} /></div>
                    </div>
                    {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
                    <button onClick={submit} disabled={submitting || !form.title || !form.description || !form.company || !form.location}
                        className="mt-6 w-full rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
                        {submitting ? 'Posting...' : 'Post job'}
                    </button>
                </div>
            </div>
        </AppLayout>
    );
}
