import { type ReactNode, useEffect, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import NotificationBell from '@/components/notifications/NotificationBell';
import { getInitials } from '@/lib/utils';
import { useLanguage } from '@/lib/use-language';
import type { WorkspaceProps } from '@/types';
import type { ConsoleNavItem } from '@/config/consoleNavigation';
import WorkspaceSwitcher from '@/components/workspace/WorkspaceSwitcher';
import { Menu, X, ChevronDown, User, Settings, LogOut, ShieldCheck } from 'lucide-react';

interface ConsoleLayoutProps {
    children: ReactNode;
    title?: string;
    nav: ConsoleNavItem[];
    kind: 'admin' | 'provider';
}

interface ConsoleAuth {
    id?: string;
    name?: string;
    email?: string;
    roles?: string[];
    /** Effective permissions (role matrix ∪ per-user grants); ['*'] for super_admin. */
    permissions?: string[];
    user?: { id?: string; name?: string; email?: string };
}

/**
 * Shared console shell for non-customer workspaces (administration,
 * provider/worker). Customer-only elements (cart, bottom nav, storefront
 * footer) are deliberately absent. Navigation visibility is UX only —
 * backend route middleware remains the authority.
 */
/**
 * Console nav titles live in lang/{locale} under consoleNav.* — the
 * registry key is derived from the label itself, and every missing
 * translation gracefully falls back to the (still-correct) label so a
 * renamed menu entry can never render a raw translation key.
 */
const navSlug = (label: string): string =>
    label
        .trim()
        .split(/\s+/)
        .map((word, index) => {
            const clean = word.replace(/[^A-Za-z]/g, '');
            if (!clean) return '';
            return index === 0 ? clean.toLowerCase() : clean[0].toUpperCase() + clean.slice(1).toLowerCase();
        })
        .join('');

export default function ConsoleLayout({ children, title, nav, kind }: ConsoleLayoutProps) {
    const page = usePage();
    const { t } = useLanguage();
    const auth = page.props.auth as ConsoleAuth | null;
    const workspace = page.props.workspace as WorkspaceProps | null | undefined;
    const user = auth?.user ?? auth;
    const currentPath = page.url.split('?')[0];
    const isAdminPath = kind === 'admin';
    const hrefs = isAdminPath ? (workspace?.adminHrefs ?? null) : null;
    const permissions = isAdminPath ? (auth?.permissions ?? null) : null;

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

    // UX-only visibility (role hrefs AND optional per-entry permission):
    // server already rejects unauthorized visits either way.
    const visibleNav = nav.filter((item) => {
        if (hrefs !== null && !hrefs.includes(item.href)) return false;
        if (!item.permission || permissions === null) return true;
        return permissions.includes('*') || permissions.includes(item.permission);
    });
    const canViewCurrentPage =
        !isAdminPath || hrefs === null || hrefs.includes(currentPath) || (currentPath === '/admin' && hrefs.includes('/admin/dashboard'));

    const groups: string[] = [];
    for (const item of visibleNav) {
        if (!groups.includes(item.group)) groups.push(item.group);
    }

    const brandHref = kind === 'admin' ? '/admin/dashboard' : '/provider';
    const homeHref = kind === 'admin' ? '/dashboard' : '/dashboard';
    const uiTexts = (page.props as { uiTexts?: { ui?: Record<string, { value?: string }> } }).uiTexts;
    const adminBrand = uiTexts?.ui?.console_brand_admin?.value || 'EverythingNeed Admin';

    const navList = (
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
            {groups.map((group) => (
                <div key={group}>
                    <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t(`consoleNav.group.${navSlug(group)}`, { defaultValue: group })}
                    </p>
                    <div className="space-y-1">
                        {visibleNav
                            .filter((item) => item.group === group)
                            .map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ${
                                        currentPath === item.href || currentPath.startsWith(`${item.href}/`)
                                            ? 'bg-primary/[0.12] text-primary'
                                            : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                                    }`}
                                >
                                    <item.icon className="h-5 w-5 shrink-0" />
                                    {t(`consoleNav.${kind}.${navSlug(item.label)}`, { defaultValue: item.label })}
                                </Link>
                            ))}
                    </div>
                </div>
            ))}
        </nav>
    );

    return (
        <div className="min-h-dvh bg-background text-foreground">
            {/* Mobile sidebar */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-modal lg:hidden">
                    <div className="fixed inset-0 bg-black/45 backdrop-blur-[2px]" onClick={() => setSidebarOpen(false)} />
                    <div className="glass-3 fixed inset-y-0 left-0 z-modal w-72 border-r border-border/60">
                        <div className="flex h-full flex-col">
                            <div className="flex items-center justify-between p-4">
                                <Link href={brandHref} className="text-xl font-bold text-foreground">
                                    {kind === 'admin' ? adminBrand : t('console.providerBrand', { defaultValue: 'EverythingNeed Provider' })}
                                </Link>
                                <button type="button" aria-label={t('console.closeMenu', { defaultValue: 'Close menu' })} onClick={() => setSidebarOpen(false)} className="tap-safe rounded-full p-2 text-muted-foreground hover:bg-muted">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            {navList}
                            <div className="border-t border-border/60 p-4">
                                <Link href={homeHref} className="text-sm font-medium text-primary hover:underline">
                                    ← {t('console.backToMarketplace', { defaultValue: 'Back to marketplace' })}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop sidebar */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
                <div className="flex min-h-0 flex-1 flex-col border-r border-border/60 bg-card">
                    <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
                        <div className="flex flex-shrink-0 items-center px-4">
                            <Link href={brandHref} className="text-xl font-bold text-foreground">
                                {kind === 'admin' ? adminBrand : t('console.providerBrand', { defaultValue: 'EverythingNeed Provider' })}
                            </Link>
                        </div>
                        <div className="mt-8 flex-1">{navList}</div>
                    </div>
                    <div className="flex flex-shrink-0 border-t border-border/60 p-4">
                        <Link href={homeHref} className="text-sm font-medium text-primary hover:underline">
                            ← {t('console.backToMarketplace', { defaultValue: 'Back to marketplace' })}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main */}
            <div className="lg:pl-72">
                <div className="glass-2 sticky top-0 z-sticky flex h-16 shrink-0 items-center gap-x-4 border-b border-border/60 px-4 sm:gap-x-6 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        className="tap-safe -m-2.5 rounded-full p-2.5 text-foreground lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                        aria-label={t('console.openMenu', { defaultValue: 'Open menu' })}
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <div className="flex flex-1 items-center justify-end gap-x-4">
                        <WorkspaceSwitcher />
                        <NotificationBell />
                        <div className="relative">
                            <button
                                type="button"
                                className="-m-1.5 flex items-center p-1.5"
                                onClick={() => setProfileOpen(!profileOpen)}
                                aria-label={t('console.openProfile', { defaultValue: 'Open profile menu' })}
                                aria-expanded={profileOpen}
                                aria-haspopup="menu"
                            >
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/[0.85] text-primary-foreground">
                                    <span className="text-sm font-medium">{getInitials(user?.name ?? 'U')}</span>
                                </span>
                                <span className="ml-2 hidden text-sm font-semibold text-foreground lg:inline">
                                    {user?.name}
                                </span>
                                <ChevronDown className="ml-1 h-4 w-4 text-muted-foreground" />
                            </button>
                            {profileOpen && (
                                <button
                                    type="button"
                                    aria-label={t('console.closeProfile', { defaultValue: 'Close profile menu' })}
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
                                        <User className="h-4 w-4" />
                                        {t('console.profile', { defaultValue: 'Profile' })}
                                    </Link>
                                    <Link
                                        href="/settings"
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted/70"
                                        onClick={() => setProfileOpen(false)}
                                    >
                                        <Settings className="h-4 w-4" />
                                        {t('console.settings', { defaultValue: 'Settings' })}
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setProfileOpen(false);
                                            router.post('/logout');
                                        }}
                                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted/70"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        {t('console.signOut', { defaultValue: 'Sign out' })}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <main className="py-6">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        {title && (
                            <div className="mb-6">
                                <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
                            </div>
                        )}
                        {!canViewCurrentPage ? (
                            <div className="card rounded-lg bg-card p-12 text-center">
                                <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-medium text-foreground">{t('console.accessDenied', { defaultValue: 'Access denied' })}</h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {t('console.accessDeniedText', { defaultValue: 'Your role does not have access to this admin page.' })}
                                </p>
                                <Link
                                    href="/admin/dashboard"
                                    className="mt-6 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                                >
                                    {t('console.backToAdmin', { defaultValue: 'Back to Admin Dashboard' })}
                                </Link>
                            </div>
                        ) : (
                            children
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
