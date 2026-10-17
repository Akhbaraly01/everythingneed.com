import { Head, Link } from '@inertiajs/react';
import { Clock, ArrowLeft } from 'lucide-react';
import MarketplaceLayout from '@/layouts/MarketplaceLayout';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useLanguage } from '@/lib/use-language';
import { formatPrice } from '@/lib/currency';

/**
 * Full Recently Viewed page: everything in the localStorage trail
 * (`recently_viewed_products`, written by the product detail page) in a
 * responsive grid. Public — guests keep a local trail, no account needed.
 */
export default function RecentlyViewedIndex() {
    const { recentlyViewed, clear } = useRecentlyViewed();
    const { t } = useLanguage();

    return (
        <MarketplaceLayout title={t('home.recentlyViewed')}>
            <Head title={t('home.recentlyViewed')} />
            <div className="min-h-screen pb-20 bg-background">
                <div className="container mx-auto px-3 py-4 space-y-6">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <h1 className="text-xl font-bold text-foreground">{t('home.recentlyViewed')}</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            {recentlyViewed.length > 0 && (
                                <button
                                    type="button"
                                    onClick={clear}
                                    className="text-sm font-medium text-muted-foreground hover:underline"
                                >
                                    {t('common.clearAll')}
                                </button>
                            )}
                            <Link
                                href="/"
                                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                            >
                                <ArrowLeft className="h-4 w-4" /> {t('common.backHome')}
                            </Link>
                        </div>
                    </div>

                    {recentlyViewed.length === 0 ? (
                        <div className="py-16 text-center">
                            <p className="font-medium text-foreground">{t('home.noRecentlyViewed')}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {t('home.nothingHereText')}
                            </p>
                            <Link
                                href="/products"
                                className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                            >
                                {t('home.browseProducts')}
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                            {recentlyViewed.map((item) => (
                                <Link
                                    key={item.id}
                                    href={`/products/${item.slug ?? item.id}`}
                                    className="overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
                                    data-testid="recently-viewed-item"
                                    data-product-id={item.id}
                                >
                                    <div className="aspect-square bg-muted">
                                        {item.image && (
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="h-full w-full object-cover"
                                                loading="lazy"
                                            />
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
                                        {item.category && (
                                            <p className="mt-0.5 truncate text-[10px] uppercase tracking-wide text-muted-foreground">
                                                {item.category}
                                            </p>
                                        )}
                                        <p className="mt-1 text-base font-bold text-primary">
                                            {formatPrice(item.price)}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </MarketplaceLayout>
    );
}
