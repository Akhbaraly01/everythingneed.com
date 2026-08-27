import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Search, Package, Briefcase, Hotel, UtensilsCrossed, Building2, Store } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SearchResult {
    type: string;
    id: string;
    title: string;
    description?: string;
    image_url?: string;
    price?: number;
    url: string;
}

const typeIcons: Record<string, typeof Package> = {
    product: Package,
    job: Briefcase,
    hotel: Hotel,
    restaurant: UtensilsCrossed,
    property: Building2,
    vendor: Store,
};

export default function SearchResults() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    const doSearch = (q: string) => {
        if (!q.trim()) {
            setResults([]);
            return;
        }
        setLoading(true);
        api.get<{ data: SearchResult[] }>(`/api/db/products?search=${encodeURIComponent(q)}&limit=20`)
            .then((res) => {
                const mapped = (res.data ?? []).map((item: any) => ({
                    type: 'product',
                    id: item.id,
                    title: item.name,
                    description: item.description,
                    image_url: item.image_url,
                    price: item.price,
                    url: `/products/${item.id}`,
                }));
                setResults(mapped);
            })
            .catch(() => setResults([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const q = params.get('q') ?? '';
        setQuery(q);
        if (q) doSearch(q);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/search', { q: query }, { preserveState: true });
        doSearch(query);
    };

    return (
        <AppLayout title="Search">
            <Head title="Search Results" />

            <div className="space-y-6">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search products, hotels, food, jobs..."
                            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            autoFocus
                        />
                    </div>
                    <button type="submit" className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-500">
                        Search
                    </button>
                </form>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Searching...</p></div>
                ) : results.length === 0 && query ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Search className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No results found</h3>
                        <p className="mt-2 text-gray-500">Try different keywords or browse categories.</p>
                        <Link href="/products" className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                            Browse Products
                        </Link>
                    </div>
                ) : results.length > 0 ? (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-500">{results.length} result{results.length !== 1 ? 's' : ''}</p>
                        {results.map((item) => {
                            const Icon = typeIcons[item.type] ?? Package;
                            return (
                                <Link
                                    key={`${item.type}-${item.id}`}
                                    href={item.url}
                                    className="flex items-center gap-4 rounded-lg bg-white p-4 shadow transition hover:shadow-md dark:bg-gray-800"
                                >
                                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                        {item.image_url ? (
                                            <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-gray-400"><Icon className="h-6 w-6" /></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                                {item.type}
                                            </span>
                                        </div>
                                        <p className="mt-1 font-medium text-gray-900 hover:text-indigo-600 dark:text-white">{item.title}</p>
                                        {item.description && <p className="mt-0.5 truncate text-sm text-gray-500">{item.description}</p>}
                                    </div>
                                    {item.price != null && (
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(item.price)}</p>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                ) : null}
            </div>
        </AppLayout>
    );
}
