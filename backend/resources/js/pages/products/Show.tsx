import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ApiError, api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import type { Product } from '@/types';
import { formatPrice } from '@/lib/currency';
import { ShoppingCart, Heart, Star, Truck, Shield, RotateCcw, Minus, Plus, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useWishlist } from '@/hooks/useWishlist';
import Image from '@/components/shared/Image';

interface ProductShowProps {
    product: Product;
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

    const activeVariants = (product.variants ?? []).filter((v) => v.is_active);
    const selectedVariant = activeVariants.find((v) => v.id === variantId) ?? null;
    const effectivePrice = selectedVariant ? Number(selectedVariant.price) : product.price;
    const effectiveStock = selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity;

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

    const handleAddToCart = async () => {
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

    const handleWishlist = async () => {
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

    const handleCompare = async () => {
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

    return (
        <AppLayout>
            <Head title={product.name} />

            <div className="space-y-8">
                {/* Breadcrumb */}
                <nav className="flex text-sm text-gray-500">
                    <Link href="/products" className="hover:text-gray-700">Products</Link>
                    <span className="mx-2">/</span>
                    <Link href={`/products?category=${product.category}`} className="hover:text-gray-700">
                        {product.category}
                    </Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900 dark:text-white">{product.name}</span>
                </nav>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    {/* Images */}
                    <div className="space-y-4">
                        <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                            {product.image_url ? (
                                <Image src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full items-center justify-center text-gray-400">No image</div>
                            )}
                        </div>
                        {product.images && product.images.length > 1 && (
                            <div className="grid grid-cols-4 gap-2">
                                {product.images.slice(0, 4).map((img, i) => (
                                    <div key={i} className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                                        <Image src={img} alt="" className="h-full w-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{product.name}</h1>
                            <div className="mt-2 flex items-center gap-2">
                                <div className="flex items-center">
                                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                    <span className="ml-1 text-sm font-medium">{product.rating ?? 'N/A'}</span>
                                    <Link href={`/products/${product.slug}/reviews`} className="ml-1 text-sm text-indigo-600 hover:text-indigo-500">
                                        ({product.reviews_count ?? 0} reviews)
                                    </Link>
                                </div>
                            </div>
                            {product.vendor && (
                                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
                                    <Link href={`/products/${product.slug}/vendor`} className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-500">
                                        {product.vendor.store_name}
                                        {product.vendor.is_verified && <span className="text-green-500">✓</span>}
                                    </Link>
                                    <Link href={`/vendors/${product.vendor.slug ?? product.vendor_id}`} className="text-gray-500 hover:text-indigo-600">
                                        Visit store
                                    </Link>
                                </div>
                            )}
                        </div>

                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                {formatPrice(effectivePrice)}
                            </span>
                            {!selectedVariant && product.compare_price && (
                                <span className="text-xl text-gray-400 line-through">
                                    {formatPrice(product.compare_price)}
                                </span>
                            )}
                        </div>

                        {activeVariants.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Option</p>
                                <div className="flex flex-wrap gap-2">
                                    {activeVariants.map((v) => (
                                        <button
                                            key={v.id}
                                            type="button"
                                            onClick={() => setVariantId(v.id === variantId ? null : v.id)}
                                            disabled={v.stock_quantity <= 0 && v.id !== variantId}
                                            className={`rounded-lg border px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                                v.id === variantId
                                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                                                    : 'border-gray-300 text-gray-700 hover:border-indigo-400 dark:border-gray-600 dark:text-gray-300'
                                            }`}
                                        >
                                            {v.name}
                                            <span className="ml-2 text-xs text-gray-500">{formatPrice(Number(v.price))}</span>
                                            {v.stock_quantity <= 0 && <span className="ml-1 text-xs text-red-500">- out</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {product.description && (
                            <p className="text-gray-600 dark:text-gray-400">{product.description}</p>
                        )}

                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Truck className="h-4 w-4" />
                                Free shipping on orders over $50
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Shield className="h-4 w-4" />
                                Secure payment
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <RotateCcw className="h-4 w-4" />
                                30-day return policy
                            </div>
                        </div>

                        {/* Quantity + Add to Cart */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-600">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    <Minus className="h-4 w-4" />
                                </button>
                                <span className="w-12 text-center font-medium">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                            <button
                                onClick={handleAddToCart}
                                disabled={adding || effectiveStock <= 0}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3 text-lg font-semibold text-white transition ${
                                    added ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-500'
                                } disabled:opacity-50`}
                            >
                                {added ? (
                                    <><Check className="h-5 w-5" /> Added!</>
                                ) : adding ? (
                                    'Adding...'
                                ) : effectiveStock <= 0 ? (
                                    'Out of Stock'
                                ) : (
                                    <><ShoppingCart className="h-5 w-5" /> Add to Cart</>
                                )}
                            </button>
                            <button
                                onClick={handleWishlist}
                                title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                                aria-pressed={inWishlist}
                                className={`rounded-lg border p-3 dark:border-gray-600 dark:hover:bg-gray-700 ${
                                    inWishlist
                                        ? 'border-red-300 bg-red-50 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20'
                                        : 'border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <Heart className={`h-6 w-6 ${inWishlist ? 'fill-current text-red-500' : 'text-gray-600 dark:text-gray-400'}`} />
                            </button>
                            <button
                                onClick={handleCompare}
                                title="Add to compare"
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300"
                            >
                                Compare
                            </button>
                        </div>

                        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Category:</span> {product.category}
                            </p>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Stock:</span>{' '}
                                {effectiveStock > 0 ? `${effectiveStock} available` : 'Out of stock'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
