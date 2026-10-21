import { describe, expect, it } from 'vitest';
import {
    adminNavigation,
    adminRouteAliases,
    canViewAdminPath,
    matchesNavPath,
} from '@/config/consoleNavigation';

describe('console nav path matching', () => {
    it('matches the exact href and detail routes beneath it', () => {
        expect(matchesNavPath('/admin/users', '/admin/users')).toBe(true);
        expect(matchesNavPath('/admin/users', '/admin/users/7d1c')).toBe(true);
        expect(matchesNavPath('/admin/users', '/admin/users-archive')).toBe(false);
        expect(matchesNavPath('/admin/support/tickets', '/admin/support/tickets/42')).toBe(true);
    });

    it('accepts the shared aliases only when their target is visible', () => {
        expect(canViewAdminPath('/admin', ['/admin/dashboard'])).toBe(true);
        expect(canViewAdminPath('/admin/category', ['/admin/categories'])).toBe(true);
        expect(canViewAdminPath('/admin/roles', ['/admin/rbac'])).toBe(true);
        expect(canViewAdminPath('/admin/support', ['/admin/support/tickets'])).toBe(true);
        expect(canViewAdminPath('/admin', ['/admin/products'])).toBe(false);
    });

    it('keeps detail pages visible for their index permission', () => {
        expect(canViewAdminPath('/admin/users/abc', ['/admin/users'])).toBe(true);
        expect(canViewAdminPath('/admin/orders/abc', ['/admin/orders'])).toBe(true);
        expect(canViewAdminPath('/admin/users/abc', ['/admin/orders'])).toBe(false);
    });

    it('treats an unknown href list as fully visible (non-admin console)', () => {
        expect(canViewAdminPath('/admin/anything', null)).toBe(true);
    });
});

describe('super admin console registry', () => {
    it('registers every sidebar destination exactly once', () => {
        const hrefs = adminNavigation.map((item) => item.href);

        expect(hrefs).toHaveLength(50);
        expect(new Set(hrefs).size).toBe(hrefs.length);
        expect(hrefs.every((href) => href.startsWith('/admin'))).toBe(true);
    });

    it('covers the grouped super admin destinations', () => {
        const hrefs = new Set(adminNavigation.map((item) => item.href));

        for (const expected of [
            '/admin/dashboard',
            '/admin/users',
            '/admin/rbac',
            '/admin/products',
            '/admin/orders',
            '/admin/finance',
            '/admin/payouts',
            '/admin/healthcare/doctors',
            '/admin/learning/courses',
            '/admin/cms',
            '/admin/media',
            '/admin/hotels',
            '/admin/needs',
            '/admin/messaging',
            '/admin/support/tickets',
            '/admin/audit-logs',
            '/admin/settings',
        ]) {
            expect(hrefs.has(expected), expected).toBe(true);
        }
    });

    it('gives every entry except the dashboard a canonical permission', () => {
        for (const item of adminNavigation) {
            if (item.href === '/admin/dashboard') {
                expect(item.permission).toBeUndefined();
                continue;
            }

            expect(item.permission, item.href).toBeTruthy();
        }
    });

    it('points every alias at a registered console entry', () => {
        const hrefs = new Set(adminNavigation.map((item) => item.href));

        for (const [alias, target] of Object.entries(adminRouteAliases)) {
            expect(hrefs.has(target), `${alias} -> ${target}`).toBe(true);
        }
    });
});
