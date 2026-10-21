import { useLayoutEffect, useRef, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    User,
    Headphones,
    Moon,
    Sun,
    ShoppingCart,
    ChevronDown,
    ScanQrCode,
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { useLanguage } from '@/lib/use-language';
import LocaleCurrencySwitcher from '@/components/i18n/LocaleCurrencySwitcher';
import GlobalSearch from '@/components/shared/GlobalSearch';
import { getInitials } from '@/lib/utils';
import NotificationBell from '@/components/notifications/NotificationBell';
import { useCartDrawer } from '@/components/cart/CartDrawerContext';
import type { SiteNav, SiteNavItem } from '@/types';

interface HeaderProps {
    cartCount?: number;
    notificationCount?: number;
    onSearch?: (query: string) => void;
}

// Shown until an admin publishes a header menu (navigations table).
const FALLBACK_HEADER: SiteNavItem[] = [
    { id: 'fallback-home', title: 'nav.home', url: '/' },
    { id: 'fallback-needs', title: 'nav.needs', url: '/needs' },
    { id: 'fallback-learn', title: 'nav.learn', url: '/learn' },
    { id: 'fallback-healthcare', title: 'nav.healthcare', url: '/healthcare' },
    { id: 'fallback-account', title: 'nav.account', url: '/account' },
];

const forDesktop = (items: SiteNavItem[]): SiteNavItem[] =>
    items.filter((item) => !item.devices || item.devices.length === 0 || item.devices.includes('desktop'));

export default function Header({
    cartCount = 0,
    onSearch,
}: HeaderProps) {
    const { props, url } = usePage();
    const auth = (props.auth ?? null) as {
        id?: string;
        name?: string;
        email?: string;
        user?: { name: string; email: string; avatar_url?: string };
    } | null;
    const user = auth?.user ?? auth;
    const { openCart } = useCartDrawer();
    const { theme, setTheme } = useTheme();
    const { t } = useLanguage();
    const currentPath = url.split('?')[0];

    const siteNav = (props.siteNav ?? {}) as SiteNav;
    const uiTexts = (props.uiTexts ?? {}) as {
        ui?: Record<string, { value?: string }>;
    };
    const siteName = uiTexts.ui?.site_name?.value || 'everythingneed.com';
    const headerNav = forDesktop(siteNav.header?.length ? siteNav.header : FALLBACK_HEADER);
    const moreNav = forDesktop(siteNav.more ?? []);

    const isActiveUrl = (target: string): boolean => {
        const path = target.split('?')[0];
        if (path === '/') return currentPath === '/';
        return currentPath === path || currentPath.startsWith(`${path}/`);
    };

    // Fallback-header entries carry i18n keys ("nav.home"); published
    // database titles are admin content and render verbatim.
    const navLabel = (item: SiteNavItem): string =>
        item.id.startsWith('fallback-')
            ? t(item.title, { defaultValue: item.title })
            : item.title;

    const navLink = (item: SiteNavItem, className: string) => {
        const active = !/^https?:\/\//i.test(item.url) && isActiveUrl(item.url);
        const classes = `${className}${active ? ' text-primary' : ''}`;
        const targetProps =
            item.target === '_blank' ? { target: '_blank' as const, rel: 'noreferrer' } : {};

        if (/^https?:\/\//i.test(item.url)) {
            return (
                <a key={item.id} href={item.url} className={classes} {...targetProps}>
                    {navLabel(item)}
                </a>
            );
        }

        return (
            <Link key={item.id} href={item.url} className={classes} {...targetProps}>
                {navLabel(item)}
            </Link>
        );
    };

    const isDark = theme === 'dark';

    // Fixed chrome: the bar never scrolls, so a measured spacer keeps page
    // content from hiding underneath (robust across breakpoints/rows).
    const headerRef = useRef<HTMLElement>(null);
    const [spacerH, setSpacerH] = useState(0);
    useLayoutEffect(() => {
        const el = headerRef.current;
        if (!el) return;
        const measure = () => setSpacerH(el.offsetHeight);
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const getUserInitials = (): string => {
        if (user?.name) return getInitials(user.name);
        if (user?.email) return user.email[0].toUpperCase();
        return 'U';
    };

    return (
        <>
            <div aria-hidden="true" style={{ height: spacerH }} />
            <header
                ref={headerRef}
                data-testid="site-header"
                className="glass-2 fixed inset-x-0 top-0 z-50 border-b border-border/60"
            >
            <div className="container mx-auto px-3 py-2">
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href="/"
                        className="hidden shrink-0 items-center gap-1.5 sm:flex"
                        aria-label={siteName}
                    >
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
                            {siteName.charAt(0).toUpperCase()}
                        </span>
                        <span className="max-w-[140px] truncate text-sm font-bold text-foreground">
                            {siteName}
                        </span>
                    </Link>

                    {user ? (
                        <Link href="/account" aria-label={t('nav.account')}>
                            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-primary/50 bg-primary/10 text-xs font-semibold text-primary">
                                {getUserInitials()}
                            </span>
                        </Link>
                    ) : (
                        <Link
                            href="/login"
                            className="icon-glass-3d tap-safe"
                            aria-label={t('nav.signIn')}
                        >
                            <User className="h-[18px] w-[18px]" />
                        </Link>
                    )}

                    <GlobalSearch
                        onSubmit={(value) => {
                            onSearch?.(value);
                            router.visit(value ? `/search?q=${encodeURIComponent(value)}` : '/search', {
                                preserveState: false,
                            });
                        }}
                    />

                    <button
                        type="button"
                        onClick={() => setTheme(isDark ? 'light' : 'dark')}
                        className="icon-glass-3d tap-safe"
                        aria-label={t('nav.theme')}
                    >
                        {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
                    </button>

                    <Link
                        href="/scan"
                        className="icon-glass-3d tap-safe inline-flex"
                        aria-label={t('nav.scan')}
                    >
                        <ScanQrCode className="h-[18px] w-[18px]" />
                    </Link>

                    <LocaleCurrencySwitcher />

                    <Link
                        href={user ? '/tickets' : '/login'}
                        className="icon-glass-3d tap-safe"
                        aria-label={t('nav.support')}
                    >
                        <Headphones className="h-[18px] w-[18px]" />
                    </Link>

                    <button
                        type="button"
                        onClick={openCart}
                        className="icon-glass-3d tap-safe relative"
                        aria-label={t('nav.cart')}
                    >
                        <ShoppingCart className="h-[18px] w-[18px]" />
                        {cartCount > 0 && (
                            <span className="badge-pop absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive p-0 text-[10px] font-medium text-destructive-foreground">
                                {cartCount > 9 ? '9+' : cartCount}
                            </span>
                        )}
                    </button>

                    {user ? (
                        <NotificationBell />
                    ) : (
                        <Link
                            href="/login"
                            className="icon-glass-3d tap-safe relative"
                            aria-label={t('nav.notificationsSignIn')}
                        >
                            <User className="h-[18px] w-[18px]" />
                        </Link>
                    )}
                </div>

                <nav
                    className="hidden items-center gap-1 md:flex"
                    aria-label={t('nav.mainNavigation', { defaultValue: 'Main navigation' })}
                    data-testid="site-nav-header"
                >
                    {headerNav.map((item) =>
                        navLink(item, 'tap-safe rounded-full px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/70'),
                    )}
                    {moreNav.length > 0 && (
                        <details className="relative">
                            <summary className="tap-safe inline-flex cursor-pointer list-none items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/70 [&::-webkit-details-marker]:hidden">
                                {t('nav.more', { defaultValue: 'More' })}
                                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                            </summary>
                            <div className="glass-3 glass-edge absolute left-0 top-full z-modal mt-1 w-52 rounded-xl p-1">
                                {moreNav.map((item) =>
                                    navLink(item, 'block rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-muted'),
                                )}
                            </div>
                        </details>
                    )}
                </nav>
            </div>
            </header>
        </>
    );
}
