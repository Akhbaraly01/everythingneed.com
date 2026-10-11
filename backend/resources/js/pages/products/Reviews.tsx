import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { Star, ArrowLeft, MessageSquare } from 'lucide-react';
import type { Product } from '@/types';
import { formatDate } from '@/lib/utils';
import { EmptyState } from '@/components/shared/Ui';

interface ProductReview {
    id: string;
    rating: number;
    comment?: string | null;
    reviewer_name?: string;
    created_at: string;
}

interface Pager {
    data: ProductReview[];
    current_page: number;
    last_page: number;
    total: number;
}

interface Props {
    product: Product;
    reviews: Pager;
}

function Stars({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
                <Star
                    key={n}
                    className={`h-4 w-4 ${n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                />
            ))}
        </div>
    );
}

export default function ProductReviews({ product, reviews }: Props) {
    return (
        <AppLayout>
            <Head title={`${product.name} reviews`} />

            <div className="mx-auto max-w-3xl space-y-6">
                <Link
                    href={`/products/${product.slug}`}
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to {product.name}
                </Link>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reviews for {product.name}</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {reviews.total} review{reviews.total !== 1 ? 's' : ''}
                        {typeof product.rating === 'number' && <span> - average {product.rating.toFixed(1)} / 5</span>}
                    </p>
                </div>

                {reviews.data.length === 0 ? (
                    <div className="rounded-lg bg-white p-8 shadow dark:bg-gray-800">
                        <EmptyState
                            icon={<MessageSquare className="h-10 w-10" />}
                            title="No reviews yet"
                            description="Be the first to review this product."
                        />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.data.map((review) => (
                            <div key={review.id} className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {review.reviewer_name ?? 'Customer'}
                                        </span>
                                        <Stars rating={Number(review.rating ?? 0)} />
                                    </div>
                                    <span className="text-xs text-gray-400">{formatDate(review.created_at)}</span>
                                </div>
                                {review.comment && (
                                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{review.comment}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {reviews.last_page > 1 && (
                    <div className="flex items-center justify-center gap-3 text-sm">
                        {reviews.current_page > 1 && (
                            <Link
                                href={`/products/${product.slug}/reviews?page=${reviews.current_page - 1}`}
                                className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                            >
                                Previous
                            </Link>
                        )}
                        <span className="text-gray-500">
                            Page {reviews.current_page} of {reviews.last_page}
                        </span>
                        {reviews.current_page < reviews.last_page && (
                            <Link
                                href={`/products/${product.slug}/reviews?page=${reviews.current_page + 1}`}
                                className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                            >
                                Next
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
