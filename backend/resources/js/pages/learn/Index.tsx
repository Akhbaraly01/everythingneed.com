import { Link, router, usePage } from '@inertiajs/react';
import MarketplaceLayout from '@/layouts/MarketplaceLayout';
import type { Course, Enrollment } from '@/types';
import { api, errorMessage } from '@/lib/api';
import { Award, BarChart3, BookOpen, Eye, Heart, MessageCircle, Play, RefreshCcw, Search } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import Image from '@/components/shared/Image';
import CourseCard from '@/components/learn/CourseCard';
import EmptyState from '@/components/shared/EmptyState';
import SeoMeta, { type LearnSeo } from '@/components/learn/SeoMeta';

interface RailCourse {
    id: string;
    title: string;
    category?: string;
    price?: number;
    thumbnail_url?: string | null;
    rating?: number | null;
    students_count?: number | null;
}

interface CategoryChip {
    name: string;
    slug: string;
    courses_count?: number;
}

interface VideoTeaser {
    id: string;
    title: string;
    thumbnail_url?: string | null;
    views_count?: number;
    duration_seconds?: number | null;
    user?: { id: string; name: string };
}

/** One row of the free knowledge feed (GET /api/learn/posts). */
interface FeedPost {
    id: string;
    title: string;
    content: string;
    category?: string | null;
    media_type?: string | null;
    thumbnail_url?: string | null;
    duration_seconds?: number | null;
    views_count?: number;
    likes_count?: number;
    comments_count?: number;
    is_pinned?: boolean;
    created_at: string;
    user?: { id: string; name: string } | null;
}

interface FeedResponse {
    data?: FeedPost[];
    meta?: { has_more?: boolean; next_cursor?: string | null };
}

interface CertificateRow {
    id: string;
    course_title: string;
    certificate_number: string;
    issued_at?: string | null;
}

interface LearnProps {
    /** Laravel paginator serialized by Inertia: `data` + top-level meta. */
    courses: {
        data: Course[];
        total?: number;
        current_page?: number;
        last_page?: number;
        meta?: { total?: number };
    };
    filters?: { category?: string | null; level?: string | null; search?: string | null };
    featured?: RailCourse[];
    popular?: RailCourse[];
    latest?: RailCourse[];
    continueLearning?: (Enrollment & { course?: RailCourse | null })[];
    recommended?: RailCourse[];
    seo?: LearnSeo | null;
}

const LEVELS = ['beginner', 'intermediate', 'advanced'];

/** 1250 -> "1.3K", 26000 -> "26K" (feed meta lines stay one line). */
const compactCount = (value?: number | null): string => {
    if (!value || value < 1) return '0';
    if (value < 1000) return String(value);
    if (value < 10000) return `${(value / 1000).toFixed(1)}K`;
    return `${Math.round(value / 1000)}K`;
};

/** Real duration from the provider: 945 -> 15:45, 31746 -> 8:49:06. */
const formatDuration = (seconds?: number | null): string | null => {
    if (!seconds || seconds < 1) return null;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

const excerptOf = (text: string, max = 200): string => {
    const flat = text.replace(/\s+/g, ' ').trim();
    return flat.length > max ? `${flat.slice(0, max).trimEnd()}…` : flat;
};

function Rail({ title, href, items }: { title: string; href: string; items: RailCourse[] }) {
    if (items.length === 0) return null;
    return (
        <div>
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold">{title}</h2>
                <Link href={href} className="text-sm text-muted-foreground hover:text-foreground">View all</Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((course) => (
                    <CourseCard key={course.id} course={course} />
                ))}
            </div>
        </div>
    );
}

