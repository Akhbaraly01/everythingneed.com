import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { Tag, Package, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import { EmptyState, TableSkeleton } from '@/components/shared/Ui';
import Image from '@/components/shared/Image';

interface DealCategory {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    icon?: string | null;
    color?: string | null;
}

interface Deal {
    id: string;
    name: string;
    slug?: string;
    description?: string | null;
    price: number | string | null;
    image_url?: string | null;
    is_available: boolean;
    vendor_id?: string | null;
}

interface DealsResponse {
    data: Deal[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
}

interface Props {
    category: DealCategory;
}

export default function DealsCategory({ category }: Props) {
    const [deals, setDeals] = useState<DealsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    const fetchDeals = useCallback(() => {
        setLoading(true);
        api.get<DealsResponse>('/api/deals', { params: { category: category.slug, page, per_page: 12 } })
            .then((res) => setDeals(res))
            .catch(() => setDeals(null))
            .finally(() => setLoading(false));
    }, [category.slug, page]);

    useEffect(() => {
        fetchDeals();
    }, [fetchDeals]);

    return (
        <AppLayout title={`${category.name} deals`}>
            <Head title={`${category.name} - Deals`} />

            <div className="mx-auto max-w-5xl space-y-6">
                <Link href="/deals" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    <ArrowLeft className="h-4 w-4" />
                    All deals
                </Link>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                        <Tag className="h-3 w-3" /> Deal category
                    </span>
                    <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{category.name}</h1>
                    {category.description && (
                        <p className="mt-1 text-sm text-gray-500">{category.description}</p>
                    )}
                    {deals && (
                        <p className="mt-1 text-sm text-gray-500">{deals.meta.total} deal{deals.meta.total !== 1 ? 's' : ''}</p>
                    )}
                </div>

                {loading ? (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <TableSkeleton rows={4} cols={3} />
                    </div>
                ) : !deals || deals.data.length === 0 ? (
                    <div className="rounded-lg bg-white p-8 shadow dark:bg-gray-800">
                        <EmptyState
                            icon={<Package className="h-10 w-10" />}
                            title="No deals in this category yet"
                            description="Check back soon - new deals are added daily."
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {deals.data.map((deal) => (
                            <Link
                                key={deal.id}
                                href={`/deals/${deal.slug ?? deal.id}`}
                                className="group overflow-hidden rounded-lg bg-white shadow transition hover:shadow-md dark:bg-gray-800"
                            >
                                <div className="aspect-video overflow-hidden bg-gray-100 dark:bg-gray-700">
                                    {deal.image_url ? (
                                        <Image src={deal.image_url} alt={deal.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-gray-400">
                                            <Package className="h-8 w-8" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <p className="line-clamp-2 font-medium text-gray-900 group-hover:text-indigo-600 dark:text-white">{deal.name}</p>
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="font-semibold text-green-600">
                                            {deal.price != null ? formatPrice(Number(deal.price)) : 'On request'}
                                        </span>
                                        <span className={`text-xs font-medium ${deal.is_available ? 'text-green-600' : 'text-gray-400'}`}>
                                            {deal.is_available ? 'Available' : 'Unavailable'}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {deals && deals.meta.last_page > 1 && (
                    <div className="flex items-center justify-center gap-3 text-sm">
                        {deals.meta.current_page > 1 && (
                            <button
                                type="button"
                                onClick={() => setPage(deals.meta.current_page - 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                            >
                                Previous
                            </button>
                        )}
                        <span className="text-gray-500">Page {deals.meta.current_page} of {deals.meta.last_page}</span>
                        {deals.meta.current_page < deals.meta.last_page && (
                            <button
                                type="button"
                                onClick={() => setPage(deals.meta.current_page + 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                            >
                                Next
                            </button>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
