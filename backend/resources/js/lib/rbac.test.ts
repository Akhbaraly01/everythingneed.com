import { describe, expect, it } from 'vitest';
import {
    ROLE_SLUG_PATTERN,
    diffRoleSelection,
    filterCatalog,
    groupCatalog,
    humanizeRole,
    matrixStats,
    roleBadge,
    roleLabel,
    slugifyRole,
} from '@/lib/rbac';

describe('role labels', () => {
    it('prefers the server label and falls back to a humanized slug', () => {
        expect(roleLabel({ role: 'regional_ops', label: 'Regional Ops' })).toBe('Regional Ops');
        expect(roleLabel({ role: 'regional_ops' })).toBe('Regional Ops');
        expect(roleLabel({ role: 'super_admin', label: '   ' })).toBe('Super Admin');
    });

    it('humanizes snake_case slugs', () => {
        expect(humanizeRole('learning_reviewer')).toBe('Learning Reviewer');
    });
});

describe('slug generation', () => {
    it('mirrors the server normalizeSlug rules', () => {
        expect(slugifyRole('Regional Ops Lead')).toBe('regional_ops_lead');
        expect(slugifyRole('  Finance  Team! ')).toBe('finance_team');
        expect(slugifyRole('123 Numbers First')).toBe('numbers_first');
    });

    it('caps length at 40 characters', () => {
        const slug = slugifyRole('a'.repeat(60));
        expect(slug.length).toBeLessThanOrEqual(40);
        expect(ROLE_SLUG_PATTERN.test(slug)).toBe(true);
    });

    it('only accepts valid slug shapes', () => {
        expect(ROLE_SLUG_PATTERN.test('regional_ops')).toBe(true);
        expect(ROLE_SLUG_PATTERN.test('ab')).toBe(false);
        expect(ROLE_SLUG_PATTERN.test('9lives')).toBe(false);
        expect(ROLE_SLUG_PATTERN.test('Bad-Slug')).toBe(false);
    });
});

describe('role badges', () => {
    it('marks custom, core and built-in roles distinctly', () => {
        expect(roleBadge({ is_custom: true }).label).toBe('Custom');
        expect(roleBadge({ is_core: true }).label).toBe('Core');
        expect(roleBadge({}).label).toBe('Built-in');
    });
});

describe('matrix stats', () => {
    it('aggregates roles, core roles and assignments', () => {
        const stats = matrixStats(
            [
                { role: 'super_admin', permissions: [], is_core: true, user_count: 2 },
                { role: 'moderator', permissions: [], user_count: 3 },
                { role: 'regional_ops', permissions: [], is_custom: true, user_count: 0 },
            ],
            210,
        );

        expect(stats).toEqual({
            totalRoles: 3,
            totalPermissions: 210,
            coreRoles: 1,
            assignments: 5,
        });
    });
});

describe('catalog presentation', () => {
    it('groups permissions by module preserving order', () => {
        const groups = groupCatalog([
            'products.products.view',
            'products.products.create',
            'orders.orders.view',
        ]);

        expect(groups.map((g) => g.module)).toEqual(['products', 'orders']);
        expect(groups[0].permissions).toEqual([
            'products.products.view',
            'products.products.create',
        ]);
    });

    it('filters case-insensitively', () => {
        expect(filterCatalog(['products.products.view', 'orders.orders.view'], 'ORDERS')).toEqual([
            'orders.orders.view',
        ]);
        expect(filterCatalog(['a.b.c'], '   ')).toEqual(['a.b.c']);
    });
});

describe('selection diffing', () => {
    it('classifies picked and dropped permissions for a bulk save', () => {
        const diff = diffRoleSelection(
            ['products.products.view', 'analytics.overview.export'],
            ['products.products.view', 'orders.orders.view'],
        );

        expect(diff.grant).toEqual(['analytics.overview.export']);
        expect(diff.revoke).toEqual(['orders.orders.view']);
    });

    it('treats restoring a denied permission as a grant', () => {
        const diff = diffRoleSelection(['orders.orders.refund'], ['products.products.view']);

        expect(diff.grant).toEqual(['orders.orders.refund']);
        expect(diff.revoke).toEqual(['products.products.view']);
    });

    it('reports no changes for an untouched selection', () => {
        expect(diffRoleSelection(['a.b.c', 'd.e.f'], ['a.b.c', 'd.e.f'])).toEqual({
            grant: [],
            revoke: [],
        });
    });
});
