import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import { pageSeed, rotate } from '@/lib/session-rotation';
import Image from '@/components/shared/Image';

export interface RailProduct {
    id: string | number;
    name: string;
    price: number | string;
    originalPrice?: number | null;
    rating?: number | null;
    image?: string | null;
    link?: string | null;
    sold?: number | null;
}

interface Props {
    title: string;
    products: RailProduct[];
    testId?: string;
}

/**
 * Horizontal product rail (Alibaba "Related items" / "More to love").
 * Scrolls with the wheel while the pointer is over it, and always keeps
 * the arrows in sync with the scroll offset.
 */
export default function ProductRail({ title, products, testId }: Props) {
    const trackRef = useRef<HTMLDivElement>(null);
    const [atStart, setAtStart] = useState(true);
    const [atEnd, setAtEnd] = useState(false);

    // A new arrangement on every page load; the relevance order is kept
    // inside each rotation.
    const seed = useMemo(() => pageSeed(), []);
    const ordered = useMemo(
        () => rotate(products, seed, title.length),
        [products, seed, title],
    );

    const sync = (): void => {
        const el = trackRef.current;

        if (!el) {
            return;
        }

        setAtStart(el.scrollLeft <= 4);
        setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
    };

    useEffect(() => {
        sync();
    }, [ordered.length]);

    const scrollBy = (direction: 1 | -1): void => {
        const el = trackRef.current;

        if (!el) {
            return;
        }

        el.scrollBy({ left: direction * Math.max(240, el.clientWidth * 0.8), behavior: 'smooth' });
    };

    if (products.length === 0) {
        return null;
    }

    return (
        <section data-testid={testId} className="space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">{title}</h2>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => scrollBy(-1)}
                        disabled={atStart}
                        aria-label="Previous items"
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollBy(1)}
                        disabled={atEnd}
                        aria-label="Next items"
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div
                ref={trackRef}
                onScroll={sync}
                className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]"
            >
                {ordered.map((product) => {
                    const href = product.link ?? `/products/${product.id}`;
                    const discount =
                        product.originalPrice && Number(product.originalPrice) > Number(product.price)
                            ? Math.round(
                                  (1 - Number(product.price) / Number(product.originalPrice)) * 100,
                              )
                            : 0;

                    return (
                        <Link
                            key={product.id}
                            href={href}
                            className="group w-40 shrink-0 overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
                        >
                            <div className="aspect-square overflow-hidden bg-muted">
                                {product.image ? (
                                    <Image
                                        src={product.image}
                                        alt={product.name}
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                                        No image
                                    </div>
                                )}
                            </div>
                            <div className="space-y-1 p-2">
                                <p className="line-clamp-2 text-xs leading-snug text-foreground">
                                    {product.name}
                                </p>
                                <div className="flex items-center gap-1">
                                    <span className="text-sm font-bold text-primary">
                                        {formatPrice(Number(product.price))}
                                    </span>
                                    {discount > 0 && (
                                        <span className="text-[10px] text-muted-foreground line-through">
                                            {formatPrice(Number(product.originalPrice))}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span>{product.rating ? Number(product.rating).toFixed(1) : '—'}</span>
                                    {product.sold ? <span>· {product.sold} sold</span> : null}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
