import { useCallback, useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import { iconForSlug, verticalFor, VERTICALS } from '@/lib/verticals';
import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react';

interface RequestType {
    id: string;
    title: string;
    subtitle: string;
    icon: LucideIcon;
    gradient: string;
    link: string;
}

/** The request types every shopper can start from. */
const fallbackTypes: RequestType[] = VERTICALS.filter((vertical) =>
    ['product', 'worker', 'building', 'agriculture', 'general', 'services'].includes(vertical.slug),
).map((vertical) => ({
    id: vertical.slug,
    title: vertical.name,
    subtitle: vertical.blurb,
    icon: vertical.icon,
    gradient: vertical.gradient,
    link: vertical.href,
}));

const CATEGORY_GRADIENTS = [
    'from-blue-500 to-indigo-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-slate-500 to-gray-700',
    'from-green-500 to-emerald-600',
    'from-purple-500 to-violet-600',
    'from-cyan-500 to-teal-600',
];

interface NeedCategory {
    id: string | number;
    name: string;
    slug?: string;
    description?: string | null;
}

import { useLanguage } from '@/lib/use-language';

export default function NeedCarousel() {
    const { t } = useLanguage();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [itemsPerView, setItemsPerView] = useState(2);
    const [requestTypes, setRequestTypes] = useState<RequestType[]>(fallbackTypes);

    useEffect(() => {
        let cancelled = false;
        api.get<{ data: NeedCategory[] | null }>('/api/need-categories')
            .then((payload) => {
                if (cancelled) return;
                const rows: NeedCategory[] = Array.isArray(payload?.data) ? payload.data : [];
                if (rows.length === 0) return;
                setRequestTypes(
                    rows.slice(0, 10).map((c, i) => {
                        const key = (c.slug || String(c.name)).toLowerCase();
                        const vertical = verticalFor(key);

                        return {
                            id: String(c.id),
                            title: c.name,
                            // The admin description wins; otherwise the
                            // vertical pitch; otherwise a translated prompt.
                            subtitle:
                                c.description ||
                                vertical?.blurb ||
                                t('needs.requestCategory', {
                                    name: c.name,
                                    defaultValue: `Request ${c.name}`,
                                }),
                            // The icon belongs to the category, not to its
                            // position in the carousel.
                            icon: vertical?.icon ?? iconForSlug(key, c.name),
                            gradient:
                                vertical?.gradient ??
                                CATEGORY_GRADIENTS[i % CATEGORY_GRADIENTS.length],
                            link: vertical?.href ?? `/needs/request?category=${encodeURIComponent(key)}`,
                        };
                    }),
                );
            })
            .catch(() => {
                if (!cancelled) setRequestTypes(fallbackTypes);
            });
        return () => {
            cancelled = true;
        };
    }, [t]);

    useEffect(() => {
        const query = window.matchMedia('(min-width: 768px)');
        const sync = () => setItemsPerView(query.matches ? 4 : 2);
        sync();
        query.addEventListener('change', sync);
        return () => query.removeEventListener('change', sync);
    }, []);

    const maxIndex = Math.max(0, requestTypes.length - itemsPerView);
    const step = 100 / itemsPerView;

    useEffect(() => {
        setCurrentIndex((prev) => Math.min(prev, maxIndex));
    }, [maxIndex]);

    const goNext = useCallback(() => {
        setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, [maxIndex]);

    const goPrev = useCallback(() => {
        setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
    }, [maxIndex]);

    useEffect(() => {
        if (!isAutoPlaying) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const interval = setInterval(goNext, 4000);
        return () => clearInterval(interval);
    }, [isAutoPlaying, goNext]);

    return (
        <section
            data-testid="home-need-carousel"
            className="py-4"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
            onTouchStart={() => setIsAutoPlaying(false)}
            onTouchEnd={() => setIsAutoPlaying(true)}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        {t('home.submitNeed')}
                    </h3>
                    <div
                        className={`h-2 w-2 rounded-full transition-colors ${
                            isAutoPlaying ? 'bg-green-500 animate-pulse' : 'bg-muted'
                        }`}
                    />
                </div>
                <div className="flex gap-1">
                    <button
                        type="button"
                        aria-label={t('common.previous')}
                        className="icon-glass-3d !h-7 !w-7"
                        onClick={() => {
                            setIsAutoPlaying(false);
                            goPrev();
                        }}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        aria-label={t('common.next')}
                        className="icon-glass-3d !h-7 !w-7"
                        onClick={() => {
                            setIsAutoPlaying(false);
                            goNext();
                        }}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="overflow-hidden">
                <div
                    className="flex gap-2 transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${currentIndex * step}%)` }}
                >
                    {requestTypes.map((request) => (
                        <Link key={request.id} href={request.link} className="min-w-[48%] md:min-w-[24%]">
                            <div
                                className={`bg-gradient-to-br ${request.gradient} rounded-lg p-3 h-20 flex items-center gap-3 hover:scale-[1.02] transition-transform shadow-md hover:shadow-lg`}
                            >
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm shrink-0">
                                    <request.icon className="h-5 w-5 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-white truncate">{request.title}</p>
                                    <p className="text-[10px] text-white/70 line-clamp-2">{request.subtitle}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="flex justify-center gap-1.5 mt-3">
                {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                    <button
                        key={idx}
                        type="button"
                        aria-label={`Go to need page ${idx + 1}`}
                        onClick={() => {
                            setCurrentIndex(idx);
                            setIsAutoPlaying(false);
                        }}
                        className="relative h-1.5 rounded-full overflow-hidden transition-all"
                        style={{ width: idx === currentIndex ? '24px' : '8px' }}
                    >
                        <div className="absolute inset-0 bg-muted-foreground/30" />
                        {idx === currentIndex && (
                            <div
                                className="absolute inset-0 bg-primary origin-left"
                                style={{
                                    animation: isAutoPlaying
                                        ? 'marketplace-progress 4s linear infinite'
                                        : 'none',
                                    width: '100%',
                                }}
                            />
                        )}
                    </button>
                ))}
            </div>
        </section>
    );
}
