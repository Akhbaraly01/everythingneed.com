import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ApiError, api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import type { Product } from '@/types';
import { formatPrice } from '@/lib/currency';
import {
    Check,
    Heart,
    Minus,
    Plus,
    RotateCcw,
    Shield,
    ShoppingCart,
    Star,
    Store,
    Truck,
    Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useWishlist } from '@/hooks/useWishlist';
import { Button } from '@/components/shared/Button';
import VideoPlayer from '@/components/learn/VideoPlayer';
import { resolvePlaybackSource } from '@/lib/video';
import ProductGallery from '@/components/products/ProductGallery';
import ProductRail, { type RailProduct } from '@/components/products/ProductRail';
import ProductAnchorNav from '@/components/products/ProductAnchorNav';

interface ProductShowProps {
    product: Product;
}

interface RailResponse {
    data?: Array<{
        id: string;
        name: string;
        price: number | string;
        compare_price?: number | null;
        rating?: number | null;
        image_url?: string | null;
        slug?: string | null;
    }>;
}

/** Normalise the catalogue payload into the rail card shape. */
function toRail(data: RailResponse['data']): RailProduct[] {
    return (data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        price: Number(row.price),
        originalPrice: row.compare_price ? Number(row.compare_price) : null,
        rating: row.rating ?? null,
        image: row.image_url ?? null,
        link: row.slug ? `/products/${row.slug}` : `/products/${row.id}`,
    }));
}

