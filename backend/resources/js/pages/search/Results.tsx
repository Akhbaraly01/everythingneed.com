import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import {
    Search, Package, Briefcase, Hotel, UtensilsCrossed, Building2, Store,
    Tag, ClipboardList, Stethoscope, Award, Sprout, Hammer,
} from 'lucide-react';
import Image from '@/components/shared/Image';
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

/** Spec §49 — unified search tabs (server validates the same type list). */
const TABS: { key: string; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'products', label: 'Products' },
    { key: 'categories', label: 'Categories' },
    { key: 'services', label: 'Services' },
    { key: 'needs', label: 'Needs' },
    { key: 'doctors', label: 'Doctors' },
    { key: 'courses', label: 'Courses' },
    { key: 'experts', label: 'Experts' },
    { key: 'vendors', label: 'Vendors' },
    { key: 'jobs', label: 'Jobs' },
    { key: 'hotels', label: 'Hotels' },
    { key: 'restaurants', label: 'Food' },
    { key: 'properties', label: 'Real Estate' },
    { key: 'agriculture', label: 'Agriculture' },
    { key: 'building', label: 'Building Services' },
];

const typeIcons: Record<string, typeof Package> = {
    product: Package,
    job: Briefcase,
    hotel: Hotel,
    restaurant: UtensilsCrossed,
    property: Building2,
    vendor: Store,
    category: Tag,
    need: ClipboardList,
    doctor: Stethoscope,
    expert: Award,
    agriculture: Sprout,
    building: Hammer,
    course: Award,
    service: Hammer,
};

type GroupItem = Record<string, unknown>;

/** Per-group display fields (server rows already carry type + url). */
const GROUP_FIELDS: Record<string, (item: GroupItem) => {
    title: string; description?: string; image?: string; price?: number;
}> = {
    products: (i) => ({ title: String(i.name ?? 'Untitled'), description: i.description != null ? String(i.description) : undefined, image: i.image != null ? String(i.image) : undefined, price: i.price != null ? Number(i.price) : undefined }),
    categories: (i) => ({ title: String(i.name ?? 'Untitled'), description: i.description != null ? String(i.description) : undefined, image: i.image != null ? String(i.image) : undefined }),
    services: (i) => ({ title: String(i.name ?? i.title ?? 'Untitled'), description: i.description != null ? String(i.description) : undefined, price: i.budget != null ? Number(i.budget) : i.price != null ? Number(i.price) : undefined }),
    needs: (i) => ({ title: String(i.title ?? 'Untitled'), description: [i.description, i.location].filter(Boolean).map(String).join(' · ') || undefined }),
    doctors: (i) => ({ title: String(i.name ?? 'Untitled'), description: i.specialization != null ? String(i.specialization) : undefined, image: i.image != null ? String(i.image) : undefined, price: i.price != null ? Number(i.price) : undefined }),
    experts: (i) => ({ title: String(i.name ?? 'Untitled'), description: i.specialization != null ? String(i.specialization) : undefined, image: i.image != null ? String(i.image) : undefined }),
    vendors: (i) => ({ title: String(i.name ?? 'Untitled'), description: i.description != null ? String(i.description) : undefined }),
    courses: (i) => ({ title: String(i.title ?? 'Untitled'), description: i.instructor_name != null ? String(i.instructor_name) : undefined, image: i.thumbnail != null ? String(i.thumbnail) : undefined, price: i.price != null ? Number(i.price) : undefined }),
    jobs: (i) => ({ title: String(i.title ?? 'Untitled'), description: [i.company, i.location].filter(Boolean).map(String).join(' · ') || undefined }),
    hotels: (i) => ({ title: String(i.name ?? 'Untitled'), description: [i.city, i.country].filter(Boolean).map(String).join(', ') || undefined }),
    restaurants: (i) => ({ title: String(i.name ?? 'Untitled'), description: i.cuisine_type != null ? String(i.cuisine_type) : undefined, image: i.image != null ? String(i.image) : undefined }),
    properties: (i) => ({ title: String(i.title ?? 'Untitled'), description: [i.city, i.property_type].filter(Boolean).map(String).join(' · ') || undefined, price: i.price != null ? Number(i.price) : undefined }),
    agriculture: (i) => ({ title: String(i.name ?? 'Untitled'), description: i.description != null ? String(i.description) : undefined, image: i.image != null ? String(i.image) : undefined, price: i.price != null ? Number(i.price) : undefined }),
    building: (i) => ({ title: String(i.name ?? 'Untitled'), description: i.description != null ? String(i.description) : undefined, price: i.price != null ? Number(i.price) : undefined }),
};

export default function SearchResults() {
    const [query, setQuery] = useState('');
    const [activeType, setActiveType] = useState('all');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    const doSearch = (q: string, type: string = activeType) => {
        if (!q.trim() || q.trim().length < 2) {
            setResults([]);
            return;
        }
        setLoading(true);
        const params = new URLSearchParams({ q: q.trim() });
        if (type !== 'all') params.set('type', type);
        api.get<{ data: Record<string, GroupItem[]> }>(`/api/search?${params.toString()}`)
            .then((res) => {
                const groups = res.data ?? {};
                const mapped: SearchResult[] = [];
                for (const [group, items] of Object.entries(groups)) {
                    const fieldsFor = GROUP_FIELDS[group];
                    if (!fieldsFor || !Array.isArray(items)) continue;
                    for (const item of items) {
                        const f = fieldsFor(item);
                        mapped.push({
                            type: String(item.type ?? group),
                            id: String(item.id ?? ''),
                            title: f.title,
                            description: f.description,
                            image_url: f.image,
                            price: f.price,
                            url: String(item.url ?? '/search'),
                        });
                    }
                }
                setResults(mapped);
            })
            .catch(() => setResults([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const q = params.get('q') ?? '';
        const type = params.get('type') ?? 'all';
        setQuery(q);
        setActiveType(type);
        if (q) doSearch(q, type);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const type = activeType;
        router.get('/search', { q: query, ...(type !== 'all' ? { type } : {}) }, { preserveState: true });
        doSearch(query, type);
    };

    const selectTab = (type: string) => {
        setActiveType(type);
        router.get('/search', { q: query, ...(type !== 'all' ? { type } : {}) }, { preserveState: true });
        doSearch(query, type);
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
                            placeholder="Search products, services, needs, doctors, courses..."
                            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            autoFocus
                        />
                    </div>
                    <button type="submit" className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-500">
                        Search
                    </button>
                </form>

                <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Search result types">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            role="tab"
                            aria-selected={activeType === tab.key}
                            onClick={() => selectTab(tab.key)}
                            className={
                                activeType === tab.key
                                    ? 'shrink-0 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white'
                                    : 'shrink-0 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
                            }
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

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
                                            <Image src={item.image_url} alt="" className="h-full w-full object-cover" />
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
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(item.price)}</p>
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
