import { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import type { WorkspaceProps } from '@/types';
import { ChevronsUpDown, Check, Store, LayoutDashboard, ShieldCheck, Briefcase } from 'lucide-react';

const WORKSPACE_META: Record<string, { label: string; icon: typeof ShieldCheck; path: string }> = {
    marketplace: { label: 'Marketplace', icon: LayoutDashboard, path: '/dashboard' },
    admin: { label: 'Administration', icon: ShieldCheck, path: '/admin/dashboard' },
    vendor: { label: 'Vendor Portal', icon: Store, path: '/vendor' },
    provider: { label: 'Provider Workspace', icon: Briefcase, path: '/provider' },
};

/**
 * Workspace switcher (UX only). Every target is a normal route that the
 * backend re-authorizes on each request — switching URLs grants nothing.
 */
export default function WorkspaceSwitcher() {
    const page = usePage();
    const workspace = page.props.workspace as WorkspaceProps | null | undefined;
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open]);

    if (!workspace || (workspace.available?.length ?? 0) < 2) return null;

    const targetFor = (key: string): string => {
        if (key === 'admin') {
            return workspace.landing && workspace.landing.startsWith('/admin') ? workspace.landing : '/admin/dashboard';
        }
        return WORKSPACE_META[key]?.path ?? '/dashboard';
    };

    const currentMeta = WORKSPACE_META[workspace.current] ?? WORKSPACE_META.marketplace;
    const CurrentIcon = currentMeta.icon;

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                aria-label="Switch workspace"
                aria-expanded={open}
                aria-haspopup="menu"
                className="tap-safe flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/70"
            >
                <CurrentIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{currentMeta.label}</span>
                <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
            </button>
            {open && (
                <button
                    type="button"
                    aria-label="Close workspace menu"
                    onClick={() => setOpen(false)}
                    className="fixed inset-0 z-[5] cursor-default bg-transparent"
                />
            )}
            {open && (
                <div
                    role="menu"
                    className="glass-3 glass-edge absolute right-0 z-modal mt-2 w-56 origin-top-right rounded-xl py-1"
                >
                    <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Switch workspace</p>
                    {workspace.available.map((key) => {
                        const meta = WORKSPACE_META[key];
                        if (!meta) return null;
                        const Icon = meta.icon;
                        const isActive = key === workspace.current;
                        return (
                            <Link
                                key={key}
                                href={targetFor(key)}
                                role="menuitem"
                                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${isActive ? 'font-semibold text-primary' : 'text-foreground hover:bg-muted/70'}`}
                                onClick={() => setOpen(false)}
                            >
                                <Icon className="h-4 w-4" />
                                <span className="flex-1">{meta.label}</span>
                                {isActive && <Check className="h-4 w-4" />}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
