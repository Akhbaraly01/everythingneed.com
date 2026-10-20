import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import type { Vendor } from '@/types';
import { Store, Star, CheckCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface VendorsProps {
    vendors: {
        data: Vendor[];
        meta: { current_page: number; last_page: number; per_page: number; total: number };
    };
    categories?: string[];
    filters?: { search?: string; category?: string };
}

export default function Vendors({ vendors, categories = [], filters = {} }: VendorsProps) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [category, setCategory] = useState(filters.category ?? '');

    const apply = (next: { search?: string; category?: string }) => {
        router.get(
            '/vendors',
            Object.fromEntries(Object.entries(next).filter(([, v]) => v !== '')),
            { preserveState: true, preserveScroll: true },
        );
    };

    useEffect(() => {
        setSearch(filters.search ?? '');
        setCategory(filters.category ?? '');
    }, [filters.search, filters.category]);

    const hasFilters = Boolean(search || category);

    return (
        <AppLayout title="Vendors">
            <Head title="Vendors" />

            <div className="mb-6 space-y-3">
                <form
                    onSubmit={(e) => { e.preventDefault(); apply({ search, category }); }}
                    className="flex flex-col gap-3 sm:flex-row"
                    data-testid="vendors-filters"
                >
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search stores or categories..."
                        aria-label="Search vendors"
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                    />
                    <select
                        value={category}
                        onChange={(e) => { setCategory(e.target.value); apply({ search, category: e.target.value }); }}
                        aria-label="Category"
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                    >
                        <option value="">Any category</option>
                        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {hasFilters && (
                        <button
                            type="button"
                            onClick={() => { setSearch(''); setCategory(''); apply({}); }}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            <X className="h-4 w-4" /> Clear
                        </button>
                    )}
                </form>
                <p className="text-sm text-gray-500">{vendors.meta.total} vendor{vendors.meta.total === 1 ? '' : 's'} found</p>
            </div>

            {vendors.data.length === 0 ? (
                <p className="rounded-lg bg-white p-8 text-center text-gray-500 shadow dark:bg-gray-800">No vendors match your filters.</p>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {vendors.data.map((vendor) => (
                        <Link key={vendor.id} href={`/vendors/${vendor.slug ?? vendor.id}`} className="block rounded-lg bg-white p-6 shadow hover:shadow-md dark:bg-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-indigo-100 p-3"><Store className="h-6 w-6 text-indigo-600" /></div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{vendor.store_name}</h3>
                                    <p className="text-sm text-gray-500">{vendor.category}</p>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />{vendor.rating ?? 'N/A'}
                                {vendor.is_verified && <CheckCircle className="h-4 w-4 text-green-500" />}
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {vendors.meta.last_page > 1 && (
                <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
                    <span>Page {vendors.meta.current_page} of {vendors.meta.last_page}</span>
                    <div className="flex gap-2">
                        <button
                            disabled={vendors.meta.current_page <= 1}
                            onClick={() => router.get('/vendors', { search, category, page: vendors.meta.current_page - 1 }, { preserveState: true, preserveScroll: true })}
                            className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600"
                        >Previous</button>
                        <button
                            disabled={vendors.meta.current_page >= vendors.meta.last_page}
                            onClick={() => router.get('/vendors', { search, category, page: vendors.meta.current_page + 1 }, { preserveState: true, preserveScroll: true })}
                            className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600"
                        >Next</button>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
