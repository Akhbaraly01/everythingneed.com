import { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import {
    Sparkles,
    Gift,
    Percent,
    TrendingUp,
    Zap,
    Star,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

interface Campaign {
    id: number | string;
    title: string;
    subtitle?: string;
    cta?: string;
    link: string;
    gradient: string;
    icon: 'zap' | 'gift' | 'sparkles' | 'percent' | 'trending' | 'star';
    image_url?: string | null;
}

const GRADIENTS = [
    'from-orange-500 via-rose-500 to-red-500',
    'from-purple-500 via-pink-500 to-rose-500',
    'from-blue-500 via-indigo-500 to-purple-500',
    'from-emerald-500 via-teal-500 to-cyan-500',
    'from-amber-500 via-orange-500 to-red-500',
    'from-yellow-500 via-amber-500 to-orange-500',
];

const ICONS: Campaign['icon'][] = ['zap', 'gift', 'sparkles', 'percent', 'trending', 'star'];

interface CmsBanner {
    id: number | string;
    title: string;
    image_url?: string | null;
    link_url?: string | null;
    position?: string;
}

function CampaignIcon({ icon }: { icon: Campaign['icon'] }) {
    const cls = 'h-6 w-6 text-white';
    switch (icon) {
        case 'zap':
            return <Zap className={cls} />;
        case 'gift':
            return <Gift className={cls} />;
        case 'sparkles':
            return <Sparkles className={cls} />;
        case 'percent':
            return <Percent className={cls} />;
        case 'trending':
            return <TrendingUp className={cls} />;
        case 'star':
            return <Star className={cls} />;
    }
}

import { useLanguage } from '@/lib/use-language';

export default function BannerSlider() {
    const { t } = useLanguage();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);

    useEffect(() => {
        let cancelled = false;
        api.get<{ data: CmsBanner[] | null }>('/api/cms/banners/public')
            .then((payload) => {
                if (cancelled) return;
                const rows: CmsBanner[] = Array.isArray(payload?.data) ? payload.data : [];
                setCampaigns(
                    rows.map((b, i) => ({
                        id: b.id,
                        title: b.title,
                        subtitle: '',
                        cta: 'View',
                        link: b.link_url || '/products',
                        gradient: GRADIENTS[i % GRADIENTS.length],
                        icon: ICONS[i % ICONS.length],
                        image_url: b.image_url,
                    })),
                );
            })
            .catch(() => {
                if (!cancelled) setCampaigns([]);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!isAutoPlaying || campaigns.length === 0) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % campaigns.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [isAutoPlaying, campaigns.length]);

    if (campaigns.length === 0) {
        return (
            <div
                data-testid="home-banners"
                className="rounded-xl bg-gradient-to-r from-primary/90 to-primary p-4 text-primary-foreground"
            >
                <p className="text-sm font-semibold">{t('banner.welcomeTitle')}</p>
                <p className="text-xs opacity-80">{t('banner.welcomeText')}</p>
            </div>
        );
    }

    const goNext = () => setCurrentIndex((prev) => (prev + 1) % campaigns.length);
    const goPrev = () =>
        setCurrentIndex((prev) => (prev - 1 + campaigns.length) % campaigns.length);

    return (
        <>
        <div
            data-testid="home-banners"
            className="relative overflow-hidden rounded-xl"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
            onTouchStart={() => setIsAutoPlaying(false)}
            onTouchEnd={() => setIsAutoPlaying(true)}
        >
            <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {campaigns.map((campaign) => (
                    <Link key={campaign.id} href={campaign.link} className="min-w-full">
                        <div
                            className={`relative h-24 md:h-28 overflow-hidden rounded-xl bg-gradient-to-r ${campaign.gradient} p-4`}
                        >
                            {campaign.image_url ? (
                                <img
                                    src={campaign.image_url}
                                    alt=""
                                    className="absolute inset-0 h-full w-full object-cover"
                                    loading="lazy"
                                />
                            ) : null}
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute -top-4 -right-8 w-24 h-24 rounded-full bg-white/20" />
                                <div className="absolute -bottom-4 -left-8 w-32 h-32 rounded-full bg-white/10" />
                            </div>
                            <div className="relative z-10 h-full flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                            <CampaignIcon icon={campaign.icon} />
                                        </div>
                                        <h3 className="font-bold text-white text-sm md:text-base line-clamp-1">
                                            {campaign.title}
                                        </h3>
                                    </div>
                                    {campaign.subtitle ? (
                                        <p className="text-white/80 text-xs md:text-sm line-clamp-1 ml-10">
                                            {campaign.subtitle}
                                        </p>
                                    ) : null}
                                </div>
                                <span className="h-8 text-xs px-4 bg-white/20 hover:bg-white/30 text-white border-0 shrink-0 ml-2 inline-flex items-center rounded-md font-medium">
                                    {campaign.cta || 'View'}
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <button
                type="button"
                onClick={goPrev}
                aria-label="Previous banner"
                className="tap-safe absolute left-1 top-1/2 z-10 h-7 w-7 -translate-y-1/2 rounded-full bg-black/35 text-white backdrop-blur-sm transition-transform duration-fast hover:bg-black/50 active:scale-90"
            >
                <ChevronLeft className="mx-auto h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={goNext}
                aria-label="Next banner"
                className="tap-safe absolute right-1 top-1/2 z-10 h-7 w-7 -translate-y-1/2 rounded-full bg-black/35 text-white backdrop-blur-sm transition-transform duration-fast hover:bg-black/50 active:scale-90"
            >
                <ChevronRight className="mx-auto h-4 w-4" />
            </button>

            <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 justify-center gap-1">
                {campaigns.map((_, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentIndex(idx)}
                        aria-label={`Go to banner ${idx + 1}`}
                        className={`h-1.5 rounded-full transition-all ${
                            idx === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                        }`}
                    />
                ))}
            </div>
        </div>
        </>
    );
}
