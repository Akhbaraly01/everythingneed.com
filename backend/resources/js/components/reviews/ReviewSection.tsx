import { Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/lib/api';

interface Review {
    id: string;
    rating: number;
    comment?: string | null;
    created_at: string;
}

interface ReviewSectionProps {
    reviewableType: string;
    reviewableId: string;
    authenticated: boolean;
}

/** Generic review list + form for any reviewable entity (spec reviews loops). */
export default function ReviewSection({ reviewableType, reviewableId, authenticated }: ReviewSectionProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [error, setError] = useState<string | null>(null);

    const load = () => {
        api.get<{ data: Review[] }>(`/api/reviews?reviewable_type=${reviewableType}&reviewable_id=${reviewableId}`)
            .then((res) => setReviews(Array.isArray(res.data) ? res.data : []))
            .catch(() => setReviews([]));
    };

    useEffect(load, [reviewableType, reviewableId]);

    const submit = async () => {
        setError(null);
        try {
            await api.post('/api/reviews', {
                reviewable_type: reviewableType,
                reviewable_id: reviewableId,
                rating,
                comment: comment.trim() || undefined,
            });
            setComment('');
            setRating(5);
            load();
        } catch (e) {
            setError(errorMessage(e, 'Review failed'));
        }
    };

    return (
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Reviews</h2>
            {reviews.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500">No reviews yet — be the first.</p>
            ) : (
                <div className="mt-3 space-y-3">
                    {reviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-100 pb-3 last:border-0 dark:border-gray-700">
                            <p className="text-sm font-semibold text-amber-500">
                                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                            </p>
                            {review.comment && <p className="mt-1 text-sm">{review.comment}</p>}
                        </div>
                    ))}
                </div>
            )}
            {authenticated ? (
                <div className="mt-4">
                    <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button key={star} onClick={() => setRating(star)} className={`text-2xl ${star <= rating ? 'text-amber-500' : 'text-gray-300'}`}>
                                ★
                            </button>
                        ))}
                    </div>
                    <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2}
                        placeholder="Share your experience (optional)"
                        className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                    {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                    <button onClick={submit}
                        className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                        Submit review
                    </button>
                </div>
            ) : (
                <p className="mt-3 text-sm text-gray-500">
                    <Link href="/login" className="font-medium text-indigo-600 underline">Log in</Link> to leave a review.
                </p>
            )}
        </div>
    );
}
