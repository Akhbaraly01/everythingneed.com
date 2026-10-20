import { useCallback, useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import { X, ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import { api, errorMessage, ApiError } from '@/lib/api';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/currency';
import { useLanguage } from '@/lib/use-language';
import { useCartDrawer } from './CartDrawerContext';

interface CartItem {
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    product?: { id: string; name: string; image_url?: string; price: number };
}

interface CartPayload {
    cart: { id: string; items: CartItem[]; coupon_code?: string; discount_amount?: number };
    subtotal: string;
    discount: string;
    total: string;
    item_count: number;
}

export default function GlobalCartDrawer() {
    const { isOpen, closeCart } = useCartDrawer();
    const { t } = useLanguage();
    const [cart, setCart] = useState<CartPayload | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchCart = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get<CartPayload>('/api/cart');
            setCart(res);
        } catch (e) {
            setCart(null);
            if (!(e instanceof ApiError && e.status === 401)) {
                toast.error(t('cart.loadFail', { defaultValue: 'Could not load your cart' }));
            }
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        if (isOpen) void fetchCart();
    }, [isOpen, fetchCart]);

    const updateQty = async (itemId: string, quantity: number) => {
        if (quantity < 1) return removeItem(itemId);
        try {
            await api.put(`/api/cart/items/${itemId}`, { quantity });
            void fetchCart();
        } catch (e) {
            toast.error(errorMessage(e, t('cart.updateFail', { defaultValue: 'Could not update quantity' })));
            void fetchCart();
        }
    };

    const removeItem = async (itemId: string) => {
        try {
            await api.del(`/api/cart/items/${itemId}`);
            void fetchCart();
        } catch (e) {
            toast.error(errorMessage(e, t('cart.removeFail', { defaultValue: 'Could not remove item' })));
            void fetchCart();
        }
    };

    if (!isOpen) return null;

    const items = cart?.cart.items ?? [];

    return (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={t('cart.drawerAria', { defaultValue: 'Shopping cart' })}>
            <div className="absolute inset-0 bg-black/50" onClick={closeCart} />
            <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-card shadow-xl">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <h2 className="flex items-center gap-2 text-sm font-semibold">
                        <ShoppingCart className="h-4 w-4" /> {t('cart.title', { defaultValue: 'Cart' })} ({cart?.item_count ?? 0})
                    </h2>
                    <button
                        type="button"
                        onClick={closeCart}
                        aria-label={t('cart.close', { defaultValue: 'Close cart' })}
                        className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">{t('common.loading')}</p>
                    ) : items.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            <ShoppingCart className="mx-auto mb-2 h-10 w-10 opacity-50" />
                            <p className="text-sm">{t('cart.empty', { defaultValue: 'Your cart is empty' })}</p>
                            <Link
                                href="/products"
                                onClick={closeCart}
                                className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
                            >
                                {t('home.browseProducts')}
                            </Link>
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {items.map((item) => (
                                <li key={item.id} className="flex gap-3 rounded-lg border border-border p-3">
                                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                                        {item.product?.image_url && (
                                            <img
                                                src={item.product.image_url}
                                                alt={item.product.name}
                                                className="h-full w-full object-cover"
                                                loading="lazy"
                                            />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{item.product?.name ?? t('cart.item', { defaultValue: 'Item' })}</p>
                                        <p className="text-sm font-bold text-primary">
                                            {formatPrice(item.unit_price)}
                                        </p>
                                        <div className="mt-1 flex items-center gap-2">
                                            <button
                                                type="button"
                                                aria-label={t('cart.decrease', { defaultValue: 'Decrease quantity' })}
                                                onClick={() => void updateQty(item.id, item.quantity - 1)}
                                                className="flex h-6 w-6 items-center justify-center rounded border border-border"
                                            >
                                                <Minus className="h-3 w-3" />
                                            </button>
                                            <span className="text-xs font-medium">{item.quantity}</span>
                                            <button
                                                type="button"
                                                aria-label={t('cart.increase', { defaultValue: 'Increase quantity' })}
                                                onClick={() => void updateQty(item.id, item.quantity + 1)}
                                                className="flex h-6 w-6 items-center justify-center rounded border border-border"
                                            >
                                                <Plus className="h-3 w-3" />
                                            </button>
                                            <button
                                                type="button"
                                                aria-label={t('cart.remove', { defaultValue: 'Remove item' })}
                                                onClick={() => void removeItem(item.id)}
                                                className="ml-auto flex h-6 w-6 items-center justify-center rounded text-destructive hover:bg-muted"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {items.length > 0 && (
                    <div className="border-t border-border p-4 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{t('cart.subtotal', { defaultValue: 'Subtotal' })}</span>
                            <span className="font-semibold">{formatPrice(Number(cart?.subtotal ?? 0))}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{t('cart.total', { defaultValue: 'Total' })}</span>
                            <span className="font-bold text-primary">{formatPrice(Number(cart?.total ?? 0))}</span>
                        </div>
                        <div className="flex gap-2">
                            <Link
                                href="/cart"
                                onClick={closeCart}
                                className="flex-1 rounded-md border border-border px-4 py-2 text-center text-sm font-medium hover:bg-muted"
                            >
                                {t('cart.viewCart', { defaultValue: 'View cart' })}
                            </Link>
                            <Link
                                href="/orders/checkout"
                                onClick={closeCart}
                                className="flex-1 rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground hover:opacity-90"
                            >
                                {t('cart.checkout', { defaultValue: 'Checkout' })}
                            </Link>
                        </div>
                    </div>
                )}
            </aside>
        </div>
    );
}
