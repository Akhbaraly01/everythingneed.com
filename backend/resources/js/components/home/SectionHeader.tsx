import { Link } from '@inertiajs/react';

interface SectionHeaderProps {
    title: string;
    link?: string;
    linkLabel?: string;
}

/**
 * Shared Home section header (Home rebuild): title left, See-all link
 * pinned right. SectionRail renders this — one header implementation.
 */
export default function SectionHeader({ title, link, linkLabel = 'See all >' }: SectionHeaderProps) {
    return (
        <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-foreground md:text-lg">{title}</h2>
            {link && (
                <Link href={link} className="shrink-0 text-sm font-medium text-primary hover:underline">
                    {linkLabel}
                </Link>
            )}
        </div>
    );
}