export default function ProductShow({ product }: ProductShowProps) {
    const { auth } = usePage().props as {
        auth?: { id?: string; user?: { id: string } } | null;
    };
    const isLoggedIn = Boolean(auth?.id ?? auth?.user);
    const { addItem: recordView } = useRecentlyViewed();
    const { has: wishlistHas, toggle: toggleWishlistState } = useWishlist();
    const inWishlist = wishlistHas(product.id);
    const [quantity, setQuantity] = useState(1);
    const [adding, setAdding] = useState(false);
    const [added, setAdded] = useState(false);
    const [variantId, setVariantId] = useState<string | null>(null);
    const [related, setRelated] = useState<RailProduct[]>([]);
    const [moreToLove, setMoreToLove] = useState<RailProduct[]>([]);

    const activeVariants = (product.variants ?? []).filter((v) => v.is_active);
    const selectedVariant = activeVariants.find((v) => v.id === variantId) ?? null;
    const effectivePrice = selectedVariant ? Number(selectedVariant.price) : product.price;
    const effectiveStock = selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity;
    const comparePrice = product.compare_price ? Number(product.compare_price) : null;
    const discountPercent =
        comparePrice && comparePrice > Number(effectivePrice)
            ? Math.round((1 - Number(effectivePrice) / comparePrice) * 100)
            : 0;

    // Vendor-provided product video plays in-app (same resolver as lessons
    // and the knowledge feed). Internal live-room links never render here.
    const videoSource = product.video_url ?? product.production_video_url ?? null;
    const playback = resolvePlaybackSource(videoSource);
    const showVideo = Boolean(
        playback && playback.provider !== 'jitsi' && (playback.playable || playback.provider === 'udemy'),
    );

    const galleryImages = useMemo(() => {
        const list = [...(product.images ?? [])];

        if (product.image_url && !list.includes(product.image_url)) {
            list.unshift(product.image_url);
        }

        return list;
    }, [product.images, product.image_url]);

    useEffect(() => {
        recordView({
            id: product.id,
            slug: product.slug,
            name: product.name,
            image: product.image_url ?? product.images?.[0] ?? '',
            price: product.price,
            category: product.category,
        });
    }, [product, recordView]);

    // "Related items" (same category) and "More to love" (rest of the
    // catalogue) - both rails feed the page from the public catalogue API.
    useEffect(() => {
        let cancelled = false;

        const load = async (): Promise<void> => {
            try {
                const [sameCategory, catalogue] = await Promise.all([
                    api.get<RailResponse>('/api/products', {
                        params: { category: product.category, per_page: 12 },
                    }),
                    api.get<RailResponse>('/api/products', { params: { per_page: 24 } }),
                ]);

                if (cancelled) {
                    return;
                }

                const exclude = (items: RailProduct[]): RailProduct[] =>
                    items.filter((item) => String(item.id) !== String(product.id));

                const relatedItems = exclude(toRail(sameCategory.data));
                const catalogueItems = exclude(toRail(catalogue.data));
                const more = catalogueItems.filter(
                    (item) => !relatedItems.some((rel) => String(rel.id) === String(item.id)),
                );

                setRelated(relatedItems);
                // Small catalogues can leave "More to love" empty; the
                // related items then carry the section instead of a hole.
                setMoreToLove(more.length > 0 ? more : relatedItems);
            } catch {
                // Rails are optional; the page stays complete without them.
            }
        };

        void load();

        return () => {
            cancelled = true;
        };
    }, [product.id, product.category]);

    // Variants grouped by their attribute (Colour / Size / ...) so the
    // picker reads like a catalogue instead of a flat list.
    const optionGroups = useMemo(() => {
        const groups = new Map<string, { value: string; variantId: string; stock: number }[]>();

        for (const variant of activeVariants) {
            const attributes = variant.attributes ?? {};

            for (const [key, value] of Object.entries(attributes)) {
                const list = groups.get(key) ?? [];

                if (!list.some((entry) => entry.value === value)) {
                    list.push({ value, variantId: variant.id, stock: variant.stock_quantity });
                }

                groups.set(key, list);
            }
        }

        return Array.from(groups.entries());
    }, [activeVariants]);

    const specs = useMemo(() => {
        const rows: Array<[string, string]> = [];

        if (product.sku) rows.push(['SKU', String(product.sku)]);
        if (product.category) rows.push(['Category', product.category]);
        if (product.subcategory) rows.push(['Subcategory', product.subcategory]);

        const declared = product.specifications ?? {};

        for (const [key, value] of Object.entries(declared)) {
            if (value !== null && value !== undefined && value !== '') {
                rows.push([key, String(value)]);
            }
        }

        const attributes = product.attributes ?? {};

        for (const [key, value] of Object.entries(attributes)) {
            if (value !== null && value !== undefined && value !== '') {
                rows.push([key, String(value)]);
            }
        }

        for (const variant of activeVariants) {
            for (const [key, value] of Object.entries(variant.attributes ?? {})) {
                rows.push([`${key} (${variant.name})`, String(value)]);
            }
        }

        return rows;
    }, [activeVariants, product]);

    const handleAddToCart = async (): Promise<void> => {
        if (!isLoggedIn) {
            router.visit('/login');
            return;
        }
        setAdding(true);
        try {
            await api.post('/api/cart/items', {
                product_id: product.id,
                quantity,
                ...(variantId ? { product_variant_id: variantId } : {}),
            });
            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to add to cart'));
        } finally {
            setAdding(false);
        }
    };

    const handleBuyNow = async (): Promise<void> => {
        if (!isLoggedIn) {
            router.visit('/login');
            return;
        }

        setAdding(true);
        try {
            await api.post('/api/cart/items', {
                product_id: product.id,
                quantity,
                ...(variantId ? { product_variant_id: variantId } : {}),
            });
            router.visit('/orders/checkout');
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to start checkout'));
        } finally {
            setAdding(false);
        }
    };

    const handleWishlist = async (): Promise<void> => {
        if (!isLoggedIn) {
            router.visit('/login');
            return;
        }
        try {
            const saved = await toggleWishlistState(product.id);
            toast.success(saved ? 'Added to wishlist' : 'Removed from wishlist');
        } catch (e) {
            toast.error(errorMessage(e, 'Wishlist failed'));
        }
    };

    const handleCompare = async (): Promise<void> => {
        if (!isLoggedIn) {
            router.visit('/login');
            return;
        }
        try {
            await api.post('/api/compare', { product_id: product.id });
            window.dispatchEvent(new CustomEvent('everythingneed:compare-updated'));
            toast.success('Added to compare');
        } catch (e) {
            if (e instanceof ApiError && e.status === 409) {
                window.dispatchEvent(new CustomEvent('everythingneed:compare-updated'));
                toast.info('Already in compare');
            } else toast.error(errorMessage(e, 'Compare failed'));
        }
    };

    const anchors = [
        { id: 'nav-review', label: `Reviews (${product.reviews_count ?? 0})` },
        { id: 'nav-specification', label: 'Specifications' },
        { id: 'nav-description', label: 'Description' },
        { id: 'nav-store', label: 'Store' },
        { id: 'nav-moretolove', label: 'More to love' },
    ];

    return (
        <AppLayout>
            <Head title={product.name} />

            <div className="space-y-6">
                {/* Breadcrumb */}
                <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <Link href="/products" className="hover:text-foreground">Products</Link>
                    <span aria-hidden="true">/</span>
                    <Link href={`/products?category=${product.category}`} className="hover:text-foreground">
                        {product.category}
                    </Link>
                    <span aria-hidden="true">/</span>
                    <span className="text-foreground">{product.name}</span>
                </nav>

                {/* Gallery + buy box */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    <div className="space-y-4">
                        <ProductGallery
                            name={product.name}
                            images={galleryImages}
                            videoUrl={showVideo ? (playback?.url ?? null) : null}
                        />

                        {showVideo && playback && (
                            <div
                                className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"
                                data-testid="product-video"
                            >
                                <p className="border-b border-border px-4 py-2 text-sm font-semibold text-foreground">
                                    Product video
                                </p>
                                <VideoPlayer
                                    post={{
                                        id: product.id,
                                        video_url: playback.url,
                                        video_provider: playback.provider,
                                        provider_video_id: playback.videoId,
                                    }}
                                    autoplay={false}
                                    heartbeat={false}
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-5">
                        <div>
                            <h1 className="text-2xl font-bold leading-snug text-foreground sm:text-3xl">
                                {product.name}
                            </h1>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                                <span className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span className="font-medium">
                                        {product.rating ? Number(product.rating).toFixed(1) : 'N/A'}
                                    </span>
                                </span>
                                <Link
                                    href={`/products/${product.slug}/reviews`}
                                    className="text-primary hover:underline"
                                >
                                    ({product.reviews_count ?? 0} reviews)
                                </Link>
                                {product.vendor && (
                                    <Link
                                        href={`/products/${product.slug}/vendor`}
                                        className="inline-flex items-center gap-1 text-primary hover:underline"
                                    >
                                        {product.vendor.store_name}
                                        {product.vendor.is_verified && (
                                            <span className="text-green-500">✓</span>
                                        )}
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Price block */}
                        <div className="rounded-xl border border-border bg-muted/40 p-4">
                            <div className="flex flex-wrap items-baseline gap-3">
                                <span className="text-3xl font-bold text-primary">
                                    {formatPrice(effectivePrice)}
                                </span>
                                {comparePrice && comparePrice > Number(effectivePrice) && (
                                    <>
                                        <span className="text-base text-muted-foreground line-through">
                                            {formatPrice(comparePrice)}
                                        </span>
                                        <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-xs font-semibold text-destructive">
                                            -{discountPercent}%
                                        </span>
                                    </>
                                )}
                            </div>
                            {product.tax_rate ? (
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Tax excluded, add at checkout if applicable
                                </p>
                            ) : null}
                            {effectiveStock > 0 && effectiveStock <= 10 && (
                                <p className="mt-1 text-xs font-semibold text-destructive">
                                    Only {effectiveStock} left
                                </p>
                            )}
                        </div>

                        {/* Options */}
                        {optionGroups.length > 0 && (
                            <div className="space-y-3">
                                {optionGroups.map(([key, entries]) => (
                                    <div key={key}>
                                        <p className="mb-1.5 text-sm font-medium text-foreground">
                                            {key}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {entries.map((entry) => {
                                                const active = selectedVariant?.id === entry.variantId;

                                                return (
                                                    <button
                                                        key={entry.variantId + entry.value}
                                                        type="button"
                                                        onClick={() =>
                                                            setVariantId(
                                                                active ? null : entry.variantId,
                                                            )
                                                        }
                                                        disabled={entry.stock <= 0 && !active}
                                                        className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                                                            active
                                                                ? 'border-primary bg-primary/10 font-semibold text-primary'
                                                                : 'border-border text-foreground hover:border-primary/50'
                                                        } ${entry.stock <= 0 ? 'opacity-40 line-through' : ''}`}
                                                    >
                                                        {entry.value}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeVariants.length > 0 && optionGroups.length === 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-foreground">Option</p>
                                <div className="flex flex-wrap gap-2">
                                    {activeVariants.map((v) => (
                                        <button
                                            key={v.id}
                                            type="button"
                                            onClick={() => setVariantId(v.id === variantId ? null : v.id)}
                                            disabled={v.stock_quantity <= 0 && v.id !== variantId}
                                            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                                                v.id === variantId
                                                    ? 'border-primary bg-primary/10 font-semibold text-primary'
                                                    : 'border-border text-foreground hover:border-primary/50'
                                            }`}
                                        >
                                            {v.name}
                                            <span className="ml-2 text-xs text-muted-foreground">
                                                {formatPrice(Number(v.price))}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {product.description && (
                            <p className="line-clamp-3 text-sm text-muted-foreground">
                                {product.description}
                            </p>
                        )}

                        {/* Quantity + actions */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center rounded-lg border border-border">
                                <Button
                                    variant="icon"
                                    iconOnly
                                    size="sm"
                                    aria-label="Decrease quantity"
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-12 text-center font-medium">{quantity}</span>
                                <Button
                                    variant="icon"
                                    iconOnly
                                    size="sm"
                                    aria-label="Increase quantity"
                                    onClick={() =>
                                        setQuantity(Math.min(Math.max(effectiveStock, 1), quantity + 1))
                                    }
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            <Button
                                variant="primary"
                                className="flex-1"
                                onClick={handleAddToCart}
                                disabled={adding || effectiveStock <= 0}
                            >
                                {added ? (
                                    <>
                                        <Check className="h-5 w-5" /> Added!
                                    </>
                                ) : adding ? (
                                    'Adding...'
                                ) : effectiveStock <= 0 ? (
                                    'Out of Stock'
                                ) : (
                                    <>
                                        <ShoppingCart className="h-5 w-5" /> Add to cart
                                    </>
                                )}
                            </Button>

                            <Button
                                variant="primary"
                                className="flex-1"
                                onClick={handleBuyNow}
                                disabled={adding || effectiveStock <= 0}
                            >
                                <Zap className="h-5 w-5" /> Buy now
                            </Button>

                            <Button
                                variant="icon"
                                iconOnly
                                size="sm"
                                onClick={handleWishlist}
                                title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                                aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                                aria-pressed={inWishlist}
                            >
                                <Heart
                                    className={`h-6 w-6 ${
                                        inWishlist ? 'fill-current text-destructive' : 'text-muted-foreground'
                                    }`}
                                />
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCompare}
                                title="Add to compare"
                            >
                                Compare
                            </Button>
                        </div>

                        {/* Trust row */}
                        <div className="grid gap-2 rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground sm:grid-cols-3">
                            <span className="flex items-center gap-2">
                                <Truck className="h-4 w-4 shrink-0" /> Free shipping on orders over $50
                            </span>
                            <span className="flex items-center gap-2">
                                <Shield className="h-4 w-4 shrink-0" /> Secure payment
                            </span>
                            <span className="flex items-center gap-2">
                                <RotateCcw className="h-4 w-4 shrink-0" /> 30-day return policy
                            </span>
                        </div>

                        {/* Store card */}
                        {product.vendor && (
                            <div
                                id="nav-store"
                                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <Store className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                            Sold by
                                        </p>
                                        <Link
                                            href={`/vendors/${product.vendor.slug ?? product.vendor_id}`}
                                            className="font-semibold text-foreground hover:underline"
                                        >
                                            {product.vendor.store_name}
                                            {product.vendor.is_verified && (
                                                <span className="ml-1 text-green-500">✓</span>
                                            )}
                                        </Link>
                                        {product.vendor.rating ? (
                                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                {Number(product.vendor.rating).toFixed(1)} store rating
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                                <Link
                                    href={`/vendors/${product.vendor.slug ?? product.vendor_id}`}
                                    className="tap-safe rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted"
                                >
                                    Visit store
                                </Link>
                            </div>
                        )}

                        <div className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
                            <p>
                                <span className="font-medium text-foreground">Category:</span>{' '}
                                {product.category}
                            </p>
                            <p className="mt-1">
                                <span className="font-medium text-foreground">Stock:</span>{' '}
                                {effectiveStock > 0 ? `${effectiveStock} available` : 'Out of stock'}
                            </p>
                        </div>
                    </div>
                </div>

                <ProductAnchorNav items={anchors} />

                {/* Reviews summary */}
                <section id="nav-review" className="space-y-3">
                    <h2 className="text-xl font-bold text-foreground">Reviews</h2>
                    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4">
                        <div className="flex items-center gap-2">
                            <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                            <span className="text-2xl font-bold text-foreground">
                                {product.rating ? Number(product.rating).toFixed(1) : '—'}
                            </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {product.reviews_count ?? 0} ratings
                        </span>
                        <Link
                            href={`/products/${product.slug}/reviews`}
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            Read all reviews
                        </Link>
                    </div>
                </section>

                {/* Specifications */}
                <section id="nav-specification" className="space-y-3">
                    <h2 className="text-xl font-bold text-foreground">Specifications</h2>
                    {specs.length > 0 ? (
                        <dl className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                            {specs.map(([key, value]) => (
                                <div key={`${key}-${value}`} className="grid grid-cols-1 sm:grid-cols-3">
                                    <dt className="bg-muted/40 px-4 py-2.5 text-sm font-medium text-muted-foreground">
                                        {key}
                                    </dt>
                                    <dd className="px-4 py-2.5 text-sm text-foreground sm:col-span-2">
                                        {value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            This product has no specifications yet.
                        </p>
                    )}
                </section>

                {/* Description */}
                <section id="nav-description" className="space-y-3">
                    <h2 className="text-xl font-bold text-foreground">Description</h2>
                    <div className="prose-sm max-w-none rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-foreground">
                        {product.description ? (
                            <p className="whitespace-pre-line">{product.description}</p>
                        ) : (
                            <p className="text-muted-foreground">
                                The seller has not written a description for this product yet.
                            </p>
                        )}
                    </div>
                </section>

                {/* Questions & answers */}
                <section id="nav-qa" className="space-y-3">
                    <h2 className="text-xl font-bold text-foreground">Questions &amp; answers</h2>
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
                        <p className="text-sm text-muted-foreground">
                            Ask the store owner about this product - they usually answer within a day.
                        </p>
                        {product.vendor && (
                            <Link
                                href={`/vendors/${product.vendor.slug ?? product.vendor_id}`}
                                className="tap-safe rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                            >
                                Ask a question
                            </Link>
                        )}
                    </div>
                </section>

                {/* Related items */}
                <ProductRail
                    title="Related items"
                    testId="product-related-items"
                    products={related}
                />

                {/* More to love */}
                <div id="nav-moretolove">
                    <ProductRail
                        title="More to love"
                        testId="product-more-to-love"
                        products={moreToLove}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
