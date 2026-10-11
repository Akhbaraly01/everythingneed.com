import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    Home,
    FileText,
    GraduationCap,
    Heart,
    User,
    Package,
    ShoppingCart,
    Hotel,
    Briefcase,
    Plane,
    Car,
    Tractor,
    Building2,
    Stethoscope,
    LayoutGrid,
    MoreHorizontal,
    type LucideIcon,
} from 'lucide-react';
import type { SiteNav, SiteNavItem } from '@/types';
import { useLanguage } from '@/lib/use-language';
import MoreSheet from '@/components/navigation/MoreSheet';

// Shown until an admin publishes a mobile menu (navigations table).
const FALLBACK_ITEMS: SiteNavItem[] = [
    { id: 'fallback-home', title: 'Home', url: '/', icon: 'home' },
    { id: 'fallback-needs', title: 'Needs', url: '/needs', icon: 'file-text' },
    { id: 'fallback-learn', title: 'Learn', url: '/learn', icon: 'graduation-cap' },
    { id: 'fallback-health', title: 'Health', url: '/healthcare', icon: 'heart' },
    { id: 'fallback-account', title: 'Account', url: '/account', icon: 'user' },
];

const ICONS: Record<string, LucideIcon> = {
    home: Home,
    'file-text': FileText,
    'graduation-cap': GraduationCap,
    heart: Heart,
    user: User,
    package: Package,
    'shopping-cart': ShoppingCart,
    hotel: Hotel,
    briefcase: Briefcase,
    plane: Plane,
    car: Car,
    tractor: Tractor,
    building: Building2,
    stethoscope: Stethoscope,
    'layout-grid': LayoutGrid,
};

export default function BottomNav({ cartCount: _cartCount = 0 }: { cartCount?: number }) {
    const { props, url } = usePage();
    const { t } = useLanguage();
    const siteNav = (props.siteNav ?? {}) as SiteNav;
    const currentPath = url.split('?')[0];
    const [moreOpen, setMoreOpen] = useState(false);

    // Admin-published titles render as authored (never machine-translated);
    // only the built-in fallbacks are localized.
    const fallbackTitle = (id: string, fallback: string): string => {
        switch (id) {
            case 'fallback-home':
                return t('nav.home');
            case 'fallback-needs':
                return t('nav.needs');
            case 'fallback-learn':
                return t('nav.learn');
            case 'fallback-health':
                return t('nav.healthcare');
            case 'fallback-account':
                return t('nav.account');
            default:
                return fallback;
        }
    };

    const mobileItems = (siteNav.mobile?.length ? siteNav.mobile : FALLBACK_ITEMS).filter(
        (item) => !item.devices || item.devices.length === 0 || item.devices.includes('mobile'),
    );

    const isActive = (path: string): boolean => {
        if (path === '/' || path === '/dashboard' || path === '/home') {
            return currentPath === '/' || currentPath === '/dashboard' || currentPath === '/home';
        }
        if (path === '/login' || path === '/account') {
            return currentPath === '/account' || currentPath.startsWith('/account/') || currentPath === '/login';
        }
        return currentPath === path || currentPath.startsWith(`${path}/`);
    };

    return (
        <nav
            className="fixed bottom-[calc(var(--safe-bottom)+8px)] left-3 right-3 z-dock md:hidden"
            data-testid="site-nav-mobile"
        >
            <div className="glass-3 glass-edge flex h-[var(--dock-h)] items-center justify-around rounded-2xl px-1">
                {mobileItems.map((item) => {
                    const Icon = ICONS[item.icon ?? ''] ?? LayoutGrid;
                    const active = isActive(item.url);
                    return (
                        <Link
                            key={item.id}
                            href={item.url}
                            aria-current={active ? 'page' : undefined}
                            className={`tap-safe flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 transition-colors duration-fast ${
                                active
                                    ? 'text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <span
                                className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-fast ${
                                    active ? 'bg-primary/15' : ''
                                }`}
                            >
                                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                            </span>
                            <span className="w-full truncate px-0.5 text-center text-[10px] font-medium leading-none">
                                {fallbackTitle(item.id, item.title)}
                            </span>
                        </Link>
                    );
                })}
                <button
                    type="button"
                    onClick={() => setMoreOpen(true)}
                    aria-label="More destinations"
                    aria-haspopup="dialog"
                    className="tap-safe flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-muted-foreground transition-colors duration-fast hover:text-foreground"
                >
                    <span className="flex h-7 w-12 items-center justify-center rounded-full">
                        <MoreHorizontal className="h-[18px] w-[18px]" aria-hidden="true" />
                    </span>
                    <span className="w-full truncate px-0.5 text-center text-[10px] font-medium leading-none">
                        {t('nav.more')}
                    </span>
                </button>
            </div>
            <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
        </nav>
    );
}
