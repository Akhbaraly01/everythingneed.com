import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import { Play, FileText, BookOpen, ArrowLeft, ArrowRight } from 'lucide-react';

interface HealthItem {
    id: string | number;
    title: string;
    summary?: string | null;
    description?: string | null;
    url?: string | null;
    specialty?: string | null;
}

interface SectionState {
    items: HealthItem[];
    total: number;
    page: number;
    lastPage: number;
    loading: boolean;
}

const EMPTY_SECTION: SectionState = { items: [], total: 0, page: 0, lastPage: 1, loading: true };

const SECTIONS = [
    { key: 'videos', title: 'Videos', icon: Play, api: '/api/healthcare/videos', allHref: '/healthcare/videos', blurb: 'Watch health explainers and guides.' },
    { key: 'documents', title: 'Documents', icon: FileText, api: '/api/healthcare/documents', allHref: null as string | null, blurb: 'Downloadable health documents and forms.' },
    { key: 'guides', title: 'Prevention Guides', icon: BookOpen, api: '/api/healthcare/prevention-guides', allHref: '/healthcare/guides', blurb: 'Read prevention and wellness guides.' },
] as const;

const PER_PAGE = 4;

export default function Documentation() {
    const [sections, setSections] = useState<Record<string, SectionState>>({
        videos: { ...EMPTY_SECTION },
        documents: { ...EMPTY_SECTION },
        guides: { ...EMPTY_SECTION },
    });

    const loadSection = (key: string, page: number, append: boolean) => {
        const def = SECTIONS.find((s) => s.key === key);
        if (!def) return;
        setSections((prev) => ({ ...prev, [key]: { ...prev[key], loading: true } }));
        api.get<{ data: HealthItem[]; meta?: { total?: number; last_page?: number; current_page?: number } }>(
            `${def.api}?per_page=${PER_PAGE}&page=${page}`
        )
            .then((res) => {
                const items = Array.isArray(res?.data) ? res.data : [];
                setSections((prev) => ({
                    ...prev,
                    [key]: {
                        items: append ? [...prev[key].items, ...items] : items,
                        total: res?.meta?.total ?? (append ? prev[key].total : items.length),
                        page,
                        lastPage: res?.meta?.last_page ?? 1,
                        loading: false,
                    },
                }));
            })
            .catch(() => {
                setSections((prev) => ({
                    ...prev,
                    [key]: append ? { ...prev[key], loading: false } : { ...EMPTY_SECTION, loading: false },
                }));
            });
    };

    useEffect(() => {
        SECTIONS.forEach((s) => loadSection(s.key, 1, false));
    }, []);
    return (
        <AppLayout title="Documentation">
            <Head title="Documentation" />
            <div className="mx-auto max-w-4xl space-y-8 px-4 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                            <FileText className="h-5 w-5 text-primary" /> Documentation
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">User guides for healthcare services — videos, documents and prevention guides.</p>
                    </div>
                    <Link href="/healthcare" className="inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" /> Healthcare
                    </Link>
                </div>

                {SECTIONS.map((s) => {
                    const state = sections[s.key];
                    const Icon = s.icon;
                    return (
                        <section key={s.key} aria-label={s.title}>
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <Icon className="h-5 w-5 text-primary" />
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{s.title}</h2>
                                    {state.total > 0 && (
                                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                            {state.total}
                                        </span>
                                    )}
                                </div>
                                {s.allHref ? (
                                    <Link href={s.allHref} className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline">
                                        View all <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                ) : null}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{s.blurb}</p>

                            {state.loading && state.items.length === 0 ? (
                                <p className="py-6 text-center text-sm text-muted-foreground">Loading...</p>
                            ) : state.items.length === 0 ? (
                                <div className="mt-3 rounded-lg border border-dashed p-8 text-center">
                                    <Icon className="mx-auto h-8 w-8 text-muted-foreground" />
                                    <p className="mt-2 text-sm text-muted-foreground">No {s.title.toLowerCase()} published yet.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                        {state.items.map((item) => (
                                            <article key={item.id} className="rounded-lg border border-border bg-card p-4 shadow-sm">
                                                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">{item.title}</h3>
                                                {item.summary || item.description ? (
                                                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                                                        {item.summary || item.description}
                                                    </p>
                                                ) : null}
                                                {item.specialty ? (
                                                    <p className="mt-2 text-xs text-primary">{item.specialty}</p>
                                                ) : null}
                                                {item.url ? (
                                                    <a
                                                        href={item.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mt-3 inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground"
                                                    >
                                                        Open
                                                    </a>
                                                ) : null}
                                            </article>
                                        ))}
                                    </div>
                                    {!s.allHref && state.page < state.lastPage && (
                                        <button
                                            onClick={() => loadSection(s.key, state.page + 1, true)}
                                            disabled={state.loading}
                                            className="mt-3 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-gray-600"
                                        >
                                            {state.loading ? 'Loading...' : 'Load more documents'}
                                        </button>
                                    )}
                                </>
                            )}
                        </section>
                    );
                })}

                <div className="flex flex-wrap gap-2 text-sm">
                    <span className="text-gray-500">Also see:</span>
                    <Link href="/healthcare/bookings" className="font-medium text-indigo-600 hover:underline">Health Bookings</Link>
                    <Link href="/healthcare/aid" className="font-medium text-indigo-600 hover:underline">Healthcare Aid</Link>
                    <Link href="/healthcare/labs" className="font-medium text-indigo-600 hover:underline">Laboratory</Link>
                </div>
            </div>
        </AppLayout>
    );
}
