import { Link } from '@inertiajs/react';
import { type ReactNode } from 'react';

interface AuthLayoutProps {
    children: ReactNode;
    title?: string;
    description?: string;
}

export default function AuthLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <div className="container mx-auto px-4 py-4">
                <Link href="/dashboard" className="inline-flex items-center gap-2">
                    <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-2xl font-bold text-transparent">
                        {title ?? 'everythingneed.com'}
                    </span>
                </Link>
                {description && (
                    <p className="mt-1 text-center text-sm text-muted-foreground">{description}</p>
                )}
            </div>
            <div className="flex flex-1 items-center justify-center px-4 py-8">
                <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
                    {children}
                </div>
            </div>
        </div>
    );
}
