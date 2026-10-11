import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import { Calendar, ArrowRight, Package, Tag } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { formatPrice } from '@/lib/currency';
import Image from '@/components/shared/Image';

interface Deal {
    id: string;
    name: string;
    slug?: string;
    description?: string | null;
    category_id?: string;
    price: number | string | null;
    image_url?: string | null;
    is_available: boolean;
    vendor_id?: string | null;
    category?: { id: string; name: string; slug?: string } | null;
    vendor?: { id: string; store_name: string; slug?: string; is_verified?: boolean; rating?: number } | null;
    created_at?: string;
}

export default function DealShow({ deal_id }: { deal_id?: string }) {
    const [deal, setDeal] = useState<Deal | null>(null);
    const [loading, setLoading] = useState(true);
    const id = deal_id || (typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : undefined);

    useEffect(() => {
        if (id) {
            api.get<{ data: Deal }>(`/api/deals/${id}`)
                .then((res) => setDeal(res.data))
                .catch(() => {})
                .finally(() => setLoading(false));
        } else setLoading(false);
    }, [id]);

    if (loading) return <AppLayout title="Deal"><p className="p-12 text-center text-gray-500">Loading...</p></AppLayout>;
    if (!deal) return <AppLayout title="Deal"><p className="p-12 text-center text-red-500">Deal not found</p></AppLayout>;

    const vendorHref = deal.vendor?.slug ?? deal.vendor?.id ?? deal.vendor_id;

    return (
        <AppLayout title={deal.name}>
            <Head title={deal.name} />
            <div className="mx-auto max-w-3xl space-y-6">
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    {deal.image_url && (
                        <div className="mb-4 aspect-video overflow-hidden rounded-lg bg-gray-100">
                            <Image src={deal.image_url} alt={deal.name} className="h-full w-full object-cover" />
                        </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                        {deal.category && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                                <Tag className="h-3 w-3" /> {deal.category.name}
                            </span>
                        )}
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${deal.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                            {deal.is_available ? 'Available' : 'Unavailable'}
                        </span>
                    </div>
                    <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{deal.name}</h1>
                    {deal.vendor && (
                        <p className="mt-1 text-sm text-gray-500">
                            Sold by{' '}
                            <Link href={`/vendors/${deal.vendor.slug ?? deal.vendor.id}`} className="font-medium text-indigo-600 hover:text-indigo-500">
                                {deal.vendor.store_name}
                            </Link>
                        </p>
                    )}
                    {deal.description && (
                        <p className="mt-3 text-gray-600 dark:text-gray-400">{deal.description}</p>
                    )}
                </div>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 text-3xl font-bold text-green-600">
                            <Package className="h-6 w-6" />
                            {deal.price != null ? formatPrice(Number(deal.price)) : 'Price on request'}
                        </span>
                    </div>
                    {deal.created_at && (
                        <p className="mt-2 flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="h-4 w-4" /> Listed {formatDate(deal.created_at)}
                        </p>
                    )}
                </div>

                {vendorHref ? (
                    <button
                        onClick={() => router.visit(`/vendors/${vendorHref}`)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-white hover:bg-red-700"
                    >
                        Visit Vendor Store <ArrowRight className="h-4 w-4" />
                    </button>
                ) : (
                    <Link
                        href="/needs/request"
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-white hover:bg-red-700"
                    >
                        Request This Deal <ArrowRight className="h-4 w-4" />
                    </Link>
                )}
            </div>
        </AppLayout>
    );
}