export default function Learn({ courses, filters, featured = [], popular = [], latest = [], continueLearning = [], recommended = [], seo }: LearnProps) {
    const { auth } = usePage().props as { auth?: { user?: { id: string } } };
    const list = courses?.data ?? [];
    const total = courses?.total ?? courses?.meta?.total ?? list.length;

    const [categories, setCategories] = useState<CategoryChip[]>([]);
    const [videos, setVideos] = useState<VideoTeaser[]>([]);
    const [certificates, setCertificates] = useState<CertificateRow[]>([]);
    const [searchInput, setSearchInput] = useState(filters?.search ?? '');
    const [categoryFilter, setCategoryFilter] = useState(filters?.category ?? 'all');
    const [levelFilter, setLevelFilter] = useState(filters?.level ?? 'all');

    // Free knowledge feed (the dominant, free part of Learn).
    const [feed, setFeed] = useState<FeedPost[]>([]);
    const [feedCursor, setFeedCursor] = useState<string | null>(null);
    const [feedHasMore, setFeedHasMore] = useState(false);
    const [feedLoading, setFeedLoading] = useState(true);
    const [feedError, setFeedError] = useState<string | null>(null);
    const [feedRetry, setFeedRetry] = useState(0);

    const loadFeed = useCallback(async () => {
        setFeedLoading(true);
        setFeedError(null);
        try {
            const res = await api.get<FeedResponse>('/api/learn/posts', {
                params: { per_page: 12, sort: 'latest' },
            });
            setFeed(res.data ?? []);
            setFeedHasMore(Boolean(res.meta?.has_more));
            setFeedCursor(res.meta?.next_cursor ?? null);
        } catch (e) {
            setFeed([]);
            setFeedHasMore(false);
            setFeedCursor(null);
            setFeedError(errorMessage(e, 'The free feed could not be loaded.'));
        } finally {
            setFeedLoading(false);
        }
    }, []);

    const loadMoreFeed = useCallback(async () => {
        if (!feedCursor) return;
        setFeedLoading(true);
        setFeedError(null);
        try {
            const res = await api.get<FeedResponse>('/api/learn/posts', {
                params: { per_page: 12, sort: 'latest', cursor: feedCursor },
            });
            setFeed((prev) => [...prev, ...(res.data ?? [])]);
            setFeedHasMore(Boolean(res.meta?.has_more));
            setFeedCursor(res.meta?.next_cursor ?? null);
        } catch (e) {
            setFeedError(errorMessage(e, 'More feed posts could not be loaded.'));
        } finally {
            setFeedLoading(false);
        }
    }, [feedCursor]);

    const retryFeed = () => {
        if (feed.length > 0 && feedCursor) {
            void loadMoreFeed();
        } else {
            setFeedRetry((n) => n + 1);
        }
    };

    useEffect(() => {
        void loadFeed();
    }, [loadFeed, feedRetry]);

    useEffect(() => {
        api.get<{ data: CategoryChip[] }>('/api/course-categories')
            .then((res) => setCategories((res.data ?? []).slice(0, 8)))
            .catch(() => setCategories([]));
        api.get<{ data: VideoTeaser[] }>('/api/learn/posts?type=video&per_page=6&sort=top')
            .then((res) => setVideos(res.data ?? []))
            .catch(() => setVideos([]));
    }, []);

    useEffect(() => {
        if (!auth?.user) return;
        api.get<{ data: CertificateRow[] }>('/api/learn/my-certificates')
            .then((res) => setCertificates(res.data ?? []))
            .catch(() => setCertificates([]));
    }, [auth?.user]);

    const applyFilters = (e: FormEvent) => {
        e.preventDefault();
        const params: Record<string, string> = {};
        if (searchInput.trim()) params.search = searchInput.trim();
        if (categoryFilter && categoryFilter !== 'all') params.category = categoryFilter;
        if (levelFilter && levelFilter !== 'all') params.level = levelFilter;
        router.get('/learn', params, { preserveState: true, preserveScroll: true });
    };

    const handleEnroll = (courseId: string) => {
        if (!auth?.user) {
            router.visit('/login');
            return;
        }
        router.post(`/api/courses/${courseId}/enroll`, {}, {
            preserveScroll: true,
            onSuccess: () => router.visit('/learn/my-learning'),
        });
    };

    const instructorNames = Array.from(
        new Set(list.map((c) => (c as { instructor_name?: string; instructor?: string }).instructor_name ?? (c as { instructor?: string }).instructor).filter(Boolean)),
    ).slice(0, 4) as string[];

    const stats = [
        { label: 'Courses', value: String(total) },
        { label: 'Instructors', value: String(instructorNames.length || new Set(list.map((c) => (c as { category?: string }).category).filter(Boolean)).size) },
        { label: 'Students', value: String(list.reduce((sum, c) => sum + ((c as { students_count?: number }).students_count ?? 0), 0)) },
        {
            label: 'Average Rating',
            value: (() => {
                const rated = list.map((c) => (c as { rating?: number | null }).rating).filter((r): r is number => typeof r === 'number' && r > 0);
                if (!rated.length) return '—';
                return (rated.reduce((a, b) => a + b, 0) / rated.length).toFixed(1);
            })(),
        },
    ];

    return (
        <MarketplaceLayout title={seo?.title ?? 'Learn'}>
            <SeoMeta seo={seo} />
            <div className="container mx-auto px-3 py-4 space-y-6">
                <div className="rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-6 text-white">
                    <h1 className="text-xl md:text-2xl font-bold">Learn New Skills &amp; Advance Your Career</h1>
                    <p className="mt-1 text-sm text-white/80">
                        {total > 0 ? `${total} course${total === 1 ? '' : 's'} to transform your future` : 'Browse courses when they become available'}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Link href="/learn/courses" className="inline-flex h-9 items-center rounded-md bg-white px-4 text-xs font-semibold text-teal-700">
                            Start Learning
                        </Link>
                        <Link href="/learn/certificates" className="inline-flex h-9 items-center rounded-md bg-white/20 px-4 text-xs font-medium text-white hover:bg-white/30">
                            View Certificates
                        </Link>
                        <Link href="/learn/search" className="inline-flex h-9 items-center rounded-md bg-white/20 px-4 text-xs font-medium text-white hover:bg-white/30">
                            Search Courses
                        </Link>
                        <Link href="/learn/categories" className="inline-flex h-9 items-center rounded-md bg-white/20 px-4 text-xs font-medium text-white hover:bg-white/30">
                            Categories
                        </Link>
                        <Link href="/learn/feed" className="inline-flex h-9 items-center rounded-md bg-white/20 px-4 text-xs font-medium text-white hover:bg-white/30">
                            Community
                        </Link>
                    </div>
                </div>

                {/* Spec 15: search / filter */}
                <form onSubmit={applyFilters} className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-56 flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search courses..."
                            aria-label="Search courses"
                            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm"
                        />
                    </div>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        aria-label="Filter by category"
                        className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
                    >
                        <option value="all">All categories</option>
                        {categoryFilter !== 'all' && categoryFilter !== null && categoryFilter !== '' && !categories.some((c) => c.name === categoryFilter) && (
                            <option value={categoryFilter}>{categoryFilter}</option>
                        )}
                        {categories.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
                    </select>
                    <select
                        value={levelFilter}
                        onChange={(e) => setLevelFilter(e.target.value)}
                        aria-label="Filter by level"
                        className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
                    >
                        <option value="all">All levels</option>
                        {levelFilter !== 'all' && levelFilter !== null && levelFilter !== '' && !LEVELS.includes(levelFilter) && (
                            <option value={levelFilter}>{levelFilter}</option>
                        )}
                        {LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
                    </select>
                    <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                        Apply
                    </button>
                    {(searchInput || (categoryFilter && categoryFilter !== 'all') || (levelFilter && levelFilter !== 'all')) && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchInput('');
                                setCategoryFilter('all');
                                setLevelFilter('all');
                                router.get('/learn', {}, { preserveState: true, preserveScroll: true });
                            }}
                            className="text-sm text-muted-foreground underline hover:text-foreground"
                        >
                            Clear
                        </button>
                    )}
            </form>

            {/* Free knowledge feed: video/text posts (free) - the main part of Learn. */}
            <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold">Free knowledge feed</h2>
                        <p className="text-sm text-muted-foreground">
                            Free videos and guides from the community - watch and read without paying.
                        </p>
                    </div>
                    <Link href="/learn/feed" className="shrink-0 text-sm text-muted-foreground hover:text-foreground">
                        Open full feed
                    </Link>
                </div>

                {feedError && (
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3">
                        <p className="text-sm font-medium text-destructive">{feedError}</p>
                        <button
                            type="button"
                            onClick={retryFeed}
                            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                        >
                            <RefreshCcw className="h-3.5 w-3.5" /> Try again
                        </button>
                    </div>
                )}

                {feedLoading && feed.length === 0 && !feedError ? (
                    <p className="text-sm text-muted-foreground">Loading the feed...</p>
                ) : feed.length === 0 && !feedError ? (
                    <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                        No posts have been approved yet. Share something useful from the community feed.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {feed.map((post) => {
                            const duration = formatDuration(post.duration_seconds);
                            return (
                                <Link
                                    key={post.id}
                                    href={`/learn/watch/${post.id}`}
                                    className="group flex gap-4 rounded-xl border border-border bg-card p-3 transition hover:border-primary/40 hover:shadow-md"
                                >
                                    <div className="relative w-36 shrink-0 sm:w-56">
                                        {post.media_type === 'video' && post.thumbnail_url ? (
                                            <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                                                <Image src={post.thumbnail_url} alt={post.title} className="h-full w-full object-cover" />
                                                <span className="absolute inset-0 flex items-center justify-center">
                                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white">
                                                        <Play className="h-4 w-4" />
                                                    </span>
                                                </span>
                                                {duration && (
                                                    <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1 py-0.5 text-[10px] font-medium text-white">
                                                        {duration}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex aspect-video flex-col justify-between rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 p-3 dark:from-slate-800 dark:to-slate-700">
                                                <BookOpen className="h-5 w-5 text-muted-foreground" />
                                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Text guide
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start gap-2">
                                            <h3 className="line-clamp-2 font-semibold transition group-hover:text-primary">
                                                {post.title}
                                            </h3>
                                            {post.is_pinned && (
                                                <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                                    Pinned
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{excerptOf(post.content)}</p>
                                        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                            <span>{post.user?.name ?? 'Learner'}</span>
                                            {post.category && <span className="capitalize">{post.category}</span>}
                                            <span className="inline-flex items-center gap-1">
                                                <Eye className="h-3 w-3" /> {compactCount(post.views_count)} views
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                                <Heart className="h-3 w-3" /> {compactCount(post.likes_count)}
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                                <MessageCircle className="h-3 w-3" /> {compactCount(post.comments_count)}
                                            </span>
                                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                                        </p>
                                    </div>
                                </Link>
                            );
                        })}

                        {feedHasMore && (
                            <button
                                type="button"
                                onClick={() => void loadMoreFeed()}
                                disabled={feedLoading}
                                className="w-full rounded-lg border border-border bg-card py-2.5 text-sm font-semibold transition hover:border-primary hover:text-primary disabled:opacity-60"
                            >
                                {feedLoading ? 'Loading more posts...' : 'Show more free posts'}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Spec 15: categories */}
                <div>
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-lg font-bold">Categories</h2>
                        <Link href="/learn/categories" className="text-sm text-muted-foreground hover:text-foreground">View all</Link>
                    </div>
                    {categories.length === 0 ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">No categories yet.</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {categories.map((category) => (
                                <Link
                                    key={category.slug}
                                    href={`/learn/categories/${category.slug}`}
                                    className="rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-primary hover:text-primary"
                                >
                                    {category.name}
                                    {category.courses_count != null ? ` (${category.courses_count})` : ''}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {continueLearning.length > 0 && (
                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-lg font-bold">Continue Learning</h2>
                            <Link href="/learn/my-learning" className="text-sm text-muted-foreground hover:text-foreground">My learning</Link>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {continueLearning.map((enrollment) => (
                                <Link key={enrollment.id} href={`/learn/${enrollment.course_id}`}
                                    className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md">
                                    <p className="font-semibold line-clamp-1">{enrollment.course?.title ?? 'Course'}</p>
                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                                        <div className="h-full rounded-full bg-primary" style={{ width: `${enrollment.progress ?? 0}%` }} />
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">{enrollment.progress ?? 0}% complete</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                <Rail title="Featured Courses" href="/learn/courses" items={featured} />
                <Rail title="Popular Courses" href="/learn/courses" items={popular} />
                <Rail title="Latest Courses" href="/learn/courses" items={latest} />

                {/* Spec 15: videos (approved knowledge videos from the feed) */}
                <div>
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-lg font-bold">Videos</h2>
                        <Link href="/learn/feed?type=video" className="text-sm text-muted-foreground hover:text-foreground">View all</Link>
                    </div>
                    {videos.length === 0 ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">No videos published yet.</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {videos.map((video) => (
                                <Link key={video.id} href={`/learn/watch/${video.id}`}
                                    className="overflow-hidden rounded-xl border border-border bg-card shadow-sm hover:shadow-md">
                                    <div className="relative aspect-video bg-muted">
                                        {video.thumbnail_url && (
                                            <Image src={video.thumbnail_url} alt={video.title} className="h-full w-full object-cover" loading="lazy" />
                                        )}
                                        <span className="absolute inset-0 flex items-center justify-center">
                                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white">
                                                <Play className="h-5 w-5" />
                                            </span>
                                        </span>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold line-clamp-2">{video.title}</h3>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {video.user?.name ?? 'Creator'}
                                            {video.views_count != null ? ` · ${video.views_count} views` : ''}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <Rail title="Recommended For You" href="/learn/courses" items={recommended} />

                {/* Spec 15: certificates */}
                <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="flex items-center gap-2 text-lg font-bold">
                                <Award className="h-5 w-5 text-primary" /> Certificates
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Finish every lesson in a course and your completion certificate is issued with a verifiable code.
                                {auth?.user
                                    ? certificates.length > 0
                                        ? ` You have earned ${certificates.length} certificate${certificates.length === 1 ? '' : 's'}.`
                                        : ' You have not earned one yet - keep learning.'
                                    : ''}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Link href="/learn/certificates" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
                                My certificates
                            </Link>
                            <Link href="/learn/courses" className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary">
                                Browse courses
                            </Link>
                        </div>
                    </div>
                    {certificates.length > 0 && (
                        <ul className="mt-4 space-y-2">
                            {certificates.slice(0, 3).map((certificate) => (
                                <li key={certificate.id}>
                                    <Link href={`/learn/certificates/${certificate.id}`}
                                        className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm hover:border-primary hover:text-primary">
                                        <span className="font-medium">{certificate.course_title}</span>
                                        <span className="text-xs text-muted-foreground">{certificate.certificate_number}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Spec 15: learning statistics */}
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{total} courses available</p>
                    <Link href="/learn/progress" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                        <BarChart3 className="h-4 w-4" /> My progress
                    </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {stats.map((s) => (
                        <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center">
                            <p className="text-xl font-bold text-primary">{s.value}</p>
                            <p className="text-xs text-muted-foreground">{s.label}</p>
                        </div>
                    ))}
                </div>

                <div>
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-lg font-bold">Instructors</h2>
                        <Link href="/learn/instructors" className="text-sm text-muted-foreground hover:text-foreground">View all instructors</Link>
                    </div>
                    {instructorNames.length === 0 ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">No instructors listed yet.</p>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {instructorNames.map((name) => (
                                <div key={name} className="rounded-xl border border-border bg-card p-4 text-center">
                                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                        {name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                                    </div>
                                    <p className="text-sm font-semibold line-clamp-1">{name}</p>
                                    <p className="text-xs text-muted-foreground">Instructor</p>
                                    <Link
                                        href={`/learn/instructors/${encodeURIComponent(name)}`}
                                        className="mt-3 inline-flex h-8 items-center rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground"
                                    >
                                        View
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((course) => (
                        <CourseCard
                            key={course.id}
                            course={course}
                            action={
                                <button
                                    type="button"
                                    onClick={() => handleEnroll(course.id)}
                                    className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                                >
                                    Enroll
                                </button>
                            }
                        />
                    ))}
                </div>

                {list.length === 0 && (
                    <EmptyState
                        icon={<BookOpen className="h-10 w-10" />}
                        title="No courses yet. Check back soon."
                    />
                )}
            </div>
        </MarketplaceLayout>
    );
}
