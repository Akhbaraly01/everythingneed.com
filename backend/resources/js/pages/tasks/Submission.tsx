import AppLayout from '@/layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { api } from '@/lib/api';
import { useState } from 'react';
import { Upload, FileText, ArrowRight } from 'lucide-react';

export default function TaskSubmission({ task_id }: { task_id?: string }) {
    const [form, setForm] = useState({ evidence_note: '', evidence_url: '' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const id = task_id || (typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : undefined);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true); setError('');
        try {
            await api.post(`/api/task-posts/${id}/submit`, form);
            router.visit(`/tasks/${id}`);
        } catch (err: any) { setError(err.response?.data?.message || 'Submission failed'); setSubmitting(false); }
    };

    return (
        <AppLayout title="Submit Task Proof">
            <Head title="Submit Proof" />
            <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Upload className="h-6 w-6" /> Submit Proof</h1>
                {error && <div className="rounded bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20">{error}</div>}
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-4">
                    <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Evidence URL</label><input value={form.evidence_url} onChange={(e) => setForm({ ...form, evidence_url: e.target.value })} placeholder="Link to proof (image, document, video...)" className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></div>
                    <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Notes</label><textarea required value={form.evidence_note} onChange={(e) => setForm({ ...form, evidence_note: e.target.value })} rows={4} placeholder="Describe your work..." className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></div>
                </div>
                <button type="submit" disabled={submitting} className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {submitting ? 'Submitting...' : 'Submit Proof'} <ArrowRight className="h-4 w-4" />
                </button>
            </form>
        </AppLayout>
    );
}
