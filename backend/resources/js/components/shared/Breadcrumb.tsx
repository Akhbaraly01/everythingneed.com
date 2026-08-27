import { Link } from '@inertiajs/react';
import { ChevronRight, Home } from 'lucide-react';

interface Crumb { label: string; href?: string; }

export default function Breadcrumb({ items }: { items: Crumb[] }) {
    return (
        <nav className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/dashboard" className="hover:text-gray-700 dark:hover:text-gray-200"><Home className="h-4 w-4" /></Link>
            {items.map((c, i) => (
                <span key={i} className="flex items-center gap-1">
                    <ChevronRight className="h-3 w-3" />
                    {c.href ? <Link href={c.href} className="hover:text-gray-700 dark:hover:text-gray-200 hover:underline">{c.label}</Link> : <span className="font-medium text-gray-900 dark:text-white">{c.label}</span>}
                </span>
            ))}
        </nav>
    );
}
