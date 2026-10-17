import { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import { Star, Users, Calendar, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/use-language';

export interface ShowcaseExpert {
    id: string | number;
    name: string;
    role: string;
    link: string;
    rating?: number;
    source?: string;
}

interface ExpertsApiResponse {
    data: {
        id: string;
        full_name?: string;
        name?: string;
        specialization?: string;
        role?: string;
        rating?: number | string;
    }[];
}

interface ExpertsShowcaseProps {
    experts?: ShowcaseExpert[];
    title?: string;
    limit?: number;
    viewAllHref?: string;
}

const SOURCE_FALLBACK_LINK: Record<string, string> = {
    healthcare: '/healthcare/doctors',
    learning: '/learn',
    needs: '/experts',
};

export default function ExpertsShowcase({
    experts,
    title = 'Top Experts',
    limit = 8,
    viewAllHref = '/experts',
}: ExpertsShowcaseProps) {
    const [fetched, setFetched] = useState<ShowcaseExpert[]>([]);
    const [index, setIndex] = useState(0);
    const [perView, setPerView] = useState(2);
    const [paused, setPaused] = useState(false);
    const { t } = useLanguage();

    useEffect(() => {
        if (experts && experts.length > 0) return;
        api.get<ExpertsApiResponse>('/api/experts', { params: { per_page: limit, available: true } })
            .then((res) => {
                setFetched(
                    (res.data ?? []).map((e) => ({
                        id: e.id,
                        name: e.full_name ?? e.name ?? 'Expert',
                        role: e.specialization ?? e.role ?? 'Professional',
                        link: `/experts/${e.id}`,
                        rating: typeof e.rating === 'string' ? Number(e.rating) : e.rating,
                        source: 'healthcare',
                    })),
                );
            })
            .catch(() => setFetched([]));
    }, [experts, limit]);

    const list = (experts && experts.length > 0 ? experts : fetched).slice(0, limit);
    const maxIndex = Math.max(0, list.length - perView);

    // Two cards first on mobile, four on desktop.
    useEffect(() => {
        const query = window.matchMedia('(min-width: 768px)');
        const sync = () => setPerView(query.matches ? 4 : 2);
        sync();
        query.addEventListener('change', sync);
        return () => query.removeEventListener('change', sync);
    }, []);

    useEffect(() => {
        setIndex((prev) => Math.min(prev, maxIndex));
    }, [maxIndex]);

    // Dynamically sliding showcase (pauses on hover/touch, respects
    // reduced motion). Everything stays reachable via dots + View All.
    useEffect(() => {
        if (paused || list.length <= perView) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const interval = setInterval(() => {
            setIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
        }, 4000);
        return () => clearInterval(interval);
    }, [paused, list.length, perView, maxIndex]);

    if (list.length === 0) return null;

    const goPrev = () => {
        setPaused(true);
        setIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
    };
    const goNext = () => {
        setPaused(true);
        setIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    };

    return (
        <section
            data-testid="experts-showcase"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
        >
            <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <h2 className="text-base font-bold md:text-lg">{title}</h2>
                </div>
                <div className="flex items-center gap-2">
                    {list.length > perView && (
                        <div className="flex gap-1">
                            <button
                                type="button"
                                onClick={goPrev}
                                aria-label={t('common.previous')}
                                className="icon-glass-3d !h-7 !w-7"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={goNext}
                                aria-label={t('common.next')}
                                className="icon-glass-3d !h-7 !w-7"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                    <Link
                        href={viewAllHref}
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                        {t('common.viewAll')} <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>

            <div className="overflow-hidden">
                <div
                    className="flex gap-3 transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${index * (100 / perView)}%)` }}
                    data-testid="experts-track"
                >
                    {list.map((expert) => (
                        <div
                            key={`${expert.source ?? 'expert'}-${expert.id}`}
                            className="min-w-[calc(50%-6px)] shrink-0 md:min-w-[calc(25%-9px)]"
                        >
                            <div className="rounded-xl border border-border bg-card p-4 text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-lg">
                                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                    {expert.name
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')
                                        .slice(0, 2)}
                                </div>
                                <p className="line-clamp-1 text-sm font-semibold">{expert.name}</p>
                                <p className="line-clamp-1 text-xs text-muted-foreground">{expert.role}</p>

                                {expert.rating !== undefined && (
                                    <div className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                        {Number(expert.rating).toFixed(1)}
                                        <span className="mx-1">{'\u00b7'}</span>
                                        <Users className="h-3 w-3" />
                                    </div>
                                )}

                                <div className="mt-3 flex gap-1">
                                    <Link
                                        href={expert.link}
                                        className="flex h-8 flex-1 items-center justify-center gap-1 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground"
                                    >
                                        <Calendar className="h-3 w-3" /> {t('home.book')}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {list.length > perView && (
                <div className="mt-3 flex justify-center gap-1.5">
                    {Array.from({ length: maxIndex + 1 }, (_, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => {
                                setPaused(true);
                                setIndex(i);
                            }}
                            aria-label={`Show experts page ${i + 1}`}
                            className={`h-1.5 rounded-full transition-all ${
                                i === index ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'
                            }`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

export { SOURCE_FALLBACK_LINK };
