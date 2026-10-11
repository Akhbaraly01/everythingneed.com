import { useMemo } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutGrid,
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
    type LucideIcon,
} from 'lucide-react';
import { Sheet } from '@/components/shared/Sheet';
import type { SiteNav, SiteNavItem } from '@/types';

const ICONS: Record<string, LucideIcon> = {
    home: LayoutGrid,
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
    'layout-grid': LayoutGrid,
};

const FALLBACK_MORE: SiteNavItem[] = [
    { id: 'more-orders', title: 'Orders', url: '/orders', icon: 'package' },
    { id: 'more-wallet', title: 'Wallet', url: '/wallet', icon: 'wallet' },
    { id: 'more-wishlist', title: 'Wishlist', url: '/wishlist', icon: 'heart' },
    { id: 'more-bookings', title: 'Bookings', url: '/bookings', icon: 'hotel' },
    { id: 'more-notify', title: 'Notifications', url: '/notifications', icon: 'bell' },
    { id: 'more-tickets', title: 'Support', url: '/tickets', icon: 'ticket' },
    { id: 'more-settings', title: 'Settings', url: '/settings', icon: 'settings' },
];

export interface MoreSheetProps {
    open: boolean;
    onClose: () => void;
}

/**
 * Mobile "More destinations" bottom sheet. Renders the admin-published
 * `siteNav.more` entries, falling back to a built-in set so the sheet is
 * never empty. Purely navigational — routes stay server-authorized.
 */
export default function MoreSheet({ open, onClose }: MoreSheetProps) {
    const { props, url } = usePage();
    const siteNav = (props.siteNav ?? {}) as SiteNav;
    const currentPath = url.split('?')[0];

    const items = useMemo(() => {
        const published = siteNav.more ?? [];
        return published.length ? published : FALLBACK_MORE;
    }, [siteNav.more]);

    const isActive = (target: string): boolean => {
        const path = target.split('?')[0];
        if (path === '/') return currentPath === '/';
        return currentPath === path || currentPath.startsWith(`${path}/`);
    };

    return (
        <Sheet open={open} onClose={onClose} title="More" description="All destinations in one place" variant="bottom">
            <ul className="grid grid-cols-3 gap-2 pb-2">
                {items.map((item) => {
                    const Icon = ICONS[item.icon ?? ''] ?? LayoutGrid;
                    const active = isActive(item.url);
                    const external = /^https?:\/\//i.test(item.url);
                    const className = `tap-safe flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 text-center transition-colors duration-fast ${
                        active ? 'bg-primary/[0.12] text-primary' : 'text-foreground hover:bg-muted/70'
                    }`;
                    const content = (
                        <>
                            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/[0.12] text-primary">
                                <Icon className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <span className="w-full truncate text-xs font-medium">{item.title}</span>
                        </>
                    );
                    return (
                        <li key={item.id}>
                            {external ? (
                                <a href={item.url} target={item.target === '_blank' ? '_blank' : undefined} rel="noreferrer" className={className} onClick={onClose}>
                                    {content}
                                </a>
                            ) : (
                                <Link href={item.url} className={className} onClick={onClose}>
                                    {content}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ul>
        </Sheet>
    );
}
