import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { MessageSquare, Star } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { EmptyState, TableSkeleton } from '@/components/shared/Ui';
import VendorTabs from '@/components/vendor/VendorTabs';

interface VendorReview {
    id: string;
    rating: number;
    comment?: string | null;
    reviewer_name?: string;
    product_name?: string;
    created_at: string;
}

function Stars({ rating }: { rating: number }) {
    return (
        <span className="inline-flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} className={`h-3.5 w-3.5 ${n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
            ))}
        </span>
    );
}

export default function VendorReviewsPage() {
    const [rows, setRows] = useState<VendorReview[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(() => {
        api.get<{ data: VendorReview[] }>('/api/vendor/reviews')
            .then((res) => setRows(res.data ?? []))
            .catch((err) => toast.error(errorMessage(err, 'Could not load reviews')))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <AppLayout title="Vendor reviews">
            <Head title="Reviews" />
            <div className="mx-auto max-w-5xl space-y-4">
                <VendorTabs />

                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Reviews</h1>
                    <p className="text-sm text-gray-500">Ratings and comments on your products.</p>
                </div>

                {loading ? (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <TableSkeleton rows={5} cols={3} />
                    </div>
                ) : rows.length === 0 ? (
                    <div className="rounded-lg bg-white p-8 shadow dark:bg-gray-800">
                        <EmptyState
                            icon={<MessageSquare className="h-10 w-10" />}
                            title="No reviews yet"
                            description="Reviews appear after customers rate their purchases."
                        />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {rows.map((review) => (
                            <div key={review.id} className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {review.reviewer_name ?? 'Customer'}
                                        </span>
                                        <Stars rating={Number(review.rating ?? 0)} />
                                        {review.product_name && (
                                            <Link href="/vendor/products" className="text-xs text-indigo-600 hover:underline">
                                                {review.product_name}
                                            </Link>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-400">{formatDate(review.created_at)}</span>
                                </div>
                                {review.comment && (
                                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{review.comment}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
