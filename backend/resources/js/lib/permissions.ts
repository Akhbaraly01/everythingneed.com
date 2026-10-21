import { usePage } from '@inertiajs/react';

export interface AuthPermissions {
    roles: string[];
    permissions: string[];
}

export function useAuthPermissions(): AuthPermissions & {
    can: (...needed: string[]) => boolean;
} {
    const auth = usePage().props.auth as Partial<AuthPermissions> | null;
    const roles = auth?.roles ?? [];
    const permissions = auth?.permissions ?? [];
    const can = (...needed: string[]): boolean =>
        permissions.includes('*') ||
        needed.some((permission) => permissions.includes(permission));

    return { roles, permissions, can };
}
