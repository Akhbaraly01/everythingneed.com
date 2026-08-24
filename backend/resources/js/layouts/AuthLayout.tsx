import { Link } from '@inertiajs/react';
import { type ReactNode } from 'react';

interface AuthLayoutProps {
    children: ReactNode;
    title?: string;
    description?: string;
}

export default function AuthLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-gray-50 dark:bg-gray-900 sm:justify-center sm:px-6">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <Link href="/" className="flex justify-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">EverythingNeed</h1>
                </Link>
                {title && (
                    <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900 dark:text-white">
                        {title}
                    </h2>
                )}
                {description && (
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        {description}
                    </p>
                )}
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white px-6 py-8 shadow dark:bg-gray-800 sm:rounded-lg sm:px-12">
                    {children}
                </div>
            </div>
        </div>
    );
}
