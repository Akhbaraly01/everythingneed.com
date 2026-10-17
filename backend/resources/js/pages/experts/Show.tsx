import AppLayout from '@/layouts/AppLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { User, Star, ArrowLeft, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Image from '@/components/shared/Image';

interface Expert {
    id: string;
    name: string;
    specialty: string;
    bio?: string;
    image_url?: string;
    rating?: number;
    hourly_rate?: number;
    city?: string;
    years_experience?: number;
}

interface ExpertReview {
    id: string;
    rating: number;
    comment?: string | null;
    user_name?: string | null;
    created_at: string;
}

interface ExpertProfileProps {
    expert_id: string;
}

export default function ExpertProfile({ expert_id }: ExpertProfileProps) {
    const { props } = usePage();
    const auth = (props.auth ?? null) as { user?: { id: string } } | null;
    const [expert, setExpert] = useState<Expert | null>(null);
    const [loading, setLoading] = useState(true);
    const [availability, setAvailability] = useState<Record<string, string[]>>({});
    const [reviews, setReviews] = useState<ExpertReview[]>([]);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const loadReviews = () => {
        api.get<{ data: ExpertReview[] }>(`/api/experts/${expert_id}/reviews?per_page=20`)
            .then((res) => setReviews(Array.isArray(res.data) ? res.data : []))
            .catch(() => setReviews([]));
    };

    useEffect(() => {
        api.get<{ data: Expert }>(`/api/experts/${expert_id}`)
            .then((res) => setExpert(res.data))
            .catch(() => setExpert(null))
            .finally(() => setLoading(false));
        api.get<{ data: Record<string, string[]> }>(`/api/experts/${expert_id}/availability`)
            .then((res) => setAvailability(res.data ?? {}))
            .catch(() => {});
        loadReviews();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [expert_id]);

    const submitReview = async () => {
        if (!auth?.user) {
            toast.error('Sign in to leave a review');
            return;
        }
        setSubmitting(true);
        try {
            await api.post(`/api/experts/${expert_id}/review`, { rating, comment: comment.trim() || undefined });
            toast.success('Review submitted');
            setComment('');
            setRating(5);
            loadReviews();
        } catch (e) {
            toast.error(errorMessage(e, 'Could not submit review'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <AppLayout title="Expert Profile"><p className="p-12 text-center text-gray-500">Loading...</p></AppLayout>;
    if (!expert) return <AppLayout title="Expert Profile"><p className="p-12 text-center text-red-500">Not found</p></AppLayout>;

    return (
        <AppLayout title={expert.name}>
            <Head title={expert.name} />
            <div className="max-w-3xl mx-auto space-y-6">
                <Link href="/experts" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4" /> Back to Experts
                </Link>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="flex items-center gap-6">
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-gray-100">
                            {expert.image_url ? <Image src={expert.image_url} alt="" className="h-full w-full rounded-full object-cover" /> :
                                <div className="flex h-full items-center justify-center text-gray-400"><User className="h-12 w-12" /></div>}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{expert.name}</h1>
                            <p className="text-indigo-600 font-medium">{expert.specialty}</p>
                            {expert.years_experience && <p className="text-sm text-gray-500">{expert.years_experience} years experience</p>}
                            {expert.rating && <p className="flex items-center gap-1 text-sm text-yellow-600"><Star className="h-4 w-4 fill-yellow-400" /> {expert.rating} rating</p>}
                        </div>
                    </div>
                    {expert.bio && <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{expert.bio}</p>}
                    {expert.hourly_rate != null && <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">${expert.hourly_rate}/hour</p>}
                    <Link
                        href={`/experts/${expert.id}/book`}
                        className="mt-4 inline-block rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
                    >
                        Book Consultation
                    </Link>
                    <Link
                        href="/experts/bookings"
                        className="mt-2 block text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                        My sessions
                    </Link>
                </div>

                {Object.keys(availability).length > 0 && (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Clock className="h-5 w-5" /> Availability</h2>
                        <div className="mt-4 grid grid-cols-7 gap-2">
                            {Object.entries(availability).slice(0, 14).map(([date, slots]) => (
                                <div key={date}>
                                    <p className="text-[10px] text-center text-gray-500 mb-1">{new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                    <div className="space-y-1">
                                        {slots.slice(0, 3).map((s) => (
                                            <p key={s} className="text-[10px] bg-green-50 text-green-700 text-center rounded py-0.5 dark:bg-green-900/20 dark:text-green-400">{s}</p>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800" data-testid="expert-reviews">
                    <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" /> Client reviews
                    </h2>
                    <div className="mt-4 space-y-3">
                        {reviews.length === 0 ? (
                            <p className="text-sm text-gray-500">No reviews yet — be the first to share your experience.</p>
                        ) : (
                            reviews.map((r) => (
                                <div key={r.id} className="border-b border-gray-100 pb-3 last:border-0 dark:border-gray-700">
                                    <p className="flex items-center gap-1 text-sm">
                                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                        <span className="font-semibold">{r.rating}/5</span>
                                        <span className="text-gray-500">· {r.user_name ?? 'Verified client'}</span>
                                    </p>
                                    {r.comment && <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{r.comment}</p>}
                                </div>
                            ))
                        )}
                    </div>
                    <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => setRating(n)}
                                    aria-label={`Rate ${n} out of 5`}
                                    className="tap-safe"
                                >
                                    <Star className={`h-6 w-6 ${n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                                </button>
                            ))}
                        </div>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={2}
                            maxLength={1000}
                            placeholder="Share your experience (optional)..."
                            className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                        />
                        <button
                            type="button"
                            onClick={() => void submitReview()}
                            disabled={submitting}
                            className="btn-3d mt-2 px-5 py-2 text-xs font-semibold disabled:opacity-60"
                        >
                            {submitting ? 'Submitting…' : 'Submit review'}
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
