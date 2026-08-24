import { type ReactNode } from 'react';
import { Link } from '@inertiajs/react';

interface GuestLayoutProps {
    children: ReactNode;
}

export default function GuestLayout({ children }: GuestLayoutProps) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <nav className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
                            EverythingNeed
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link
                                href="/login"
                                className="text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                            >
                                Log in
                            </Link>
                            <Link
                                href="/register"
                                className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                            >
                                Register
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>
            <main>{children}</main>
        </div>
    );
}
