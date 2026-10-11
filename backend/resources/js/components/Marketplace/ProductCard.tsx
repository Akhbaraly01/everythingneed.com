import { Link, router, usePage } from '@inertiajs/react';
import { Star, ShoppingCart, Heart, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { api, ApiError, errorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import { useWishlist } from '@/hooks/useWishlist';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface MarketplaceProduct {
    id: string | number;
    slug?: string | null;
    name: string;
    price: number;
    originalPrice?: number | null;
    rating?: number | null;
    image?: string | null;
    image_url?: string | null;
    images?: string[] | null;
    category?: string | null;
    vendor?: string | null;
    badge?: string | null;
    type?: 'product' | 'need' | 'healthcare' | 'learning' | 'service';
    link?: string | null;
}

function getTypeColor(type: MarketplaceProduct['type']): string {
    switch (type) {
        case 'need':
            return 'bg-purple-500';
        case 'healthcare':
            return 'bg-rose-500';
        case 'learning':
            return 'bg-amber-500';
        case 'service':
            return 'bg-emerald-500';
        case 'product':
        default:
            return 'bg-blue-500';
    }
}

export default function ProductCard({ product }: { product: MarketplaceProduct }) {
    const { props } = usePage();
    const auth = (props.auth ?? null) as { user?: { id: string } } | null;
    const { has: wishlistHas, toggle: toggleWishlistState } = useWishlist();
    const inWishlist = wishlistHas(product.id);
    const [wishPending, setWishPending] = useState(false);
    const [cartPending, setCartPending] = useState(false);
    const [cartAdded, setCartAdded] = useState(false);
    const discount =
        product.originalPrice && product.originalPrice > product.price
            ? Math.round((1 - product.price / product.originalPrice) * 100)
            : 0;

    const toggleWishlist = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (wishPending) return;
        if (!auth?.user) {
            router.visit('/login');
            return;
        }
        setWishPending(true);
        try {
            const saved = await toggleWishlistState(product.id);
            toast.success(saved ? 'Saved to wishlist' : 'Removed from wishlist');
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                router.visit('/login');
            } else {
                toast.error(errorMessage(err, 'Could not update wishlist'));
            }
        } finally {
            setWishPending(false);
        }
    };

    const addToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (cartPending || cartAdded) return;
        if (!auth?.user) {
            router.visit('/login');
            return;
        }
        // Cards rendered from a non-UUID source cannot be added to the cart;
        // send the visitor to the detail page instead of issuing a doomed request.
        if (!UUID_RE.test(String(product.id))) {
            router.visit(product.link ?? `/products/${product.slug ?? product.id}`);
            return;
        }
        setCartPending(true);
        try {
            await api.post('/api/cart/items', { product_id: String(product.id), quantity: 1 });
            setCartAdded(true);
            toast.success('Added to cart');
            router.reload({ only: ['cartCount'] });
        } catch {
            router.visit(product.link ?? `/products/${product.slug ?? product.id}`);
        } finally {
            setCartPending(false);
        }
    };

    return (
        <Link href={product.link ?? `/products/${product.slug ?? product.id}`}>
            <div className="overflow-hidden hover:shadow-lg transition-all duration-300 group h-full rounded-lg border border-border bg-card flex flex-col">
                <div className="aspect-square overflow-hidden bg-muted relative">
                    {product.image || product.image_url || product.images?.[0] ? (
                        <img
                            src={product.image || product.image_url || product.images?.[0]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <ShoppingCart className="h-8 w-8" />
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={(e) => void toggleWishlist(e)}
                        disabled={wishPending}
                        aria-label={`Toggle wishlist for ${product.name}`}
                        className={`absolute top-2 right-2 p-1.5 rounded-full transition-all duration-200 ${
                            inWishlist
                                ? 'bg-destructive text-destructive-foreground'
                                : 'bg-background/80 text-muted-foreground hover:bg-background hover:text-destructive'
                        }`}
                    >
                        <Heart className={`h-4 w-4 ${inWishlist ? 'fill-current' : ''}`} />
                    </button>
                    {discount > 0 && (
                        <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">
                            -{discount}%
                        </div>
                    )}
                    {(product.badge ?? product.type) && (
                        <div
                            className={`absolute bottom-2 left-2 ${getTypeColor(product.type)} text-white text-[10px] px-1.5 py-0.5 rounded`}
                        >
                            {product.badge ?? product.category ?? product.type}
                        </div>
                    )}
                </div>
                <div className="p-3 flex-1">
                    {product.category && (
                        <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wide">
                            {product.category}
                        </p>
                    )}
                    <h3 className="font-medium text-sm line-clamp-2 mb-1 h-10">{product.name}</h3>
                    <div className="flex items-center gap-1 mb-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {product.rating != null ? (
                            <span className="text-xs font-medium">{product.rating.toFixed(1)}</span>
                        ) : (
                            <span className="text-[10px] text-muted-foreground">No reviews yet</span>
                        )}
                        {product.vendor && (
                            <span className="text-[10px] text-muted-foreground">({product.vendor})</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <p className="text-base font-bold text-primary">{formatPrice(product.price)}</p>
                        {product.originalPrice && product.originalPrice > product.price && (
                            <p className="text-xs text-muted-foreground line-through">
                                {formatPrice(product.originalPrice)}
                            </p>
                        )}
                    </div>
                </div>
                <div className="p-3 pt-0 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={(e) => void addToCart(e)}
                        disabled={cartPending}
                        className="inline-flex h-8 flex-1 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
                    >
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        {cartAdded ? 'Added ✓' : cartPending ? 'Adding…' : 'Add to Cart'}
                    </button>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-2" />
                </div>
            </div>
        </Link>
    );
}
