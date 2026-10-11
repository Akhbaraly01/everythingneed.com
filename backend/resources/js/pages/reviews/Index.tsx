import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { Star, RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Review {
    id: string;
    user_name: string;
    rating: number;
    comment?: string;
    entity_type?: string;
    entity_id?: string;
    created_at: string;
}

export default function ReviewsIndex() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [ratingFilter, setRatingFilter] = useState(0);
    const [retryTick, setRetryTick] = useState(0);

    useEffect(() => {
        setLoading(true);
        setError(null);
        const params = ratingFilter ? `?rating=${ratingFilter}` : '';
        api.get<{ data: Review[] }>(`/api/reviews${params}`)
            .then((res) => setReviews(res.data))
            .catch((e) => {
                setError(errorMessage(e, 'Failed to load reviews'));
                setReviews([]);
            })
            .finally(() => setLoading(false));
    }, [ratingFilter, retryTick]);

    return (
        <AppLayout title="Reviews">
            <Head title="Reviews" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reviews</h1>

                <div className="flex gap-2">
                    <button onClick={() => setRatingFilter(0)} className={`rounded-full px-3 py-1 text-sm ${!ratingFilter ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700'}`}>All</button>
                    {[5, 4, 3, 2, 1].map((r) => (
                        <button key={r} onClick={() => setRatingFilter(r)} className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm ${ratingFilter === r ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700'}`}>
                            {r} <Star className="h-3 w-3" />
                        </button>
                    ))}
                </div>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : error ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-red-600 font-medium">{error}</p>
                        <button onClick={() => setRetryTick((t) => t + 1)} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                            <RefreshCcw className="h-4 w-4" /> Retry
                        </button>
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Star className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">No reviews found</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((r) => (
                            <div key={r.id} className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{r.user_name}</p>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star key={i} className={`h-3 w-3 ${i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                            ))}
                                        </div>
                                    </div>
                                    {r.entity_type && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-700">{r.entity_type}</span>}
                                </div>
                                {r.comment && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{r.comment}</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
