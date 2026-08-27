import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Handshake, ArrowRight, Wrench, Truck, Home } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NeedCategory {
    id: string;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    items_count?: number;
}

export default function NeedsIndex() {
    const [categories, setCategories] = useState<NeedCategory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ data: NeedCategory[] }>('/api/need-categories')
            .then((res) => setCategories(res.data))
            .catch(() => setCategories([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AppLayout title="Needs & Services">
            <Head title="Needs & Services" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Needs & Services</h1>
                        <p className="text-sm text-gray-500">Find services or submit your service needs</p>
                    </div>
                    <Link href="/needs/request" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                        Submit a Request
                    </Link>
                </div>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading...</p></div>
                ) : categories.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Handshake className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No categories yet</h3>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {categories.map((cat) => (
                            <Link key={cat.id} href={`/needs/${cat.slug}`}
                                className="group rounded-lg bg-white p-6 shadow transition hover:shadow-md dark:bg-gray-800">
                                <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white">{cat.name}</h3>
                                {cat.description && <p className="mt-2 text-sm text-gray-500 line-clamp-2">{cat.description}</p>}
                                {cat.items_count != null && <p className="mt-2 text-xs text-gray-400">{cat.items_count} items</p>}
                                <span className="mt-4 inline-flex items-center gap-1 text-sm text-indigo-600">View <ArrowRight className="h-3 w-3" /></span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
