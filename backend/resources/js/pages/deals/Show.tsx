import AppLayout from '@/layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import { Tag, DollarSign, Calendar, MapPin, ArrowRight } from 'lucide-react';

interface Deal {
    id: string;
    title: string;
    description: string;
    category: string;
    price: number;
    original_price: number;
    discount_percent: number;
    image_url: string;
    valid_until: string;
    vendor: { store_name: string; rating: number };
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

    return (
        <AppLayout title={deal.title}>
            <Head title={deal.title} />
            <div className="mx-auto max-w-3xl space-y-6">
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-600">-{deal.discount_percent}% OFF</span>
                    <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{deal.title}</h1>
                    <p className="text-gray-500">{deal.category} • by {deal.vendor?.store_name}</p>
                    <p className="mt-3 text-gray-600 dark:text-gray-400">{deal.description}</p>
                </div>
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="flex items-center gap-4">
                        <span className="text-3xl font-bold text-green-600">${deal.price}</span>
                        <span className="text-lg line-through text-gray-400">${deal.original_price}</span>
                        <span className="text-sm text-red-500">Save ${(deal.original_price - deal.price).toFixed(2)}</span>
                    </div>
                    {deal.valid_until && <p className="text-sm text-gray-500 mt-2 flex items-center gap-1"><Calendar className="h-4 w-4" /> Valid until {new Date(deal.valid_until).toLocaleDateString()}</p>}
                </div>
                <button onClick={() => router.visit(`/deals/${deal.id}/claim`)} className="w-full rounded-lg bg-red-600 px-4 py-3 text-white hover:bg-red-700 flex items-center justify-center gap-2">
                    Claim This Deal <ArrowRight className="h-4 w-4" />
                </button>
            </div>
        </AppLayout>
    );
}
