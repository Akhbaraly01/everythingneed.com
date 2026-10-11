import { type ReactNode } from 'react';
import ConsoleLayout from '@/layouts/ConsoleLayout';
import { providerNavigation } from '@/config/consoleNavigation';

interface ProviderLayoutProps {
    children: ReactNode;
    title?: string;
}

/** Provider/worker console shell — own applications, tasks and jobs. */
export default function ProviderLayout({ children, title }: ProviderLayoutProps) {
    return (
        <ConsoleLayout nav={providerNavigation} kind="provider" title={title}>
            {children}
        </ConsoleLayout>
    );
}
