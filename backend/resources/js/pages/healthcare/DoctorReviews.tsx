import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

interface Doctor {
    id: string;
    full_name: string;
    specialization: string;
}

interface Review {
    id: string;
    user_id: string;
    rating: number;
    comment?: string | null;
    created_at: string;
}

interface ReviewsProps {
    doctor_id: string;
}

export default function DoctorReviews({ doctor_id }: ReviewsProps) {
    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        Promise.all([
            api.get<{ data: Doctor }>(`/api/doctors/${doctor_id}`),
            api.get<{ data: Review[] }>(`/api/reviews?reviewable_type=doctor&reviewable_id=${doctor_id}`),
        ])
            .then(([doc, rev]) => {
                setDoctor(doc.data);
                setReviews(Array.isArray(rev.data) ? rev.data : []);
            })
            .catch((e) => setError(errorMessage(e, 'Reviews not found')))
            .finally(() => setLoading(false));
    };

    useEffect(load, [doctor_id]);

    const submit = async () => {
        setSubmitting(true);
        setFormError(null);
        try {
            await api.post('/api/reviews', {
                reviewable_type: 'doctor',
                reviewable_id: doctor_id,
                rating,
                comment: comment.trim() || undefined,
            });
            setComment('');
            setRating(5);
            load();
        } catch (e) {
            setFormError(errorMessage(e, 'Review failed — log in to leave a review'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AppLayout title="Doctor Reviews">
            <Head title="Doctor Reviews" />
            <div className="mx-auto max-w-2xl space-y-6">
                <Link href={`/healthcare/doctors/${doctor_id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    ← Back to {doctor?.full_name ?? 'doctor'}
                </Link>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">Loading reviews...</p>
                    </div>
                ) : error || !doctor ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Doctor not found</h3>
                        <p className="mt-1 text-sm text-gray-500">{error ?? 'This doctor does not exist.'}</p>
                    </div>
                ) : (
                    <>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                            Reviews · {doctor.full_name}
                        </h1>
                        {reviews.length === 0 ? (
                            <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                                <Star className="mx-auto h-12 w-12 text-gray-400" />
                                <p className="mt-4 text-gray-500">No reviews yet — be the first.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {reviews.map((review) => (
                                    <div key={review.id} className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                        <p className="text-sm font-semibold text-amber-500">
                                            {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                        </p>
                                        {review.comment && (
                                            <p className="mt-1 text-sm text-gray-900 dark:text-white">{review.comment}</p>
                                        )}
                                        <p className="mt-1 text-xs text-gray-500">{formatDateTime(review.created_at)}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Leave a review</h2>
                            <div className="mt-4 flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button key={star} onClick={() => setRating(star)} className={`text-2xl ${star <= rating ? 'text-amber-500' : 'text-gray-300'}`}>
                                        ★
                                    </button>
                                ))}
                            </div>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows={3}
                                placeholder="How was your visit? (optional)"
                                className="mt-3 block w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                            />
                            {formError && <p className="mt-2 text-sm text-red-600">{formError}</p>}
                            <button
                                onClick={submit}
                                disabled={submitting}
                                className="mt-4 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                            >
                                {submitting ? 'Submitting...' : 'Submit review'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
