import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    User,
    Search,
    Headphones,
    Moon,
    Sun,
    ShoppingCart,
    ChevronDown,
    ScanQrCode,
    Languages,
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { useLanguage } from '@/lib/use-language';
import { type Language } from '@/lib/i18n-dict';
import { LANGUAGES } from '@/lib/i18n-dict';
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
    { id: 'fallback-home', title: 'Home', url: '/' },
    { id: 'fallback-needs', title: 'Needs', url: '/needs' },
    { id: 'fallback-learn', title: 'Learn', url: '/learn' },
    { id: 'fallback-healthcare', title: 'Healthcare', url: '/healthcare' },
    { id: 'fallback-account', title: 'Account', url: '/account' },
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
    const { language, setLanguage, t } = useLanguage();
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

    const navLink = (item: SiteNavItem, className: string) => {
        const active = !/^https?:\/\//i.test(item.url) && isActiveUrl(item.url);
        const classes = `${className}${active ? ' text-primary' : ''}`;
        const targetProps =
            item.target === '_blank' ? { target: '_blank' as const, rel: 'noreferrer' } : {};

        if (/^https?:\/\//i.test(item.url)) {
            return (
                <a key={item.id} href={item.url} className={classes} {...targetProps}>
                    {item.title}
                </a>
            );
        }

        return (
            <Link key={item.id} href={item.url} className={classes} {...targetProps}>
                {item.title}
            </Link>
        );
    };

    const initialQuery = (() => {
        const qIndex = url.indexOf('?');
        if (qIndex === -1) return '';
        const params = new URLSearchParams(url.slice(qIndex + 1));
        return params.get('q') ?? params.get('search') ?? '';
    })();
    const [query, setQuery] = useState(initialQuery);

    const isDark = theme === 'dark';

    const getUserInitials = (): string => {
        if (user?.name) return getInitials(user.name);
        if (user?.email) return user.email[0].toUpperCase();
        return 'U';
    };

    const submitSearch = (value: string) => {
        onSearch?.(value);
        const q = value.trim();
        router.visit(q ? `/search?q=${encodeURIComponent(q)}` : '/search', {
            preserveState: false,
        });
    };

    return (
        <div className="glass-2 sticky top-0 z-sticky border-b border-border/60">
            <div className="container mx-auto px-3 py-2">
                <div className="flex items-center gap-2">
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
                            className="tap-safe flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-muted/70"
                            aria-label={t('nav.signIn')}
                        >
                            <User className="h-5 w-5" />
                        </Link>
                    )}

                    <form
                        className="flex-1 relative"
                        onSubmit={(e) => {
                            e.preventDefault();
                            submitSearch(query);
                        }}
                    >
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                onSearch?.(e.target.value);
                            }}
                            placeholder={t('nav.searchPlaceholder')}
                            aria-label={t('nav.searchLabel')}
                            className="h-9 w-full rounded-full border border-border/60 bg-background/70 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </form>

                    <button
                        type="button"
                        onClick={() => setTheme(isDark ? 'light' : 'dark')}
                        className="tap-safe flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground hover:bg-muted/70"
                        aria-label={t('nav.theme')}
                    >
                        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </button>

                    <Link
                        href="/scan"
                        className="tap-safe hidden h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground hover:bg-muted/70 sm:flex"
                        aria-label={t('nav.scan')}
                    >
                        <ScanQrCode className="h-5 w-5" />
                    </Link>

                    <details className="relative shrink-0">
                        <summary
                            className="tap-safe flex h-9 cursor-pointer list-none items-center justify-center rounded-full px-1 text-foreground hover:bg-muted/70 [&::-webkit-details-marker]:hidden"
                            aria-label={t('nav.language')}
                        >
                            <Languages className="h-5 w-5" />
                            <span className="ml-0.5 text-[10px] font-bold uppercase">
                                {language}
                            </span>
                        </summary>
                        <div className="glass-3 glass-edge absolute right-0 top-full z-modal mt-1 w-36 rounded-xl p-1">
                            {(LANGUAGES as readonly string[]).map((code) => (
                                <button
                                    key={code}
                                    type="button"
                                    onClick={(e) => {
                                        setLanguage(code as Language);
                                        (e.currentTarget.closest('details') as HTMLDetailsElement | null)?.removeAttribute('open');
                                    }}
                                    className={`block w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted ${
                                        language === code ? 'font-bold text-primary' : 'text-foreground'
                                    }`}
                                >
                                    {code === 'en' ? 'English' : code === 'es' ? 'Español' : 'Français'}
                                </button>
                            ))}
                        </div>
                    </details>

                    <Link
                        href={user ? '/tickets' : '/login'}
                        className="tap-safe flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground hover:bg-muted/70"
                        aria-label={t('nav.support')}
                    >
                        <Headphones className="h-5 w-5" />
                    </Link>

                    <button
                        type="button"
                        onClick={openCart}
                        className="tap-safe relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground hover:bg-muted/70"
                        aria-label={t('nav.cart')}
                    >
                        <ShoppingCart className="h-5 w-5" />
                        {cartCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive p-0 text-[10px] font-medium text-destructive-foreground">
                                {cartCount > 9 ? '9+' : cartCount}
                            </span>
                        )}
                    </button>

                    {user ? (
                        <NotificationBell />
                    ) : (
                        <Link
                            href="/login"
                            className="tap-safe relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground hover:bg-muted/70"
                            aria-label={t('nav.notificationsSignIn')}
                        >
                            <User className="h-5 w-5" />
                        </Link>
                    )}
                </div>

                <nav
                    className="hidden items-center gap-1 md:flex"
                    aria-label="Main navigation"
                    data-testid="site-nav-header"
                >
                    {headerNav.map((item) =>
                        navLink(item, 'tap-safe rounded-full px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/70'),
                    )}
                    {moreNav.length > 0 && (
                        <details className="relative">
                            <summary className="tap-safe inline-flex cursor-pointer list-none items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/70 [&::-webkit-details-marker]:hidden">
                                More
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
        </div>
    );
}
