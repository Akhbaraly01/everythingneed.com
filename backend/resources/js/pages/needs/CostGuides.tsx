import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { Button } from '@/components/shared/Button';
import { useCallback, useEffect, useState } from 'react';
import { BookOpen, RefreshCcw, Search } from 'lucide-react';

interface CostGuide {
    id: string;
    slug: string;
    title: string;
    summary: string;
    price_min: string | null;
    price_max: string | null;
    price_avg: string | null;
    currency: string;
    pricing_unit: string;
    category?: { id: string; name: string; slug: string } | null;
}

interface Paginated<T> {
    data: T[];
    meta: { total: number; current_page: number; last_page: number };
}

function formatRange(g: CostGuide): string {
    if (!g.price_min && !g.price_max) return 'Varies';
    const fmt = (v: string | null) => (v == null ? '' : `$${Number(v).toLocaleString()}`);
    if (g.price_min && g.price_max) return `${fmt(g.price_min)} – ${fmt(g.price_max)}`;
    return fmt(g.price_min) || fmt(g.price_max);
}

export default function CostGuides() {
    const [guides, setGuides] = useState<CostGuide[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [q, setQ] = useState('');

    const load = useCallback((query?: string) => {
        setLoading(true);
        setError(null);
        const params = query ? `?q=${encodeURIComponent(query)}` : '';
        api.get<Paginated<CostGuide>>(`/api/need-cost-guides${params}`)
            .then((res) => setGuides(res.data))
            .catch((e) => {
                setError(errorMessage(e, 'Failed to load cost guides'));
                setGuides([]);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => load(), [load]);

    return (
        <AppLayout title="Cost Guides">
            <Head title="Cost Guides" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cost Guides</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Typical prices by service, compiled from marketplace activity. Use these ranges to budget before posting a request.
                    </p>
                </div>

                <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        load(q.trim() || undefined);
                    }}
                >
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search guides (e.g. plumber, cleaning)..."
                            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                    </div>
                    <Button type="submit" size="sm">Search</Button>
                </form>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : error ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-red-600 font-medium">{error}</p>
                        <Button onClick={() => load()} variant="ghost" size="sm" className="mt-4 gap-2" iconLeft={<RefreshCcw className="h-4 w-4" />}>
                            Retry
                        </Button>
                    </div>
                ) : guides.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">No cost guides found</p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {guides.map((g) => (
                            <Link
                                key={g.id}
                                href={`/needs/cost-guides/${g.slug}`}
                                className="block rounded-lg bg-white p-5 shadow hover:ring-2 hover:ring-blue-500 dark:bg-gray-800"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <h2 className="font-semibold text-gray-900 dark:text-white">{g.title}</h2>
                                    {g.category && (
                                        <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                            {g.category.name}
                                        </span>
                                    )}
                                </div>
                                <p className="mt-2 line-clamp-2 text-sm text-gray-500">{g.summary}</p>
                                <p className="mt-3 text-lg font-bold text-gray-900 dark:text-white">
                                    {formatRange(g)}
                                    <span className="ml-1 text-xs font-normal text-gray-400">
                                        / {g.pricing_unit}
                                    </span>
                                </p>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
