import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { type WorkerProfile } from '@/types';
import { formatCurrency, getInitials } from '@/lib/utils';
import {
    Search, MapPin, Star, BadgeCheck, Clock, Briefcase,
    SlidersHorizontal, ChevronLeft, ChevronRight,
} from 'lucide-react';

interface CategoryCount {
    category: string;
    workers_count: number;
}

interface Props {
    workers: { data: WorkerProfile[]; current_page: number; last_page: number; total: number };
    categories: CategoryCount[];
    filters: { q?: string; category?: string; availability?: string; city?: string; sort?: string };
}

const availabilityStyles: Record<string, string> = {
    available: 'bg-green-100 text-green-800',
    busy: 'bg-amber-100 text-amber-800',
    unavailable: 'bg-red-100 text-red-700',
};

export default function JobSeekersIndex({ workers, categories, filters }: Props) {
    const [q, setQ] = useState(filters.q ?? '');
    const [showFilters, setShowFilters] = useState(false);

    const applyFilter = (patch: Record<string, string | undefined>) => {
        const next = new URLSearchParams();
        const merged = { ...filters, ...patch, q: patch.q !== undefined ? patch.q : undefined };
        Object.entries({ ...filters, ...patch }).forEach(([k, v]) => {
            if (v) next.set(k, v);
        });
        router.get('/job-seekers', Object.fromEntries(next), { preserveState: true });
    };

    return (
        <AppLayout title="Job Seekers">
            <Head title="Job Seekers" />
            <div className="mx-auto max-w-7xl px-4 py-8">
                {/* Header */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Find Skilled Workers</h1>
                        <p className="text-sm text-gray-500">{workers.total} verified professionals across {categories.length} categories</p>
                    </div>
                    <Link
                        href="/job-seekers/my-requests"
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                        My Requests
                    </Link>
                </div>

                {/* Search + filter toggle */}
                <div className="mb-4 flex gap-2">
                    <form
                        className="relative flex-1"
                        onSubmit={(e) => { e.preventDefault(); applyFilter({ q }); }}
                    >
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search by headline, bio or city…"
                            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                    </form>
                    <button
                        onClick={() => setShowFilters((v) => !v)}
                        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                        <SlidersHorizontal className="h-4 w-4" /> Filters
                    </button>
                </div>

                {/* Filters panel */}
                {showFilters && (
                    <div className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-4 dark:border-gray-700 dark:bg-gray-800">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Category</label>
                            <select
                                value={filters.category ?? ''}
                                onChange={(e) => applyFilter({ category: e.target.value || undefined })}
                                className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">All categories</option>
                                {categories.map((c) => (
                                    <option key={c.category} value={c.category}>{c.category} ({c.workers_count})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Availability</label>
                            <select
                                value={filters.availability ?? ''}
                                onChange={(e) => applyFilter({ availability: e.target.value || undefined })}
                                className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">Any</option>
                                <option value="available">Available now</option>
                                <option value="busy">Busy</option>
                                <option value="unavailable">Unavailable</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Sort by</label>
                            <select
                                value={filters.sort ?? 'rating'}
                                onChange={(e) => applyFilter({ sort: e.target.value })}
                                className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="rating">Top rated</option>
                                <option value="rate_low">Rate (low first)</option>
                                <option value="rate_high">Rate (high first)</option>
                                <option value="newest">Newest</option>
                            </select>
                        </div>
                        <button
                            onClick={() => router.get('/job-seekers', {}, { preserveState: true })}
                            className="self-end rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                        >
                            Reset all
                        </button>
                    </div>
                )}

                {/* Grid */}
                {workers.data.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 p-16 text-center dark:border-gray-600">
                        <Briefcase className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                        <p className="font-medium text-gray-900 dark:text-white">No workers match your filters</p>
                        <p className="text-sm text-gray-500">Try widening your search or clearing filters.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {workers.data.map((worker) => (
                            <Link
                                key={worker.id}
                                href={`/job-seekers/${worker.id}`}
                                className="group rounded-xl border border-gray-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                            >
                                <div className="mb-3 flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                                            {getInitials(worker.user?.name ?? 'W')}
                                        </span>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">{worker.user?.name}</p>
                                            <p className="text-xs text-gray-500">{worker.category}</p>
                                        </div>
                                    </div>
                                    {worker.is_verified && <BadgeCheck className="h-5 w-5 text-blue-500" />}
                                </div>

                                <p className="mb-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{worker.headline}</p>

                                <div className="mb-3 flex flex-wrap gap-1.5">
                                    {(worker.skills ?? []).slice(0, 3).map((s) => (
                                        <span key={s.name} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                            {s.name}
                                        </span>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1 font-medium text-gray-900 dark:text-white">
                                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> {Number(worker.rating_avg).toFixed(1)}
                                            <span className="text-xs font-normal text-gray-400">({worker.rating_count})</span>
                                        </span>
                                        <span className="flex items-center gap-1 text-gray-500"><MapPin className="h-3.5 w-3.5" />{worker.city}</span>
                                    </div>
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${availabilityStyles[worker.availability]}`}>
                                        {worker.availability}
                                    </span>
                                </div>

                                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700">
                                    <span className="text-sm font-bold text-indigo-600">
                                        {worker.hourly_rate ? `${formatCurrency(worker.hourly_rate)}/hr` : 'Rate on request'}
                                    </span>
                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                        <Clock className="h-3.5 w-3.5" /> {worker.completed_jobs} jobs done
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {workers.last_page > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-2">
                        {Array.from({ length: workers.last_page }, (_, i) => i + 1).map((pageNo) => (
                            <button
                                key={pageNo}
                                onClick={() => applyFilter({})}
                                disabled
                                className="hidden"
                            />
                        ))}
                        <Link
                            href={workers.current_page > 1 ? `/job-seekers?page=${workers.current_page - 1}` : '#'}
                            preserveState
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Link>
                        <span className="px-3 text-sm text-gray-600 dark:text-gray-300">
                            Page {workers.current_page} of {workers.last_page}
                        </span>
                        <Link
                            href={workers.current_page < workers.last_page ? `/job-seekers?page=${workers.current_page + 1}` : '#'}
                            preserveState
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
