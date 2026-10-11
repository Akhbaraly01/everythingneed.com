import { useEffect, useMemo, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    Search,
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
    Wallet,
    Bell,
    Settings,
    Ticket,
    Store,
    Pill,
    Calendar,
    MessageSquare,
    LayoutDashboard,
    type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SiteNav, SiteNavItem } from '@/types';

const ICONS: Record<string, LucideIcon> = {
    home: Home,
    dashboard: LayoutDashboard,
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
    wallet: Wallet,
    bell: Bell,
    settings: Settings,
    ticket: Ticket,
    store: Store,
    pill: Pill,
    calendar: Calendar,
    message: MessageSquare,
    'layout-grid': LayoutDashboard,
};

/** Quick entries shown when no admin-published search index exists. */
const QUICK_LINKS: Array<{ id: string; title: string; url: string; icon: LucideIcon; keywords: string }> = [
    { id: 'q-home', title: 'Home', url: '/', icon: Home, keywords: 'home start landing' },
    { id: 'q-search', title: 'Search products', url: '/search', icon: Search, keywords: 'search find products' },
    { id: 'q-products', title: 'Products', url: '/products', icon: ShoppingCart, keywords: 'shop products store' },
    { id: 'q-needs', title: 'Needs & Services', url: '/needs', icon: FileText, keywords: 'needs services requests' },
    { id: 'q-learn', title: 'Learning', url: '/learn', icon: GraduationCap, keywords: 'learn courses education' },
    { id: 'q-health', title: 'Healthcare', url: '/healthcare', icon: Stethoscope, keywords: 'health doctors medical' },
    { id: 'q-cart', title: 'Cart', url: '/cart', icon: ShoppingCart, keywords: 'cart basket checkout' },
    { id: 'q-orders', title: 'Orders', url: '/orders', icon: Package, keywords: 'orders purchases history' },
    { id: 'q-wishlist', title: 'Wishlist', url: '/wishlist', icon: Heart, keywords: 'wishlist saved favorites' },
    { id: 'q-wallet', title: 'Wallet', url: '/wallet', icon: Wallet, keywords: 'wallet money payments' },
    { id: 'q-account', title: 'Account', url: '/account', icon: User, keywords: 'account profile settings' },
    { id: 'q-support', title: 'Support', url: '/tickets', icon: Ticket, keywords: 'support help tickets' },
    { id: 'q-dashboard', title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, keywords: 'dashboard overview' },
    { id: 'q-notifications', title: 'Notifications', url: '/notifications', icon: Bell, keywords: 'notifications alerts' },
];

interface CommandItem {
    id: string;
    title: string;
    url: string;
    icon: LucideIcon;
}

export interface CommandPaletteProps {
    open: boolean;
    onClose: () => void;
}

/**
 * ⌘K / Ctrl+K command palette. Combines admin-published nav items
 * (header/more/mobile) with built-in quick links, filters by title and
 * keyword, and navigates with router.visit on selection.
 */
export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
    const { props } = usePage();
    const [query, setQuery] = useState('');
    const [index, setIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const siteNav = (props.siteNav ?? {}) as SiteNav;

    const items: CommandItem[] = useMemo(() => {
        const collected = new Map<string, CommandItem>();
        const push = (nav: SiteNavItem[]) => {
            for (const item of nav) {
                if (!item.url || collected.has(item.url)) continue;
                const icon = ICONS[item.icon ?? ''] ?? LayoutDashboard;
                collected.set(item.url, { id: item.id, title: item.title, url: item.url, icon });
            }
        };
        push(siteNav.header ?? []);
        push(siteNav.more ?? []);
        push(siteNav.mobile ?? []);
        for (const quick of QUICK_LINKS) {
            if (!collected.has(quick.url)) collected.set(quick.url, quick);
        }
        return Array.from(collected.values());
    }, [siteNav.header, siteNav.more, siteNav.mobile]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return items.slice(0, 8);
        const quickKeywords = new Map(QUICK_LINKS.map((l) => [l.url, l.keywords]));
        return items
            .filter((item) => {
                const hay = `${item.title} ${quickKeywords.get(item.url) ?? ''}`.toLowerCase();
                return hay.includes(q);
            })
            .slice(0, 8);
    }, [items, query]);

    useEffect(() => {
        if (open) {
            setQuery('');
            setIndex(0);
            requestAnimationFrame(() => inputRef.current?.focus());
        }
    }, [open]);

    useEffect(() => {
        setIndex(0);
    }, [query]);

    if (!open) return null;

    const go = (url: string) => {
        onClose();
        if (/^https?:\/\//i.test(url)) {
            window.open(url, '_blank', 'noreferrer');
        } else {
            router.visit(url, { preserveState: false });
        }
    };

    return (
        <div className="fixed inset-0 z-modal flex items-start justify-center p-4 pt-[12vh]">
            <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Command palette"
                className="glass-3 glass-edge relative w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl"
            >
                <div className="flex items-center gap-2 border-b border-border/60 px-4">
                    <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                                e.stopPropagation();
                                onClose();
                            } else if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                setIndex((i) => (i + 1) % Math.max(filtered.length, 1));
                            } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                setIndex((i) => (i - 1 + filtered.length) % Math.max(filtered.length, 1));
                            } else if (e.key === 'Enter' && filtered[index]) {
                                e.preventDefault();
                                go(filtered[index].url);
                            }
                        }}
                        placeholder="Jump to a page…"
                        aria-label="Search destinations"
                        className="h-12 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                    <kbd className="pointer-events-none hidden shrink-0 rounded-md border border-border/70 bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:block">
                        esc
                    </kbd>
                </div>
                <ul className="max-h-[50vh] overflow-y-auto overscroll-contain p-2" role="listbox" aria-label="Results">
                    {filtered.length === 0 && (
                        <li className="px-3 py-8 text-center text-sm text-muted-foreground">No matches</li>
                    )}
                    {filtered.map((item, i) => (
                        <li key={item.id} role="option" aria-selected={i === index}>
                            <button
                                type="button"
                                onClick={() => go(item.url)}
                                onMouseEnter={() => setIndex(i)}
                                className={cn(
                                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors duration-fast',
                                    i === index ? 'bg-primary/[0.12] text-primary' : 'text-foreground hover:bg-muted/60',
                                )}
                            >
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/70">
                                    <item.icon className="h-4 w-4" aria-hidden="true" />
                                </span>
                                <span className="min-w-0 flex-1 truncate font-medium">{item.title}</span>
                                <span className="truncate text-xs text-muted-foreground">{item.url}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
