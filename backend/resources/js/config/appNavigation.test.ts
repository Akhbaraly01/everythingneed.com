import { describe, expect, it } from 'vitest';
import { appNavigation, visibleAppNavigation } from '@/config/appNavigation';

describe('customer navigation registry', () => {
    it('registers every customer destination exactly once', () => {
        const hrefs = appNavigation.flatMap((group) => group.items.map((item) => item.href));

        expect(hrefs.length).toBeGreaterThan(50);
        expect(new Set(hrefs).size).toBe(hrefs.length);
        expect(hrefs.every((href) => href.startsWith('/'))).toBe(true);
    });

    it('keeps the customer groups for a plain account', () => {
        const groups = visibleAppNavigation(appNavigation, {
            roles: ['user'],
            workspaces: ['marketplace'],
        });
        const labels = groups.map((group) => group.label);

        expect(labels).toContain('Shop');
        expect(labels).toContain('Account');
        expect(labels).not.toContain('Vendor');
        expect(labels).not.toContain('Provider');
        expect(labels).not.toContain('Admin');
    });

    it('unlocks the vendor group only for the vendor workspace', () => {
        const groups = visibleAppNavigation(appNavigation, {
            roles: ['vendor_admin'],
            workspaces: ['marketplace', 'vendor'],
        });
        const labels = groups.map((group) => group.label);

        expect(labels).toContain('Vendor');
        expect(labels).not.toContain('Provider');
        expect(labels).not.toContain('Admin');
    });

    it('unlocks the provider group only for the provider workspace', () => {
        const groups = visibleAppNavigation(appNavigation, {
            roles: ['worker'],
            workspaces: ['marketplace', 'provider'],
        });
        const labels = groups.map((group) => group.label);

        expect(labels).toContain('Provider');
        expect(labels).not.toContain('Vendor');
        expect(labels).not.toContain('Admin');
    });

    it('adds the administration entry for console users', () => {
        const groups = visibleAppNavigation(appNavigation, {
            roles: ['super_admin'],
            workspaces: ['marketplace', 'admin'],
        });
        const admin = groups.find((group) => group.label === 'Admin');

        expect(admin?.items.map((item) => item.href)).toEqual(['/admin/dashboard']);
    });

    it('drops groups whose every item is role-filtered out', () => {
        const groups = visibleAppNavigation(
            [{ label: 'Test', items: [{ name: 'Secret', href: '/secret', icon: appNavigation[0].items[0].icon, roles: ['nobody'] }] }],
            { roles: ['user'], workspaces: ['marketplace'] },
        );

        expect(groups).toEqual([]);
    });
});
