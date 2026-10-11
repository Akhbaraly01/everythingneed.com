import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { HeartHandshake } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import EmptyState from '@/components/shared/EmptyState';
import LoadingState, { ErrorState } from '@/components/shared/LoadingState';

interface AidRequest {
    id: string;
    title: string;
    description: string;
    category?: string | null;
    goal_amount: number;
    raised_amount: number;
    currency: string;
    status: string;
    requester?: { id?: string; name?: string } | null;
    created_at: string;
}

const CATEGORIES = ['', 'medical', 'emergency', 'medication', 'transport', 'other'];

export default function Aid() {
    const [aids, setAids] = useState<AidRequest[]>([]);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);
    const [category, setCategory] = useState('');
    const [q, setQ] = useState('');

    const load = useCallback(
        (pageToLoad: number, append: boolean) => {
            if (append) setLoadingMore(true);
            else setLoading(true);
            setError(null);
            const params = new URLSearchParams({ per_page: '12', page: String(pageToLoad) });
            if (category) params.set('category', category);
            if (q.trim()) params.set('q', q.trim());
            api.get<{ data: AidRequest[]; current_page: number; last_page: number }>(
                `/api/health/aid?${params.toString()}`
            )
                .then((res) => {
                    const rows = Array.isArray(res.data) ? res.data : [];
                    setAids((prev) => (append ? [...prev, ...rows] : rows));
                    setPage(res.current_page ?? pageToLoad);
                    setLastPage(res.last_page ?? 1);
                })
                .catch((e) => setError(errorMessage(e, 'Failed to load aid requests')))
                .finally(() => {
                    setLoading(false);
                    setLoadingMore(false);
                });
        },
        [category, q]
    );

    useEffect(() => {
        load(1, false);
    }, [attempt, load]);

    return (
        <AppLayout title="Healthcare Aid">
            <Head title="Healthcare Aid" />
            <div className="mx-auto max-w-4xl space-y-6">
                <div>
                    <Link href="/healthcare" className="text-sm text-indigo-600 hover:underline">← Back to Healthcare</Link>
                    <div className="mt-1 flex flex-wrap gap-2 text-sm">
                        <Link href="/healthcare/bookings" className="font-medium text-indigo-600 hover:underline">Health Bookings</Link>
                        <Link href="/healthcare/labs" className="font-medium text-indigo-600 hover:underline">Laboratory</Link>
                        <Link href="/healthcare/documents" className="font-medium text-indigo-600 hover:underline">Documentation</Link>
                    </div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Community-funded assistance for medical needs. Every request is reviewed by
                        support before it appears here.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <input
                        type="search"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search aid requests..."
                        className="w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                        {CATEGORIES.map((c) => (
                            <option key={c || 'all'} value={c}>
                                {c ? c.charAt(0).toUpperCase() + c.slice(1) : 'All categories'}
                            </option>
                        ))}
                    </select>
                    <Link
                        href="/healthcare/aid/mine"
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        My requests
                    </Link>
                </div>

                {loading ? (
                    <LoadingState message="Loading aid requests..." />
                ) : error ? (
                    <ErrorState message={error} onRetry={() => setAttempt((n) => n + 1)} />
                ) : aids.length === 0 ? (
                    <EmptyState
                        icon={<HeartHandshake className="h-10 w-10" />}
                        title="No approved aid requests"
                        hint="Approved requests from the community will appear here."
                    >
                        <Link href="/healthcare/aid/mine" className="mt-2 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                            Request assistance
                        </Link>
                    </EmptyState>
                ) : (
                    <>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {aids.map((aid) => {
                                const pct =
                                    Number(aid.goal_amount) > 0
                                        ? Math.min(100, Math.round((Number(aid.raised_amount) / Number(aid.goal_amount)) * 100))
                                        : 0;
                                return (
                                    <Link
                                        key={aid.id}
                                        href={`/healthcare/aid/${aid.id}`}
                                        className="rounded-lg bg-white p-5 shadow hover:shadow-md dark:bg-gray-800"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                                {aid.title}
                                            </h2>
                                            <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium capitalize text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                                {aid.status}
                                            </span>
                                        </div>
                                        {aid.category && (
                                            <p className="mt-1 text-xs capitalize text-gray-500">{aid.category}</p>
                                        )}
                                        <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                                            {aid.description}
                                        </p>
                                        <div className="mt-3">
                                            <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700">
                                                <div
                                                    className="h-2 rounded-full bg-indigo-600"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <p className="mt-1.5 text-xs text-gray-500">
                                                {formatPrice(Number(aid.raised_amount), aid.currency)} raised of{' '}
                                                {formatPrice(Number(aid.goal_amount), aid.currency)} goal
                                            </p>
                                        </div>
                                        {aid.requester?.name && (
                                            <p className="mt-2 text-xs text-gray-400">by {aid.requester.name}</p>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                        {page < lastPage && (
                            <div className="text-center">
                                <button
                                    onClick={() => load(page + 1, true)}
                                    disabled={loadingMore}
                                    className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    {loadingMore ? 'Loading...' : 'Show more'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
