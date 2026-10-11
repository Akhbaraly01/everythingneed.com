import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { NEED_STATUS_LABELS, needStatusClasses } from '@/lib/needs';
import { ArrowLeft, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { NeedRequestDetail } from '@/types';

interface ReviewRow {
    id: string;
    rating: number;
    comment?: string | null;
    created_at: string;
}

/**
 * Spec S14 /needs/my-needs/{id}/review: the requester reviews a completed
 * need (server enforces owner + completed + once). Before completion the
 * page states exactly why reviewing is locked - no false affordances (S98).
 */
export default function MyNeedReview({ need_id }: { need_id: string }) {
    const [need, setNeed] = useState<NeedRequestDetail | null>(null);
    const [existing, setExisting] = useState<ReviewRow | null>(null);
    const [rating, setRating] = useState(5);
    const [hovered, setHovered] = useState(0);
    const [comment, setComment] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get<{ data: NeedRequestDetail }>(`/api/need-requests/${need_id}`);
                setNeed(res.data);
                const reviews = await api.get<{ data: ReviewRow[] }>('/api/reviews', {
                    params: { reviewable_type: 'need_request', reviewable_id: need_id },
                });
                setExisting(reviews.data?.[0] ?? null);
            } catch (e) {
                setError(errorMessage(e, 'Could not load this review'));
            } finally {
                setLoading(false);
            }
        })();
    }, [need_id]);

    const submit = async () => {
        setBusy(true);
        setError(null);
        setSuccess(null);
        try {
            const res = await api.post<{ message?: string }>('/api/reviews', {
                reviewable_type: 'need_request',
                reviewable_id: need_id,
                rating,
                comment: comment.trim() || undefined,
            });
            setSuccess(res.message ?? 'Review submitted successfully');
            const reviews = await api.get<{ data: ReviewRow[] }>('/api/reviews', {
                params: { reviewable_type: 'need_request', reviewable_id: need_id },
            });
            setExisting(reviews.data?.[0] ?? null);
        } catch (e) {
            setError(errorMessage(e, 'Could not submit your review'));
        }
        setBusy(false);
    };

    const display = hovered || rating;

    return (
        <AppLayout title="Review">
            <Head title="Review" />
            <div className="mx-auto max-w-2xl space-y-6 px-3 py-4">
                <Link href={`/needs/my-needs/${need_id}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4" /> Back to need
                </Link>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                        <Star className="h-5 w-5 text-amber-500" /> Review this need
                    </h1>
                    {need && (
                        <p className="mt-1 text-sm text-gray-500">
                            {need.title} ·{' '}
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${needStatusClasses(need.status)}`}>
                                {NEED_STATUS_LABELS[need.status]}
                            </span>
                        </p>
                    )}

                    {error && (
                        <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{error}</p>
                    )}
                    {success && (
                        <p role="status" className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            {success}
                        </p>
                    )}

                    {loading && <p className="mt-4 text-sm text-gray-500">Loading...</p>}

                    {!loading && existing && (
                        <div className="mt-5 rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
                            <p className="flex items-center gap-1 text-sm font-semibold text-amber-800 dark:text-amber-200" aria-label={`Your rating: ${existing.rating} of 5`}>
                                {Array.from({ length: 5 }, (_, i) => (
                                    <Star key={i} className={`h-4 w-4 ${i < existing.rating ? 'fill-amber-400 text-amber-400' : 'text-amber-300'}`} />
                                ))}
                                <span className="ml-2">{existing.rating}/5</span>
                            </p>
                            {existing.comment && <p className="mt-2 whitespace-pre-line text-sm text-gray-700 dark:text-gray-200">{existing.comment}</p>}
                            <p className="mt-2 text-xs text-gray-500">Submitted {new Date(existing.created_at).toLocaleDateString()}</p>
                        </div>
                    )}

                    {!loading && !existing && need && need.status !== 'completed' && (
                        <div className="mt-5 rounded-md bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-900/40 dark:text-gray-300">
                            <p className="font-medium">Reviewing unlocks once this need reaches Completed.</p>
                            <p className="mt-1">Current state: {NEED_STATUS_LABELS[need.status]}.</p>
                        </div>
                    )}

                    {!loading && !existing && need && need.status === 'completed' && (
                        <div className="mt-5 space-y-4">
                            <div>
                                <span id="rating-label" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Your rating</span>
                                <div className="mt-1 flex gap-1" role="radiogroup" aria-labelledby="rating-label">
                                    {[1, 2, 3, 4, 5].map((v) => (
                                        <button
                                            key={v}
                                            type="button"
                                            role="radio"
                                            aria-checked={rating === v}
                                            aria-label={`${v} star${v > 1 ? 's' : ''}`}
                                            onClick={() => setRating(v)}
                                            onMouseEnter={() => setHovered(v)}
                                            onMouseLeave={() => setHovered(0)}
                                            className="p-1"
                                        >
                                            <Star className={`h-7 w-7 ${v <= display ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600'}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Comment (optional)</label>
                                <textarea
                                    id="review-comment"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    rows={4}
                                    maxLength={2000}
                                    placeholder="How did the provider do?"
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={submit}
                                disabled={busy}
                                data-testid="review-submit"
                                className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                            >
                                {busy ? 'Submitting...' : 'Submit review'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
