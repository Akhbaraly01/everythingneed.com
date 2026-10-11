import { type ReactNode } from 'react';
import ConsoleLayout from '@/layouts/ConsoleLayout';
import { adminNavigation } from '@/config/consoleNavigation';

interface AdminLayoutProps {
    children: ReactNode;
    title?: string;
}

/**
 * Administration console shell. No customer cart, bottom nav, storefront
 * menus or marketplace footer — authorization enforced server-side.
 */
export default function AdminLayout({ children, title }: AdminLayoutProps) {
    return (
        <ConsoleLayout nav={adminNavigation} kind="admin" title={title}>
            {children}
        </ConsoleLayout>
    );
}
