import { Link } from '@inertiajs/react';
import { Clock } from 'lucide-react';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { formatPrice } from '@/lib/currency';

export default function RecentlyViewedSection() {
    const { recentlyViewed } = useRecentlyViewed();

    if (recentlyViewed.length === 0) return null;

    return (
        <section className="animate-in fade-in">
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-lg font-bold" data-testid="recently-viewed-heading">
                        Recently Viewed
                    </h2>
                </div>
            </div>
            <div
                className="flex gap-3 overflow-x-auto pb-2"
                data-testid="recently-viewed-list"
                style={{ scrollbarWidth: 'none' }}
            >
                {recentlyViewed.map((item) => (
                    <Link
                        key={item.id}
                        href={`/products/${item.slug ?? item.id}`}
                        className="w-32 flex-shrink-0"
                        data-testid="recently-viewed-item"
                        data-product-id={item.id}
                    >
                        <div className="overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:scale-[1.03] hover:shadow-lg">
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
                            <div className="p-2">
                                <p className="line-clamp-2 text-xs font-medium">{item.name}</p>
                                <p className="mt-1 text-sm font-bold text-primary">
                                    {formatPrice(item.price)}
                                </p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
