import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { User, Star, MapPin, RefreshCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from '@/components/shared/Image';
import Pagination from '@/components/shared/Pagination';

interface Expert {
    id: string;
    name: string;
    specialty: string;
    bio?: string;
    image_url?: string;
    rating?: number;
    hourly_rate?: number;
    city?: string;
    years_experience?: number;
    is_available?: boolean;
}

interface ExpertsResponse {
    data: Expert[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
}

interface ExpertCategory {
    name: string;
    slug: string;
}

const EMPTY_META = { current_page: 1, last_page: 1, per_page: 15, total: 0 };

const EXPERIENCE_OPTIONS = [
    { value: '', label: 'Any experience' },
    { value: '1', label: '1+ years' },
    { value: '3', label: '3+ years' },
    { value: '5', label: '5+ years' },
    { value: '10', label: '10+ years' },
];

export default function ExpertsIndex() {
    const { url } = usePage();

    const path = useMemo(() => url.split('?')[0] || '/experts', [url]);
    const params = useMemo(() => new URLSearchParams(url.split('?')[1] ?? ''), [url]);
    const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1);
    const specialty = params.get('specialty') ?? '';
    const availableOnly = params.get('available') === '1';
    const experienceMin = params.get('experience_min') ?? '';

    const [experts, setExperts] = useState<Expert[]>([]);
    const [meta, setMeta] = useState(EMPTY_META);
    const [categories, setCategories] = useState<ExpertCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get<{ data: ExpertCategory[] }>('/api/experts/categories')
            .then((res) => setCategories(res.data ?? []))
            .catch(() => setCategories([]));
    }, []);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);

        const query: Record<string, string | number> = { page };
        if (specialty) query.specialty = specialty;
        if (availableOnly) query.available = 1;
        if (experienceMin) query.experience_min = experienceMin;

        api.get<ExpertsResponse>('/api/experts', { params: query })
            .then((res) => {
                setExperts(res.data ?? []);
                setMeta(res.meta ?? { ...EMPTY_META, current_page: page });
            })
            .catch((e) => {
                setError(errorMessage(e, 'Failed to load experts'));
                setExperts([]);
            })
            .finally(() => setLoading(false));
    }, [page, specialty, availableOnly, experienceMin]);

    useEffect(() => { load(); }, [load]);

    const applyFilters = (next: { specialty?: string; available?: boolean; experience_min?: string }) => {
        const query: Record<string, string> = {};

        const nextSpecialty = next.specialty ?? specialty;
        const nextAvailable = next.available ?? availableOnly;
        const nextExperience = next.experience_min ?? experienceMin;

        if (nextSpecialty) query.specialty = nextSpecialty;
        if (nextAvailable) query.available = '1';
        if (nextExperience) query.experience_min = nextExperience;

        router.get(path, query, { preserveState: true });
    };

    const hrefFor = (target: number) => {
        const query = new URLSearchParams();
        query.set('page', String(target));
        if (specialty) query.set('specialty', specialty);
        if (availableOnly) query.set('available', '1');
        if (experienceMin) query.set('experience_min', experienceMin);
        return `${path}?${query.toString()}`;
    };

    return (
        <AppLayout title="Find Experts">
            <Head title="Find Experts" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Find Experts</h1>
                <p className="text-sm text-gray-500">Connect with professionals and consultants</p>

                {/* Filters */}
                <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => applyFilters({ specialty: '' })}
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                                specialty === ''
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                        >
                            All specialties
                        </button>
                        {categories.map((c) => {
                            const active = specialty === c.name;
                            return (
                                <button
                                    key={c.slug || c.name}
                                    type="button"
                                    onClick={() => applyFilters({ specialty: c.name })}
                                    className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                                        active
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    {c.name}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <input
                                type="checkbox"
                                checked={availableOnly}
                                onChange={(e) => applyFilters({ available: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                            />
                            Available now
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Experience</span>
                            <select
                                value={experienceMin}
                                onChange={(e) => applyFilters({ experience_min: e.target.value })}
                                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700"
                            >
                                {EXPERIENCE_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                </div>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : error ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-red-600 font-medium">{error}</p>
                        <button onClick={() => load()} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                            <RefreshCcw className="h-4 w-4" /> Retry
                        </button>
                    </div>
                ) : experts.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <User className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No experts found</h3>
                        <p className="mt-2 text-sm text-gray-500">Try a different specialty or clear the filters.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {experts.map((e) => (
                            <Link key={e.id} href={`/experts/${e.id}`}
                                className="group rounded-lg bg-white p-6 shadow transition hover:shadow-lg dark:bg-gray-800">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100">
                                        {e.image_url ? <Image src={e.image_url} alt="" className="h-full w-full rounded-full object-cover" /> :
                                            <div className="flex h-full items-center justify-center text-gray-400"><User className="h-8 w-8" /></div>}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white">{e.name}</p>
                                        <p className="text-sm text-indigo-600">{e.specialty}</p>
                                    </div>
                                </div>
                                {e.bio && <p className="mt-3 text-sm text-gray-500 line-clamp-2">{e.bio}</p>}
                                <div className="mt-3 flex items-center justify-between text-sm">
                                    {e.city && <span className="flex items-center gap-1 text-gray-400"><MapPin className="h-3 w-3" /> {e.city}</span>}
                                    {e.hourly_rate != null && <span className="font-semibold text-gray-900 dark:text-white">${e.hourly_rate}/hr</span>}
                                </div>
                                {e.rating && <p className="mt-1 flex items-center gap-1 text-xs text-yellow-600"><Star className="h-3 w-3 fill-yellow-400" /> {e.rating}</p>}
                            </Link>
                        ))}
                    </div>
                )}

                <Pagination currentPage={meta.current_page} lastPage={meta.last_page} hrefFor={hrefFor} />
            </div>
        </AppLayout>
    );
}
