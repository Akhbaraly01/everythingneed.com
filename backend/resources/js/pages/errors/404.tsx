import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';

export default function NotFound() {
    return (
        <AppLayout title="Page not found">
            <Head title="Page not found" />
            <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
                <p className="text-6xl font-bold text-muted-foreground">404</p>
                <h1 className="mt-4 text-xl font-semibold">Page not found</h1>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    The page you are looking for does not exist or may have been moved.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <Link href="/" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
                        Go home
                    </Link>
                    <Link href="/products" className="rounded-md border px-4 py-2 text-sm">
                        Browse products
                    </Link>
                    <Link href="/tickets" className="rounded-md border px-4 py-2 text-sm">
                        Get help
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}
