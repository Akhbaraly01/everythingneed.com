import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import { Star, Trash2 } from 'lucide-react';

interface Review {
    id: string;
    rating: number;
    title: string;
    comment: string;
    reviewable_type: string;
    created_at: string;
}

export default function AccountReviews() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ data: Review[] }>('/api/reviews', { params: { mine: true } })
            .then((res) => setReviews(res.data))
            .catch(() => setReviews([]))
            .finally(() => setLoading(false));
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this review?')) return;
        try { await api.delete(`/api/reviews/${id}`); setReviews((prev) => prev.filter((r) => r.id !== id)); } catch {}
    };

    return (
        <AppLayout title="My Reviews">
            <Head title="My Reviews" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Star className="h-6 w-6 text-yellow-500" /> My Reviews</h1>
                {loading ? <p className="text-gray-500">Loading...</p> : reviews.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Star className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">You haven't written any reviews yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {reviews.map((r) => (
                            <div key={r.id} className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                <div className="flex justify-between">
                                    <div className="flex text-yellow-400">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < r.rating ? 'fill-yellow-400' : ''}`} />)}</div>
                                    <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                                </div>
                                {r.title && <p className="font-semibold mt-2 dark:text-white">{r.title}</p>}
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{r.comment}</p>
                                <p className="text-xs text-gray-400 mt-2">{r.reviewable_type} • {new Date(r.created_at).toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
