import AppLayout from '@/layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { useState } from 'react';
import { Star, ArrowRight } from 'lucide-react';

export default function ReviewCreate() {
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const [form, setForm] = useState({ rating: 5, title: '', comment: '', reviewable_type: params.get('type') || 'product', reviewable_id: params.get('id') || '' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const TYPES = ['product', 'vendor', 'doctor', 'hotel', 'worker', 'restaurant', 'course', 'property', 'need_request', 'task_post'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.reviewable_id) { setError('Missing target ID'); return; }
        setSubmitting(true); setError('');
        try {
            await api.post('/api/reviews', form);
            router.visit(`/reviews`);
        } catch (err) { setError(errorMessage(err, 'Failed to submit review')); setSubmitting(false); }
    };

    return (
        <AppLayout title="Write a Review">
            <Head title="Write a Review" />
            <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Write a Review</h1>
                {error && <div className="rounded bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20">{error}</div>}
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Reviewing</label>
                            <select
                                value={form.reviewable_type}
                                onChange={(e) => setForm({ ...form, reviewable_type: e.target.value })}
                                className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                            >
                                {TYPES.map((t) => (
                                    <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Target ID</label>
                            <input
                                value={form.reviewable_id}
                                onChange={(e) => setForm({ ...form, reviewable_id: e.target.value })}
                                placeholder="Paste the item ID (pre-filled from product pages)"
                                className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-300">Rating</label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <button key={n} type="button" onClick={() => setForm({ ...form, rating: n })} className={`p-1 ${n <= form.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                                    <Star className={`h-8 w-8 ${n <= form.rating ? 'fill-yellow-400' : ''}`} />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Summary of your experience" className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></div>
                    <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Comment</label><textarea required value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} rows={4} placeholder="Share your experience..." className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></div>
                </div>
                <button type="submit" disabled={submitting} className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {submitting ? 'Submitting...' : 'Submit Review'} <ArrowRight className="h-4 w-4" />
                </button>
            </form>
        </AppLayout>
    );
}
