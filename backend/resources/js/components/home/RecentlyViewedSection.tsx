import { Link } from '@inertiajs/react';
import { Clock } from 'lucide-react';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useLanguage } from '@/lib/use-language';
import { formatPrice } from '@/lib/currency';

/**
 * Recently Viewed rail (compact): tight card, small heading, thumbnail
 * items — a slim strip, not a hero. Source stays localStorage
 * (`recently_viewed_products`), written by the product detail page; the
 * authed `/api/recently-viewed` endpoint is the future server source.
 * Empty state renders honest helper copy.
 */
export default function RecentlyViewedSection() {
    const { recentlyViewed } = useRecentlyViewed();
    const { t } = useLanguage();

    return (
        <section
            data-testid="home-section-recently-viewed"
            className="bg-white p-3 rounded-xl shadow dark:bg-gray-800 md:p-4"
        >
            <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-bold md:text-base" data-testid="recently-viewed-heading">
                        {t('home.recentlyViewed')}
                    </h2>
                </div>
                <Link
                    href="/recently-viewed"
                    className="shrink-0 text-xs font-medium text-primary hover:underline"
                >
                    {t('nav.seeAll')} &gt;
                </Link>
            </div>
            {recentlyViewed.length === 0 ? (
                <p className="py-2 text-center text-xs text-muted-foreground">
                    {t('home.noRecentlyViewed')}
                </p>
            ) : (
                <div
                    className="flex gap-2 overflow-x-auto pb-1"
                    data-testid="recently-viewed-list"
                    style={{ scrollbarWidth: 'none' }}
                >
                    {recentlyViewed.map((item) => (
                        <Link
                            key={item.id}
                            href={`/products/${item.slug ?? item.id}`}
                            className="w-24 flex-shrink-0 md:w-28"
                            data-testid="recently-viewed-item"
                            data-product-id={item.id}
                        >
                            <div className="overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 hover:scale-[1.03] hover:shadow-lg">
                                <div className="h-20 bg-muted md:h-24">
                                    {item.image && (
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                        />
                                    )}
                                </div>
                                <div className="p-1.5">
                                    <p className="line-clamp-2 min-h-7 text-[11px] font-medium leading-tight">{item.name}</p>
                                    <p className="mt-0.5 text-[13px] font-bold text-primary">
                                        {formatPrice(item.price)}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </section>
    );
}
