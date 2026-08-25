import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
    currentPage: number;
    lastPage: number;
    /** Route path with :page placeholder, e.g. "/tasks?page=:page" */
    hrefFor: (page: number) => string;
}

/** Shared Inertia paginator — preserves state across page hops. */
export default function Pagination({ currentPage, lastPage, hrefFor }: Props) {
    if (lastPage <= 1) return null;

    return (
        <div className="mt-6 flex items-center justify-center gap-3">
            {currentPage > 1 ? (
                <Link href={hrefFor(currentPage - 1)} preserveState className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:text-white">
                    <ChevronLeft className="h-4 w-4" />
                </Link>
            ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-300 dark:border-gray-700">
                    <ChevronLeft className="h-4 w-4" />
                </span>
            )}
            <span className="text-sm text-gray-600 dark:text-gray-300">Page {currentPage} of {lastPage}</span>
            {currentPage < lastPage ? (
                <Link href={hrefFor(currentPage + 1)} preserveState className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:text-white">
                    <ChevronRight className="h-4 w-4" />
                </Link>
            ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-300 dark:border-gray-700">
                    <ChevronRight className="h-4 w-4" />
                </span>
            )}
        </div>
    );
}
