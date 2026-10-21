import AppLayout from '@/layouts/AppLayout';
import {Head, Link} from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import { toast } from '@/components/ui/sonner';
import {ShoppingCart, Trash2, Plus, Minus, ArrowRight, Tag, AlertTriangle, RefreshCcw} from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from '@/components/shared/Image';
import { Button, buttonClasses } from '@/components/shared/Button';
import { useConfirm } from '@/lib/confirm';

interface CartItem {
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    product_variant_id?: string | null;
    variant_name?: string | null;
    product?: { id: string; name: string; slug?: string; image_url?: string; price: number };
}

interface CartData {
    cart: { id: string; items: CartItem[]; coupon_code?: string; discount_amount?: number };
    subtotal: string;
    discount: string;
    shipping?: string;
    tax?: string;
    tax_rate?: string;
    total: string;
    item_count: number;
    availability?: Record<string, number>;
    vendors?: { id: string; store_name: string; slug?: string; accepting_orders: boolean }[];
    estimated_delivery?: string | null;
}

export default function CartIndex() {
    const ask = useConfirm();
    const [cart, setCart] = useState<CartData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [couponCode, setCouponCode] = useState('');
    const [couponMsg, setCouponMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [pendingItemId, setPendingItemId] = useState<string | null>(null);
    const [clearing, setClearing] = useState(false);

    const fetchCart = async (silent = false) => {
        if (!silent) {
            setLoading(true);
            setError(null);
        }
        try {
            const res = await api.get<{ data: CartData }>('/api/cart');
            setCart(res.data);
        } catch (e) {
            setError(errorMessage(e, 'Failed to load your cart'));
            setCart(null);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => { void fetchCart(); }, []);

    const updateQuantity = async (itemId: string, newQty: number) => {
        if (newQty < 1) return;
        if (pendingItemId) return;
        setPendingItemId(itemId);
        try {
            await api.put(`/api/cart/items/${itemId}`, { quantity: newQty });
            await fetchCart(true);
        } catch (e) {
            toast.error(errorMessage(e, 'Could not update quantity'));
        } finally {
            setPendingItemId(null);
        }
    };

    const removeItem = async (itemId: string, name: string) => {
        const confirmed = await ask({
            title: 'Remove item?',
            description: `"${name}" will be removed from your cart.`,
            confirmLabel: 'Remove',
            danger: true,
        });
        if (!confirmed) return;
        setPendingItemId(itemId);
        try {
            await api.del(`/api/cart/items/${itemId}`);
            await fetchCart(true);
            toast.success('Item removed from your cart.');
        } catch (e) {
            toast.error(errorMessage(e, 'Could not remove item'));
        } finally {
            setPendingItemId(null);
        }
    };

    const clearCart = async () => {
        const confirmed = await ask({
            title: 'Clear your cart?',
            description: 'Every item will be removed from your cart. This cannot be undone.',
            confirmLabel: 'Clear cart',
            danger: true,
        });
        if (!confirmed) return;
        setClearing(true);
        try {
            await api.del('/api/cart');
            await fetchCart(true);
            toast.success('Cart cleared.');
        } catch (e) {
            toast.error(errorMessage(e, 'Could not clear your cart'));
        } finally {
            setClearing(false);
        }
    };

    const applyCoupon = async () => {
        if (!couponCode.trim()) return;
        setCouponMsg(null);
        try {
            const res = await api.post<{ message: string }>('/api/cart/coupon', { code: couponCode.trim() });
            setCouponMsg({ type: 'success', text: res.message ?? 'Coupon applied' });
            await fetchCart(true);
        } catch (e) {
            setCouponMsg({ type: 'error', text: errorMessage(e, 'Invalid coupon') });
        }
    };

    const itemCount = cart?.item_count ?? 0;

    return (
        <AppLayout title="Shopping Cart">
            <Head title="Shopping Cart" />

            <div className="space-y-6">
                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">Loading cart...</p>
                    </div>
                ) : error ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-red-600 font-medium">{error}</p>
                        <p className="mt-2 text-sm text-gray-500">Your cart has not been changed — we just couldn't load it.</p>
                        <Button variant="outline" size="sm" onClick={() => void fetchCart()} className="mt-4">
                            <RefreshCcw className="h-4 w-4" /> Retry
                        </Button>
                    </div>
                ) : itemCount === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Your cart is empty</h3>
                        <p className="mt-2 text-gray-500">Start adding items to your cart.</p>
                        <Link
                            href="/products"
                            className={`mt-4 ${buttonClasses('primary', 'md')}`}
                        >
                            Browse Products <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        {/* Cart items */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    Cart ({itemCount} item{itemCount !== 1 ? 's' : ''})
                                </h2>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => void clearCart()}
                                    disabled={clearing || pendingItemId !== null}
                                    aria-label="Clear cart"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    {clearing ? 'Clearing...' : 'Clear cart'}
                                </Button>
                            </div>
                            {cart!.cart.items.map((item) => {
                                const busy = pendingItemId === item.id;
                                const available = cart!.availability?.[item.product_id];
                                const lowStock = available !== undefined && available < item.quantity;

                                return (
                                    <div key={item.id} className="flex items-center gap-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                            {item.product?.image_url ? (
                                                <Image src={item.product.image_url} alt={item.product.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="flex h-full items-center justify-center text-gray-400">
                                                    <ShoppingCart className="h-6 w-6" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Link
                                                href={`/products/${item.product?.slug ?? item.product_id}`}
                                                className="font-medium text-gray-900 hover:text-indigo-600 dark:text-white"
                                            >
                                                {item.product?.name ?? 'Product'}
                                            </Link>
                                            {item.variant_name && (
                                                <p className="text-sm text-indigo-600 dark:text-indigo-400">{item.variant_name}</p>
                                            )}
                                            <p className="text-sm text-gray-500">{formatPrice(item.unit_price)} each</p>
                                            {lowStock && (
                                                <p className="mt-1 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    Only {available} left - other carts are holding some stock
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="icon"
                                                iconOnly
                                                size="sm"
                                                aria-label="Decrease quantity"
                                                disabled={busy}
                                                onClick={() => void updateQuantity(item.id, item.quantity - 1)}
                                            >
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                            <Button
                                                variant="icon"
                                                iconOnly
                                                size="sm"
                                                aria-label="Increase quantity"
                                                disabled={busy}
                                                onClick={() => void updateQuantity(item.id, item.quantity + 1)}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <p className="w-24 text-right font-semibold text-gray-900 dark:text-white">
                                            {formatPrice(item.unit_price * item.quantity)}
                                        </p>
                                        <Button
                                            variant="danger"
                                            iconOnly
                                            size="sm"
                                            aria-label="Remove item"
                                            disabled={busy}
                                            onClick={() => void removeItem(item.id, item.product?.name ?? 'Product')}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Order summary */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-24 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Order Summary</h3>
                                <div className="mt-4 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Subtotal</span>
                                        <span className="text-gray-900 dark:text-white">{formatPrice(parseFloat(cart!.subtotal))}</span>
                                    </div>
                                    {parseFloat(cart!.discount) > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="flex items-center gap-1 text-green-600"><Tag className="h-3 w-3" />Discount</span>
                                            <span className="text-green-600">-{formatPrice(parseFloat(cart!.discount))}</span>
                                        </div>
                                    )}

                                    {/* Coupon input */}
                                    <div className="pt-2">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value)}
                                                placeholder="Coupon code"
                                                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
                                            />
                                            <Button variant="primary" size="sm" onClick={() => void applyCoupon()}>
                                                Apply
                                            </Button>
                                        </div>
                                        {couponMsg && (
                                            <p className={`mt-1 text-xs ${couponMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                                {couponMsg.text}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Shipping</span>
                                        <span className={parseFloat(cart!.shipping ?? '0') === 0 ? 'text-green-600' : 'text-gray-900 dark:text-white'}>
                                            {parseFloat(cart!.shipping ?? '0') === 0 ? 'Free' : formatPrice(parseFloat(cart!.shipping ?? '0'))}
                                        </span>
                                    </div>

                                    {(parseFloat(cart!.tax ?? '0') > 0 || cart!.tax_rate) && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Tax{cart!.tax_rate ? ` (${cart!.tax_rate})` : ''}</span>
                                            <span className="text-gray-900 dark:text-white">{formatPrice(parseFloat(cart!.tax ?? '0'))}</span>
                                        </div>
                                    )}

                                    {cart!.estimated_delivery && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Estimated delivery: {cart!.estimated_delivery}
                                        </p>
                                    )}

                                    {cart!.vendors?.some((v) => !v.accepting_orders) && (
                                        <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                            Some stores in this cart are temporarily not accepting orders - checkout will skip them.
                                        </p>
                                    )}

                                    <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
                                        <div className="flex justify-between text-lg font-bold">
                                            <span className="text-gray-900 dark:text-white">Total</span>
                                            <span className="text-gray-900 dark:text-white">{formatPrice(parseFloat(cart!.total))}</span>
                                        </div>
                                    </div>
                                </div>

                                <Link
                                    href="/orders/checkout"
                                    className={`mt-6 w-full ${buttonClasses('primary', 'lg')}`}
                                >
                                    Proceed to Checkout <ArrowRight className="h-5 w-5" />
                                </Link>
                                <Link
                                    href="/products"
                                    className={`mt-3 w-full ${buttonClasses('outline', 'md')}`}
                                >
                                    Continue Shopping
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
