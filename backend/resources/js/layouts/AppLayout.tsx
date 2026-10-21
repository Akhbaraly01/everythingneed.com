import { type ReactNode } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import GlobalSearch from '@/components/shared/GlobalSearch';
import Footer from '@/components/Marketplace/Footer';
import NotificationBell from '@/components/notifications/NotificationBell';
import { CartDrawerProvider } from '@/components/cart/CartDrawerContext';
import GlobalCartDrawer from '@/components/cart/GlobalCartDrawer';
import CompareDrawer from '@/components/compare/CompareDrawer';
import PushNotificationPrompt from '@/components/notifications/PushNotificationPrompt';
import WorkspaceSwitcher from '@/components/workspace/WorkspaceSwitcher';
import AppSidebarNav from '@/components/navigation/AppSidebarNav';
import { getInitials } from '@/lib/utils';
import { useLanguage } from '@/lib/use-language';
import {
    LogOut,
    Menu,
    X,
    ChevronDown,
    User,
    Settings,
    CreditCard,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    title?: string;
}

// NOTE: administration navigation was removed from the customer shell.
// Admin pages render inside resources/js/layouts/AdminLayout.tsx and pull
// their nav from config/consoleNavigation.ts (filtered server-side by
// workspace.adminHrefs). Server middleware remains the only authority.

export default function AppLayout(props: AppLayoutProps) {
    return (
        <CartDrawerProvider>
            <AppLayoutShell {...props} />
            <GlobalCartDrawer />
            <CompareDrawer />
            <PushNotificationPrompt />
        </CartDrawerProvider>
    );
}

function AppLayoutShell({ children, title }: AppLayoutProps) {
    const auth = usePage().props.auth as { id: string; name: string; email: string; roles?: string[] } | null;
    const user = (auth as unknown as { user?: { id: string; name: string; email: string } })?.user ?? auth;
    const page = usePage();
    const { t } = useLanguage();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    useEffect(() => {
        if (!profileOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setProfileOpen(false);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [profileOpen]);

    return (
        <div className="min-h-dvh bg-background text-foreground">
            {/* Mobile sidebar */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-modal lg:hidden">
                    <div className="fixed inset-0 bg-black/45 backdrop-blur-[2px]" onClick={() => setSidebarOpen(false)} />
                    <div className="glass-3 fixed inset-y-0 left-0 z-modal w-72 border-r border-border/60">
                        <div className="flex h-full flex-col">
                            <div className="flex items-center justify-between p-4">
                                <Link href="/dashboard" className="text-xl font-bold text-foreground">
                                    EverythingNeed
                                </Link>
                                <button type="button" aria-label={t('console.closeMenu')} onClick={() => setSidebarOpen(false)} className="tap-safe rounded-full p-2 text-muted-foreground hover:bg-muted">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            <AppSidebarNav
                                className="flex-1 space-y-1 overflow-y-auto px-3 pb-[var(--dock-clearance)]"
                                onNavigate={() => setSidebarOpen(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
            {/* Desktop sidebar */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
                <div className="flex min-h-0 flex-1 flex-col border-r border-border/60 bg-card">
                    <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
                        <div className="flex flex-shrink-0 items-center px-4">
                            <Link href="/dashboard" className="text-xl font-bold text-foreground">
                                EverythingNeed
                            </Link>
                        </div>
                        <AppSidebarNav className="mt-8 flex-1 space-y-1 overflow-y-auto px-3" />
                    </div>
                    <div className="flex flex-shrink-0 border-t border-border/60 p-4">
                        <div className="group block w-full flex-shrink-0">
                            <div className="flex items-center">
                                <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/[0.85] text-primary-foreground">
                                    <span className="text-sm font-medium">
                                        {getInitials(user?.name ?? 'U')}
                                    </span>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-foreground">{user?.name}</p>
                                    <p className="text-xs font-medium text-muted-foreground">{user?.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Main content */}
            <div className="lg:pl-72">
                {/* Top bar */}
                <div className="glass-2 sticky top-0 z-sticky flex h-16 shrink-0 items-center gap-x-4 border-b border-border/60 px-4 sm:gap-x-6 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        className="tap-safe -m-2.5 rounded-full p-2.5 text-foreground lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                        aria-label={t('console.openMenu')}
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                        <GlobalSearch
                            onSubmit={(value) => {
                                router.visit(
                                    value ? `/search?q=${encodeURIComponent(value)}` : '/search',
                                    { preserveState: false },
                                );
                            }}
                        />
                        <div className="flex flex-1" />
                        <div className="flex items-center gap-x-4 lg:gap-x-6">
                            <WorkspaceSwitcher />
                            <NotificationBell />
                            {/* Profile dropdown */}
                            <div className="relative">
                                <button
                                    type="button"
                                    className="-m-1.5 flex items-center p-1.5"
                                    onClick={() => setProfileOpen(!profileOpen)}
                                    aria-label={t('console.openProfile')}
                                    aria-expanded={profileOpen}
                                    aria-haspopup="menu"
                                >
                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/[0.85] text-primary-foreground">
                                        <span className="text-sm font-medium">
                                            {getInitials(user?.name ?? 'U')}
                                        </span>
                                    </span>
                                    <span className="hidden lg:flex lg:items-center">
                                        <span className="ml-2 text-sm font-semibold text-foreground">
                                            {user?.name}
                                        </span>
                                        <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
                                    </span>
                                </button>
                                {profileOpen && (
                                    <button
                                        type="button"
                                        aria-label={t('console.closeProfile')}
                                        onClick={() => setProfileOpen(false)}
                                        className="fixed inset-0 z-[5] cursor-default bg-transparent"
                                    />
                                )}
                                {profileOpen && (
                                    <div className="glass-3 glass-edge absolute right-0 z-modal mt-2 w-48 origin-top-right rounded-xl py-1">
                                        <Link
                                            href="/profile"
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted/70"
                                            onClick={() => setProfileOpen(false)}
                                        >
                                            <User className="h-4 w-4" /> {t('console.profile')}
                                        </Link>
                                        <Link
                                            href="/settings"
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted/70"
                                            onClick={() => setProfileOpen(false)}
                                        >
                                            <Settings className="h-4 w-4" /> {t('console.settings')}
                                        </Link>
                                        <Link
                                            href="/wallet"
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted/70"
                                            onClick={() => setProfileOpen(false)}
                                        >
                                            <CreditCard className="h-4 w-4" /> {t('sidebar.wallet', { defaultValue: 'Wallet' })}
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setProfileOpen(false);
                                                router.post('/logout');
                                            }}
                                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted/70"
                                        >
                                            <LogOut className="h-4 w-4" /> {t('console.signOut')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                {/* Page content */}
                <main className="py-6">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        {title && (
                            <div className="mb-6">
                                <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
                            </div>
                        )}
                        {children}
                    </div>
                </main>
                <Footer
                    socialLinks={
                        (page.props.socialLinks as { facebook?: string | null; twitter?: string | null; instagram?: string | null; linkedin?: string | null; youtube?: string | null }) ?? {}
                    }
                    appLinks={(page.props.appLinks as { ios?: string | null; android?: string | null }) ?? {}}
                />
            </div>
        </div>
    );
}
