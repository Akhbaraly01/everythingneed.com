import { useEffect, useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import {
    TrendingUp,
    Sparkles,
    GraduationCap,
    HeartPulse,
    Package,
    Star,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import Image from '@/components/shared/Image';
import { formatPrice } from '@/lib/currency';
import { useLanguage } from '@/lib/use-language';

interface BannerItem {
    title: string;
    subtitle: string;
    cta: string;
    link: string;
    gradient: string;
    icon: 'sparkles' | 'learn' | 'health' | 'package';
}

interface TrendingItem {
    id: number | string;
    name: string;
    price: number;
    originalPrice: number;
    image: string;
    sales?: string;
    rating: number;
    link?: string;
}

const rightTopBanners = (t: (key: string) => string): BannerItem[] => [
    { title: t('home.submitNeed'), subtitle: t('banner.needSub'), cta: t('banner.request'), link: '/needs/request', gradient: 'from-amber-500 to-orange-600', icon: 'sparkles' },
    { title: t('home.learn'), subtitle: t('banner.learnSub'), cta: t('banner.start'), link: '/learn', gradient: 'from-emerald-500 to-teal-600', icon: 'learn' },
];

const rightBottomBanners = (t: (key: string) => string): BannerItem[] => [
    { title: t('home.healthcare'), subtitle: t('banner.healthSub'), cta: t('banner.book'), link: '/healthcare', gradient: 'from-rose-500 to-pink-600', icon: 'health' },
    { title: t('home.pharmacy'), subtitle: t('banner.pharmacySub'), cta: t('banner.order'), link: '/pharmacy', gradient: 'from-cyan-500 to-blue-600', icon: 'package' },
];

function BannerIcon({ icon }: { icon: BannerItem['icon'] }) {
    const cls = 'h-3 w-3 text-white';
    switch (icon) {
        case 'learn':
            return <GraduationCap className={cls} />;
        case 'health':
            return <HeartPulse className={cls} />;
        case 'package':
            return <Package className={cls} />;
        case 'sparkles':
        default:
            return <Sparkles className={cls} />;
    }
}

function BannerSlide({ item }: { item: BannerItem }) {
    return (
        <Link href={item.link} className="block h-full">
            <div
                className={`relative h-full overflow-hidden rounded-xl bg-gradient-to-br ${item.gradient} p-3 transition-all hover:shadow-lg`}
            >
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-white/20" />
                    <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/10" />
                </div>
                <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                            <h3 className="font-bold text-white text-xs md:text-sm line-clamp-1">{item.title}</h3>
                            <p className="text-white/70 mt-0.5 text-[10px] md:text-xs line-clamp-1">{item.subtitle}</p>
                        </div>
                        <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm shrink-0">
                            <BannerIcon icon={item.icon} />
                        </div>
                    </div>
                    <span className="inline-flex h-6 items-center text-[10px] px-2 bg-white/20 hover:bg-white/30 text-white border-0 w-fit rounded-md font-medium">
                        {item.cta}
                    </span>
                </div>
            </div>
        </Link>
    );
}

interface TripleBannerProps {
    trending?: TrendingItem[];
}

export default function TripleBanner({ trending }: TripleBannerProps) {
    const { t } = useLanguage();
    const items = trending ?? [];
    const topBanners = useMemo(() => rightTopBanners(t), [t]);
    const bottomBanners = useMemo(() => rightBottomBanners(t), [t]);
    const [trendingIndex, setTrendingIndex] = useState(0);
    const [rightTopIndex, setRightTopIndex] = useState(0);
    const [rightBottomIndex, setRightBottomIndex] = useState(0);
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        if (paused || items.length === 0 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const interval = setInterval(() => {
            setTrendingIndex((prev) => (prev + 1) % items.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [items.length, paused]);

    useEffect(() => {
        if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const interval = setInterval(() => {
            setRightTopIndex((prev) => (prev + 1) % topBanners.length);
        }, 5500);
        return () => clearInterval(interval);
    }, [paused, topBanners.length]);

    useEffect(() => {
        if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const interval = setInterval(() => {
            setRightBottomIndex((prev) => (prev + 1) % bottomBanners.length);
        }, 6500);
        return () => clearInterval(interval);
    }, [paused, bottomBanners.length]);

    if (items.length === 0) {
        return (
            <div className="grid grid-cols-5 gap-2 min-h-[150px] md:min-h-[160px]">
                <div className="col-span-3 rounded-xl border border-border bg-card p-3 flex flex-col justify-center">
                    <p className="text-sm font-semibold">{t('home.trendingItems')}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t('home.nothingHereText')}</p>
                    <Link href="/products" className="mt-2 text-xs text-primary font-medium">{t('home.browseProducts')}</Link>
                </div>
                <div className="col-span-2 flex flex-col gap-2">
                    <div className="flex-1"><BannerSlide item={topBanners[0]} /></div>
                    <div className="flex-1"><BannerSlide item={bottomBanners[0]} /></div>
                </div>
            </div>
        );
    }

    const safeIndex = trendingIndex % items.length;
    const item = items[safeIndex];

    return (
        <div
            className="grid grid-cols-5 gap-2 min-h-[150px] md:min-h-[160px]"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
        >
            <div className="col-span-3 relative overflow-hidden rounded-xl">
                <div className="relative h-full overflow-hidden rounded-xl bg-gradient-to-br from-orange-500 via-rose-500 to-red-500 p-3">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/20" />
                        <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/10" />
                    </div>
                    <div className="relative z-10 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                                <div className="p-1 bg-white/20 rounded-lg">
                                    <TrendingUp className="h-3 w-3 text-white" />
                                </div>
                                <span className="text-white font-bold text-xs">{t('home.trendingItems')}</span>
                            </div>
                            <span className="bg-white/20 text-white text-[9px] px-1.5 rounded-md">
                                🔥 Hot
                            </span>
                        </div>
                        <Link
                            href={item.link ?? `/search?q=${encodeURIComponent(item.name)}`}
                            className="flex-1 flex items-center gap-2 rounded-lg"
                            aria-label={`View ${item.name}`}
                        >
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden bg-white/10 shrink-0">
                                <Image src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-white font-semibold text-xs md:text-sm line-clamp-1">{item.name}</h4>
                                <div className="flex items-center gap-1 mt-0.5">
                                    <Star className="h-2.5 w-2.5 fill-yellow-300 text-yellow-300" />
                                    <span className="text-white/80 text-[10px]">{item.rating}</span>
                                    {item.sales && (
                                        <span className="text-white/60 text-[10px]">• {item.sales} sold</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className="text-white font-bold text-sm">{formatPrice(item.price)}</span>
                                    <span className="text-white/50 text-xs line-through">{formatPrice(item.originalPrice)}</span>
                                </div>
                            </div>
                        </Link>
                        <div className="flex justify-center gap-1 mt-2">
                            {items.map((entry, idx) => (
                                <button
                                    key={entry.id}
                                    type="button"
                                    onClick={() => setTrendingIndex(idx)}
                                    aria-label={`Show trending item ${idx + 1}`}
                                    className={`h-1 rounded-full transition-all ${
                                        idx === safeIndex ? 'w-3 bg-white' : 'w-1 bg-white/40'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-span-2 flex flex-col gap-2">
                <div className="flex-1 relative overflow-hidden rounded-xl group/rt">
                    <div
                        className="flex h-full transition-transform duration-500 ease-out"
                        style={{ transform: `translateX(-${rightTopIndex * 100}%)` }}
                    >
                        {topBanners.map((banner, idx) => (
                            <div key={idx} className="min-w-full h-full">
                                <BannerSlide item={banner} />
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        aria-label="Previous banner"
                        onClick={() => setRightTopIndex((p) => (p - 1 + topBanners.length) % topBanners.length)}
                        className="absolute left-1 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-black/30 text-white opacity-0 transition-opacity group-hover/rt:opacity-100"
                    >
                        <ChevronLeft className="h-3 w-3" />
                    </button>
                    <button
                        type="button"
                        aria-label="Next banner"
                        onClick={() => setRightTopIndex((p) => (p + 1) % topBanners.length)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-black/30 text-white opacity-0 transition-opacity group-hover/rt:opacity-100"
                    >
                        <ChevronRight className="h-3 w-3" />
                    </button>
                </div>
                <div className="flex-1 relative overflow-hidden rounded-xl group/rb">
                    <div
                        className="flex h-full transition-transform duration-500 ease-out"
                        style={{ transform: `translateX(-${rightBottomIndex * 100}%)` }}
                    >
                        {bottomBanners.map((banner, idx) => (
                            <div key={idx} className="min-w-full h-full">
                                <BannerSlide item={banner} />
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        aria-label="Previous banner"
                        onClick={() => setRightBottomIndex((p) => (p - 1 + bottomBanners.length) % bottomBanners.length)}
                        className="absolute left-1 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-black/30 text-white opacity-0 transition-opacity group-hover/rb:opacity-100"
                    >
                        <ChevronLeft className="h-3 w-3" />
                    </button>
                    <button
                        type="button"
                        aria-label="Next banner"
                        onClick={() => setRightBottomIndex((p) => (p + 1) % bottomBanners.length)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-black/30 text-white opacity-0 transition-opacity group-hover/rb:opacity-100"
                    >
                        <ChevronRight className="h-3 w-3" />
                    </button>
                </div>
            </div>
        </div>
    );
}
