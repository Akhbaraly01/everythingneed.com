import { useCallback, useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import {
    ChevronLeft,
    ChevronRight,
    Package,
    Heart,
    Wrench,
    Building,
    Tractor,
    HelpCircle,
    Users,
    type LucideIcon,
} from 'lucide-react';

interface RequestType {
    id: string;
    title: string;
    subtitle: string;
    icon: LucideIcon;
    gradient: string;
    link: string;
}

const fallbackTypes: RequestType[] = [
    { id: 'product', title: 'Request Product', subtitle: "Can't find a product? Let us source it", icon: Package, gradient: 'from-blue-500 to-indigo-600', link: '/needs/request?type=product' },
    { id: 'healthcare', title: 'Healthcare Request', subtitle: 'Medical assistance & consultations', icon: Heart, gradient: 'from-rose-500 to-pink-600', link: '/healthcare' },
    { id: 'worker', title: 'Request Workers', subtitle: 'Skilled laborers for your projects', icon: Wrench, gradient: 'from-amber-500 to-orange-600', link: '/needs/request?type=worker' },
    { id: 'building', title: 'Construction Services', subtitle: 'Engineers & building materials', icon: Building, gradient: 'from-slate-500 to-gray-700', link: '/needs/request?type=building' },
    { id: 'agriculture', title: 'Agriculture Needs', subtitle: 'Farm equipment & workers', icon: Tractor, gradient: 'from-green-500 to-emerald-600', link: '/needs/request?type=agriculture' },
    { id: 'general', title: 'General Request', subtitle: 'Any other service you need', icon: HelpCircle, gradient: 'from-purple-500 to-violet-600', link: '/needs/request?type=general' },
    { id: 'services', title: 'Professional Services', subtitle: 'Mechanics, electricians & more', icon: Users, gradient: 'from-cyan-500 to-teal-600', link: '/needs/request?type=services' },
];

const CATEGORY_ICONS: LucideIcon[] = [Package, Heart, Wrench, Building, Tractor, HelpCircle, Users];
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

export default function NeedCarousel() {
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
                        return {
                            id: String(c.id),
                            title: c.name,
                            subtitle: c.description || `Request ${c.name.toLowerCase()}`,
                            icon: CATEGORY_ICONS[i % CATEGORY_ICONS.length],
                            gradient: CATEGORY_GRADIENTS[i % CATEGORY_GRADIENTS.length],
                            link: `/needs/request?category=${encodeURIComponent(key)}`,
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
    }, []);

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
            className="py-4"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
            onTouchStart={() => setIsAutoPlaying(false)}
            onTouchEnd={() => setIsAutoPlaying(true)}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Submit Your Need
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
                        aria-label="Previous needs"
                        className="flex h-6 w-6 items-center justify-center rounded-md text-foreground hover:bg-muted"
                        onClick={() => {
                            setIsAutoPlaying(false);
                            goPrev();
                        }}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        aria-label="Next needs"
                        className="flex h-6 w-6 items-center justify-center rounded-md text-foreground hover:bg-muted"
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
