import { type ReactNode, useEffect, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import Header from '@/components/Marketplace/Header';
import BottomNav from '@/components/Marketplace/BottomNav';
import Footer from '@/components/Marketplace/Footer';
import { FloatingChat, FloatingCart } from '@/components/Marketplace/FloatingButtons';
import CommandPalette from '@/components/navigation/CommandPalette';
import { CartDrawerProvider } from '@/components/cart/CartDrawerContext';
import GlobalCartDrawer from '@/components/cart/GlobalCartDrawer';
import CompareDrawer from '@/components/compare/CompareDrawer';
import PushNotificationPrompt from '@/components/notifications/PushNotificationPrompt';

interface SocialLinks {
    facebook?: string | null;
    twitter?: string | null;
    instagram?: string | null;
    linkedin?: string | null;
    youtube?: string | null;
}

interface AppLinks {
    ios?: string | null;
    android?: string | null;
}

interface MarketplaceLayoutProps {
    children: ReactNode;
    title?: string;
    cartCount?: number;
    notificationCount?: number;
    socialLinks?: SocialLinks;
    appLinks?: AppLinks;
}

function MarketplaceShell({
    children,
    title = 'EverythingNeed',
    cartCount,
    socialLinks,
    appLinks,
}: MarketplaceLayoutProps) {
    const { props } = usePage();
    const sharedCartCount = (props.cartCount as number | undefined) ?? 0;
    const effectiveCartCount = cartCount ?? sharedCartCount;
    const sharedSocials = (props.socialLinks as SocialLinks | undefined) ?? {};
    const sharedApps = (props.appLinks as AppLinks | undefined) ?? {};
    const [paletteOpen, setPaletteOpen] = useState(false);

    // ⌘K / Ctrl+K opens the command palette (desktop power-user affordance).
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                setPaletteOpen((v) => !v);
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    return (
        <div className="min-h-dvh flex flex-col bg-background">
            <Head title={title} />
            <Header cartCount={effectiveCartCount} />
            {/* Clearance for the mobile dock + action cluster (tokenized). */}
            <main className="flex-1 pb-[var(--dock-clearance)] md:pb-6">{children}</main>
            <Footer socialLinks={{ ...sharedSocials, ...socialLinks }} appLinks={{ ...sharedApps, ...appLinks }} />
            <BottomNav cartCount={effectiveCartCount} />
            <FloatingChat />
            <FloatingCart count={effectiveCartCount} />
            <GlobalCartDrawer />
            <CompareDrawer />
            <PushNotificationPrompt />
            <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
        </div>
    );
}

export default function MarketplaceLayout(props: MarketplaceLayoutProps) {
    return (
        <CartDrawerProvider>
            <MarketplaceShell {...props} />
        </CartDrawerProvider>
    );
}
