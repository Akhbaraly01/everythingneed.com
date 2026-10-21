/**
 * Pure presentation helpers for the admin RBAC console. Everything here is
 * UI-side derivation only — the server remains the source of truth for
 * which roles exist and what they may do.
 */

export interface RbacMatrixRow {
    role: string;
    label?: string;
    permissions: string[];
    user_count?: number;
    is_core?: boolean;
    is_custom?: boolean;
    /** Built-in role a super admin took out of service. */
    is_retired?: boolean;
}

export interface RbacStatsShape {
    totalRoles: number;
    totalPermissions: number;
    coreRoles: number;
    assignments: number;
}

export interface CatalogGroup {
    module: string;
    permissions: string[];
}

export interface RoleSelectionDiff {
    grant: string[];
    revoke: string[];
}

/** Mirrors the server-side slug rule (RoleRegistry::normalizeSlug target). */
export const ROLE_SLUG_PATTERN = /^[a-z][a-z0-9_]{2,39}$/;

/** 'regional_ops' -> 'Regional Ops'. */
export function humanizeRole(slug: string): string {
    return slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Display label for a role row (server label wins, slug fallback). */
export function roleLabel(row: { role: string; label?: string }): string {
    return row.label && row.label.trim() !== '' ? row.label : humanizeRole(row.role);
}

/**
 * Mirror of Core\Services\RoleRegistry::normalizeSlug for the live slug
 * preview: lowercase snake_case, first character a letter, max 40 chars.
 */
export function slugifyRole(name: string): string {
    const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 40)
        .replace(/_+$/g, '');

    return slug.replace(/^[0-9_]+/, '');
}

/** Core / Custom / Built-in badge for a role card. */
export function roleBadge(row: { is_core?: boolean; is_custom?: boolean }): {
    label: string;
    className: string;
} {
    if (row.is_custom) {
        return { label: 'Custom', className: 'bg-secondary/15 text-secondary' };
    }

    if (row.is_core) {
        return {
            label: 'Core',
            className:
                'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
        };
    }

    return { label: 'Built-in', className: 'bg-muted text-muted-foreground' };
}

/** Headline numbers for the stats strip. */
export function matrixStats(rows: RbacMatrixRow[], catalogSize: number): RbacStatsShape {
    return {
        totalRoles: rows.length,
        totalPermissions: catalogSize,
        coreRoles: rows.filter((row) => row.is_core === true).length,
        assignments: rows.reduce((total, row) => total + (row.user_count ?? 0), 0),
    };
}

/** Group the flat catalog by module prefix, preserving catalog order. */
export function groupCatalog(catalog: string[]): CatalogGroup[] {
    const groups = new Map<string, string[]>();

    for (const permission of catalog) {
        const module = permission.split('.')[0] ?? permission;
        const bucket = groups.get(module);

        if (bucket) {
            bucket.push(permission);
        } else {
            groups.set(module, [permission]);
        }
    }

    return Array.from(groups, ([module, permissions]) => ({ module, permissions }));
}

/** Case-insensitive substring filter over the permission catalog. */
export function filterCatalog(catalog: string[], query: string): string[] {
    const q = query.trim().toLowerCase();

    if (q === '') {
        return catalog;
    }

    return catalog.filter((permission) => permission.toLowerCase().includes(q));
}

/**
 * Diff a picked permission set against the currently granted set.
 * Permissions picked while denied land in `grant` (restore); permissions
 * dropped from the granted set land in `revoke` (reversible deny).
 */
export function diffRoleSelection(selected: Iterable<string>, granted: string[]): RoleSelectionDiff {
    const selectedSet = new Set(selected);
    const grantedSet = new Set(granted);

    return {
        grant: Array.from(selectedSet).filter((permission) => !grantedSet.has(permission)),
        revoke: granted.filter((permission) => !selectedSet.has(permission)),
    };
}
