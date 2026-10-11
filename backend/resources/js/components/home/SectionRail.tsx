import { Link } from '@inertiajs/react';
import { Package, Star } from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import type { HomeSectionItem } from '@/types';

interface SectionRailProps {
    /** Stable hook for tests/e2e: `home-section-{key}`. */
    testId: string;
    title: string;
    items?: HomeSectionItem[];
    seeAllHref?: string;
}

function RailCard({ item }: { item: HomeSectionItem }) {
    return (
        <Link
            href={item.url}
            className="group w-40 shrink-0 overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
        >
            <div className="relative h-24 bg-muted">
                {item.image ? (
                    <img
                        src={item.image}
                        alt={item.title}
                        loading="lazy"
                        className="h-24 w-full object-cover"
                    />
                ) : (
                    <div className="flex h-24 w-full items-center justify-center text-muted-foreground">
                        <Package className="h-7 w-7" aria-hidden="true" />
                    </div>
                )}
                {item.badge && (
                    <span className="absolute left-1.5 top-1.5 rounded bg-primary/90 px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        {item.badge}
                    </span>
                )}
            </div>
            <div className="space-y-0.5 p-2">
                <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                {item.subtitle && (
                    <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                )}
                <div className="flex min-h-5 items-center justify-between gap-2">
                    {item.price != null && (
                        <span className="text-sm font-bold text-primary">
                            {formatPrice(item.price)}
                        </span>
                    )}
                    {item.rating != null && (
                        <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                            <Star className="h-3 w-3 fill-current text-yellow-500" aria-hidden="true" />
                            {item.rating}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}

/**
 * Generic Home vertical rail (spec S8 sections 11-24). Renders nothing
 * when the section has no real rows - empty sections are hidden, never
 * filled with placeholder content.
 */
export default function SectionRail({ testId, title, items = [], seeAllHref }: SectionRailProps) {
    if (items.length === 0) {
        return null;
    }

    return (
        <section data-testid={testId} className="space-y-3">
            <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-bold text-foreground md:text-lg">{title}</h2>
                {seeAllHref && (
                    <Link href={seeAllHref} className="text-sm font-medium text-primary hover:underline">
                        See all
                    </Link>
                )}
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
                {items.map((item) => (
                    <RailCard key={item.id} item={item} />
                ))}
            </div>
        </section>
    );
}
