import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Star, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api';

interface Review {
    id: string;
    rating: number;
    comment?: string | null;
    created_at: string;
    user?: { name?: string } | null;
}

interface Props {
    reviewableType: 'restaurant' | 'property';
    reviewableId: string;
    title?: string;
}

/**
 * Reviews scoped to one reviewable (a restaurant, a property listing).
 * Lists existing reviews and lets a signed-in visitor leave one.
 */
export default function ContextualReviews({ reviewableType, reviewableId, title = 'Reviews' }: Props) {
    const { auth } = usePage().props as { auth?: { id?: string; user?: { id: string } } | null };
    const isLoggedIn = Boolean(auth?.id ?? auth?.user);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [busy, setBusy] = useState(false);

    const load = () => {
        api.get<{ data: Review[] }>(`/api/reviews?reviewable_type=${reviewableType}&reviewable_id=${reviewableId}`)
            .then((res) => setReviews(Array.isArray(res.data) ? res.data : []))
            .catch(() => setReviews([]))
            .finally(() => setLoading(false));
    };

    useEffect(load, [reviewableType, reviewableId]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        try {
            await api.post('/api/reviews', {
                reviewable_type: reviewableType,
                reviewable_id: reviewableId,
                rating,
                comment: comment || undefined,
            });
            toast.success('Thanks for your review!');
            setComment('');
            setRating(5);
            load();
        } catch (err) {
            toast.error(errorMessage(err, 'Could not submit review'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <MessageSquare className="h-5 w-5 text-indigo-500" /> {title}
            </h2>

            {loading ? (
                <p className="text-sm text-gray-500">Loading reviews...</p>
            ) : reviews.length === 0 ? (
                <p className="text-sm text-gray-500">No reviews yet — be the first to share your experience.</p>
            ) : (
                <ul className="mb-6 space-y-4">
                    {reviews.map((r) => (
                        <li key={r.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                                <div className="flex" aria-label={`${r.rating} out of 5 stars`}>
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <Star key={i} className={`h-4 w-4 ${i <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                    ))}
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{r.user?.name ?? 'Anonymous'}</span>
                                <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
                            </div>
                            {r.comment && <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{r.comment}</p>}
                        </li>
                    ))}
                </ul>
            )}

            {isLoggedIn ? (
                <form onSubmit={submit} className="space-y-3 border-t border-gray-100 pt-4 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <label htmlFor={`rating-${reviewableId}`} className="text-sm font-medium text-gray-700 dark:text-gray-300">Your rating</label>
                        <select
                            id={`rating-${reviewableId}`}
                            value={rating}
                            onChange={(e) => setRating(Number(e.target.value))}
                            className="rounded-lg border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700"
                        >
                            {[5, 4, 3, 2, 1].map((n) => (
                                <option key={n} value={n}>{n} star{n === 1 ? '' : 's'}</option>
                            ))}
                        </select>
                    </div>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={3}
                        maxLength={2000}
                        placeholder="Share your experience (optional)"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <button
                        type="submit"
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                        <Send className="h-4 w-4" /> {busy ? 'Submitting…' : 'Submit review'}
                    </button>
                </form>
            ) : (
                <p className="border-t border-gray-100 pt-4 text-sm text-gray-500 dark:border-gray-700">
                    <a href="/login" className="font-medium text-indigo-600 hover:underline">Sign in</a> to leave a review.
                </p>
            )}
        </div>
    );
}
