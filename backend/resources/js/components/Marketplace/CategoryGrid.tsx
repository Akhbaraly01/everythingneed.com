import { useEffect, useRef, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useLanguage } from '@/lib/use-language';
import type { SiteNav } from '@/types';
import {
    Smartphone,
    Shirt,
    Home,
    Dumbbell,
    Calendar,
    CheckSquare,
    Hotel,
    MoreHorizontal,
    GraduationCap,
    HeartPulse,
    Pill,
    Users,
    Truck,
    ShoppingBag,
    Shield,
    Headphones,
    type LucideIcon,
} from 'lucide-react';

interface Category {
    name: string;
    icon: LucideIcon;
    link: string;
    gradient: string;
}

const SECTION_CATEGORIES: Category[] = [
    { name: 'Learning', icon: GraduationCap, link: '/learn', gradient: 'from-emerald-500 to-teal-500' },
    { name: 'Healthcare', icon: HeartPulse, link: '/healthcare', gradient: 'from-rose-500 to-pink-500' },
    { name: 'Pharmacy', icon: Pill, link: '/pharmacy', gradient: 'from-blue-500 to-cyan-500' },
    { name: 'Needs', icon: Users, link: '/needs', gradient: 'from-purple-500 to-fuchsia-500' },
    { name: 'Hotels', icon: Hotel, link: '/hotels', gradient: 'from-yellow-500 to-amber-500' },
    { name: 'Jobs', icon: CheckSquare, link: '/jobs', gradient: 'from-teal-500 to-emerald-500' },
    { name: 'Tasks', icon: CheckSquare, link: '/tasks', gradient: 'from-cyan-500 to-blue-500' },
];

function CategoryTile({ name, icon: Icon, link, gradient }: Category) {
    return (
        <Link href={link} className="group flex flex-col items-center gap-2">
            <span
                className={`relative w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20`}
            >
                <span
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-300`}
                />
                <Icon className="h-6 w-6 md:h-7 md:w-7 text-white relative z-10" />
            </span>
            <span className="text-xs md:text-sm font-medium text-center text-foreground/80 group-hover:text-foreground transition-colors line-clamp-1">
                {name}
            </span>
        </Link>
    );
}

export interface CategoryOption {
    id?: string | number;
    name: string;
    slug?: string;
    icon?: string | null;
}

const ICONS: Record<string, LucideIcon> = {
    smartphone: Smartphone,
    shirt: Shirt,
    home: Home,
    dumbbell: Dumbbell,
    calendar: Calendar,
    check: CheckSquare,
    hotel: Hotel,
    graduation: GraduationCap,
    health: HeartPulse,
    pill: Pill,
    users: Users,
    truck: Truck,
    bag: ShoppingBag,
    shield: Shield,
    headphones: Headphones,
};

const GRADIENTS = [
    'from-blue-500 to-blue-600',
    'from-pink-500 to-rose-500',
    'from-amber-500 to-orange-500',
    'from-green-500 to-emerald-500',
    'from-cyan-500 to-blue-500',
    'from-teal-500 to-emerald-500',
    'from-yellow-500 to-amber-500',
    'from-purple-500 to-fuchsia-500',
];

function iconFor(name: string | null | undefined, fallback: LucideIcon): LucideIcon {
    if (!name) return fallback;
    const key = name.toLowerCase();
    const hit = Object.entries(ICONS).find(([k]) => key.includes(k));
    return hit ? hit[1] : fallback;
}

export default function CategoryGrid({ categories = [] }: { categories?: CategoryOption[] }) {
    const { t } = useLanguage();
    const [showAll, setShowAll] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const { siteNav } = usePage().props as { siteNav?: SiteNav };

    useEffect(() => {
        if (!showAll) return;
        const onDown = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setShowAll(false);
            }
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setShowAll(false);
        };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [showAll]);

    const real: Category[] = categories.slice(0, 15).map((c, i) => ({
        name: c.name,
        icon: iconFor(c.icon, ShoppingBag),
        link: c.slug ? `/products?category=${encodeURIComponent(c.slug)}` : '/products',
        gradient: GRADIENTS[i % GRADIENTS.length],
    }));
    // Admin-managed `category` menu (spec S46) merged into the full panel.
    const navCategories: Category[] = (siteNav?.category ?? []).flatMap((item, index) =>
        (item.children?.length ? item.children : [item]).map((child, childIndex) => ({
            name: child.title,
            icon: iconFor(child.icon, ShoppingBag),
            link: child.url,
            gradient: GRADIENTS[(index + childIndex) % GRADIENTS.length],
        })),
    );
    const quick = real.length >= 7 ? real.slice(0, 7) : [...real, ...SECTION_CATEGORIES].slice(0, 7);
    const seen = new Set<string>();
    const all = [...real, ...SECTION_CATEGORIES, ...navCategories].filter((c) => {
        const key = c.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    return (
        <div ref={rootRef}>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3 md:gap-4">
                {quick.map((category) => (
                    <CategoryTile key={category.name} {...category} />
                ))}
                <button
                    type="button"
                    onClick={() => setShowAll((v) => !v)}
                    aria-expanded={showAll}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer"
                >
                    <span className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center shadow-md transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg">
                        <MoreHorizontal className="h-5 w-5 md:h-6 md:w-6 text-white" />
                    </span>
                    <span className="text-xs font-medium text-center text-muted-foreground group-hover:text-foreground transition-colors">
                        {showAll ? t('home.less') : t('home.more')}
                    </span>
                </button>
            </div>

            {showAll && (
                <div className="mt-4 rounded-xl border border-border bg-card p-4">
                        <h3 className="mb-3 text-sm font-semibold">{t('home.allCategories')}</h3>
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-4 mt-6 overflow-y-auto">
                        {all.map((category) => (
                            <Link
                                key={category.name}
                                href={category.link}
                                onClick={() => setShowAll(false)}
                                className="flex flex-col items-center gap-2 group"
                            >
                                <span
                                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center shadow-md transition-all group-hover:scale-105`}
                                >
                                    <category.icon className="h-6 w-6 text-white" />
                                </span>
                                <span className="text-xs font-medium text-center">{category.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
