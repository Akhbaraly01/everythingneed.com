import { Link, router, usePage } from '@inertiajs/react';
import { Star, ShoppingCart, Heart, ChevronRight, Package, Stethoscope, GraduationCap, Wrench } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { api, ApiError, errorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import { useWishlist } from '@/hooks/useWishlist';
import { useLanguage } from '@/lib/use-language';

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

/**
 * Only real products may be added to the cart. Doctors, courses and other
 * non-product cards keep the "icon card" presentation from the deals rail
 * and navigate to their detail page instead of touching /api/cart.
 */
function typeCta(type: MarketplaceProduct['type']): { label: string; icon: React.ReactNode } {
    switch (type) {
        case 'healthcare':
            return { label: 'Book now', icon: <Stethoscope className="h-3 w-3 mr-1" /> };
        case 'learning':
            return { label: 'View course', icon: <GraduationCap className="h-3 w-3 mr-1" /> };
        case 'service':
            return { label: 'Book service', icon: <Wrench className="h-3 w-3 mr-1" /> };
        case 'need':
            return { label: 'View', icon: <Package className="h-3 w-3 mr-1" /> };
        default:
            return { label: 'View', icon: <Package className="h-3 w-3 mr-1" /> };
    }
}

function typeFallbackIcon(type: MarketplaceProduct['type']): React.ReactNode {
    switch (type) {
        case 'healthcare':
            return <Stethoscope className="h-6 w-6" />;
        case 'learning':
            return <GraduationCap className="h-6 w-6" />;
        case 'service':
            return <Wrench className="h-6 w-6" />;
        default:
            return <Package className="h-6 w-6" />;
    }
}

export default function ProductCard({ product }: { product: MarketplaceProduct }) {
    const { props } = usePage();
    const { t } = useLanguage();
    const auth = (props.auth ?? null) as { user?: { id: string } } | null;
    const { has: wishlistHas, toggle: toggleWishlistState } = useWishlist();
    const inWishlist = wishlistHas(product.id);
    const [wishPending, setWishPending] = useState(false);
    const [cartPending, setCartPending] = useState(false);
    const [cartAdded, setCartAdded] = useState(false);
    const isProduct = (product.type ?? 'product') === 'product';
    const cta = typeCta(product.type ?? 'product');
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
            toast.success(saved ? t('toast.wishlistSaved') : t('toast.wishlistRemoved'));
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                router.visit('/login');
            } else {
                toast.error(errorMessage(err, t('toast.updateFail')));
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
            toast.success(t('toast.addedToCart'));
            router.reload({ only: ['cartCount'] });
        } catch {
            router.visit(product.link ?? `/products/${product.slug ?? product.id}`);
        } finally {
            setCartPending(false);
        }
    };

    return (
        <Link href={product.link ?? `/products/${product.slug ?? product.id}`}>
            <div className="glass-1 overflow-hidden hover:shadow-lg transition-all duration-300 group h-full rounded-xl border border-border bg-card flex flex-col">
                <div className="relative h-[110px] w-full overflow-hidden bg-muted md:h-[150px]">
                    {product.image || product.image_url || product.images?.[0] ? (
                        <img
                            src={product.image || product.image_url || product.images?.[0]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            {isProduct ? <ShoppingCart className="h-6 w-6" /> : typeFallbackIcon(product.type)}
                        </div>
                    )}
                    {isProduct && (
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
                    )}
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
                <div className="p-2 flex-1">
                    {product.category && (
                        <p className="text-[10px] text-muted-foreground opacity-60 mb-0.5 uppercase tracking-wide">
                            {product.category}
                        </p>
                    )}
                    <h3 className="font-medium text-[12px] leading-tight line-clamp-2 mb-1 min-h-8 md:text-sm">{product.name}</h3>
                    <div className="flex items-center gap-1 mb-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {product.rating != null ? (
                            <span className="text-[11px] font-medium">{product.rating.toFixed(1)}</span>
                        ) : (
                            <span className="text-[10px] text-muted-foreground">{t('card.noReviews')}</span>
                        )}
                        {product.vendor && (
                            <span className="text-[10px] text-muted-foreground truncate">({product.vendor})</span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <p className="text-[13px] font-bold text-blue-400 md:text-sm">{formatPrice(product.price)}</p>
                        {product.originalPrice && product.originalPrice > product.price && (
                            <p className="text-[10px] text-muted-foreground line-through">
                                {formatPrice(product.originalPrice)}
                            </p>
                        )}
                    </div>
                </div>
                <div className="p-2 pt-0 flex items-center justify-between">
                    {isProduct ? (
                        <button
                            type="button"
                            onClick={(e) => void addToCart(e)}
                            disabled={cartPending}
                            className="btn-3d inline-flex h-7 flex-1 items-center justify-center !rounded-md bg-primary px-2 !text-[11px] font-medium text-primary-foreground !min-h-0 hover:opacity-90 disabled:opacity-60"
                        >
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            {cartAdded ? t('card.added') : cartPending ? t('card.adding') : t('card.addToCart')}
                        </button>
                    ) : (
                        <span
                            data-testid={`card-cta-${product.type ?? 'other'}`}
                            className={`inline-flex h-7 flex-1 items-center justify-center rounded-md px-2 text-[11px] font-medium text-white ${getTypeColor(product.type)}`}
                        >
                            {cta.icon}
                            {cta.label}
                        </span>
                    )}
                    <ChevronRight className="h-3 w-3 text-muted-foreground ml-1.5" />
                </div>
            </div>
        </Link>
    );
}
