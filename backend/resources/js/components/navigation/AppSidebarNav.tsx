import { Link, usePage } from '@inertiajs/react';
import { matchesNavPath } from '@/config/consoleNavigation';
import { appNavigation, visibleAppNavigation } from '@/config/appNavigation';
import { useLanguage } from '@/lib/use-language';
import type { WorkspaceProps } from '@/types';

interface AppSidebarNavProps {
    className?: string;
    onNavigate?: () => void;
}

const navSlug = (name: string): string => {
    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+(.)/g, (_, c: string) => c.toUpperCase())
        .replace(/[^a-z0-9]/g, '');

    return slug === '' ? name.toLowerCase() : slug;
};

/**
 * Role-aware customer sidebar. Groups are always rendered from the same
 * registry; vendor/provider/admin groups only appear when the server says
 * that workspace is available to this account.
 */
export default function AppSidebarNav({ className = '', onNavigate }: AppSidebarNavProps) {
    const page = usePage();
    const { t } = useLanguage();
    const auth = page.props.auth as { roles?: string[] } | null;
    const workspace = page.props.workspace as WorkspaceProps | null | undefined;
    const currentPath = page.url.split('?')[0];

    const groups = visibleAppNavigation(appNavigation, {
        roles: auth?.roles ?? [],
        workspaces: workspace?.available ?? ['marketplace'],
    });

    return (
        <nav className={className}>
            {groups.map((group) => (
                <div key={group.label} className="mb-5 last:mb-0">
                    <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t(`sidebarGroup.${group.label.toLowerCase()}`, { defaultValue: group.label })}
                    </p>
                    <div className="space-y-1">
                        {group.items.map((item) => (
                            <Link
                                key={`${group.label}-${item.href}`}
                                href={item.href}
                                onClick={onNavigate}
                                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ${
                                    matchesNavPath(item.href, currentPath)
                                        ? 'bg-primary/[0.12] text-primary'
                                        : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                                }`}
                            >
                                <item.icon className="h-5 w-5 shrink-0" />
                                {t(`sidebar.${navSlug(item.name)}`, { defaultValue: item.name })}
                            </Link>
                        ))}
                    </div>
                </div>
            ))}
        </nav>
    );
}
