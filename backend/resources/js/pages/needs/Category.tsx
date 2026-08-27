import AppLayout from '@/layouts/AppLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NeedItem {
    id: string;
    title: string;
    description?: string;
    price?: number;
    vendor_name?: string;
    image_url?: string;
}

interface NeedsCategoryProps {
    slug: string;
}

export default function NeedsCategory({ slug }: NeedsCategoryProps) {
    const [items, setItems] = useState<NeedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryName, setCategoryName] = useState(slug);

    useEffect(() => {
        api.get<{ data: NeedItem[]; category?: string }>(`/api/need-items?category=${encodeURIComponent(slug)}`)
            .then((res) => { setItems(res.data); if (res.category) setCategoryName(res.category); })
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, [slug]);

    return (
        <AppLayout title={categoryName}>
            <Head title={categoryName} />
            <div className="space-y-6">
                <Link href="/needs" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4" /> All Categories
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{categoryName}</h1>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : items.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">No items in this category yet.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((item) => (
                            <Link key={item.id} href={`/needs/${slug}/${item.id}`}
                                className="group rounded-lg bg-white p-4 shadow transition hover:shadow-md dark:bg-gray-800">
                                {item.image_url && <div className="h-40 rounded-lg bg-gray-100 dark:bg-gray-700"><img src={item.image_url} alt="" className="h-full w-full rounded-lg object-cover" /></div>}
                                <h3 className="mt-2 font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white">{item.title}</h3>
                                {item.description && <p className="mt-1 text-sm text-gray-500 line-clamp-2">{item.description}</p>}
                                {item.price != null && <p className="mt-2 font-bold text-gray-900 dark:text-white">{formatCurrency(item.price)}</p>}
                                {item.vendor_name && <p className="text-xs text-gray-400">by {item.vendor_name}</p>}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
