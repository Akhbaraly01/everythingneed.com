import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {  api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/currency';
import { CheckCircle, XCircle, CreditCard, ArrowRight, ArrowLeft, ShoppingCart, RefreshCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Image from '@/components/shared/Image';
import { Button, buttonClasses } from '@/components/shared/Button';

interface CartItem {
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    product?: { id: string; name: string; image_url?: string; price: number };
}

interface CartData {
    cart: { id: string; items: CartItem[]; coupon_code?: string; discount_amount?: number };
    subtotal: string;
    discount: string;
    shipping?: string;
    total: string;
    item_count: number;
}

interface PlacedOrder {
    id: string;
    order_number: string;
    total_amount: number;
    status: string;
}

type PaymentState = 'idle' | 'paying' | 'paid' | 'failed';

interface CheckoutProps {
    paymentMode?: 'live' | 'sandbox';
}

export default function CheckoutPage({ paymentMode = 'sandbox' }: CheckoutProps) {
    const { auth } = usePage().props as { auth?: { user?: { id: string; name: string; email: string } } };
    const [step, setStep] = useState<'details' | 'payment' | 'done'>('details');
    const [cart, setCart] = useState<CartData | null>(null);
    const [loading, setLoading] = useState(true);
    const [cartError, setCartError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [order, setOrder] = useState<PlacedOrder | null>(null);
    const [paymentState, setPaymentState] = useState<PaymentState>('idle');
    const [paymentError, setPaymentError] = useState<string | null>(null);

    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');
    const [phone, setPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [method, setMethod] = useState('card');
    // One key per checkout visit: retries and double-clicks replay safely.
    const orderKey = useRef(
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `web-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    const [walletAvailable, setWalletAvailable] = useState<number | null>(null);

    useEffect(() => {
        // Server-owned payment methods (spec 31): wallet is offered only when
        // the identity is verified and spendable funds exist — never faked.
        api.get<{ data: { methods: { id: string; enabled: boolean; available?: number }[] } }>('/api/payments/methods')
            .then((res) => {
                const wallet = res.data.methods.find((m) => m.id === 'wallet');
                if (wallet?.enabled) setWalletAvailable(wallet.available ?? 0);
            })
            .catch(() => setWalletAvailable(null));
    }, []);

    const loadCart = () => {
        setLoading(true);
        setCartError(null);
        api.get<{ data: CartData }>('/api/cart')
            .then((res) => setCart(res.data))
            .catch((e) => {
                setCartError(errorMessage(e, 'Failed to load your cart'));
                setCart(null);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (!auth?.user) {
            router.visit('/login');
            return;
        }
        loadCart();
    }, [auth?.user]);

    const placeOrder = async () => {
        if (!address.trim()) return;
        setSubmitting(true);
        try {
            const res = await api.post<{ data: PlacedOrder }>('/api/product-orders', {
                // Stable per-checkout key: double-clicks and retries replay
                // to the same order instead of duplicating it.
                idempotency_key: orderKey.current,
                items: cart!.cart.items.map((item) => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                })),
                coupon_code: cart!.cart.coupon_code || undefined,
                shipping_address: address,
                shipping_city: city || undefined,
                shipping_country: country || undefined,
                phone: phone || undefined,
                notes: notes || undefined,
            });
            const placed = res.data;
            setOrder(placed);

            // Clear the cart once the order exists so it cannot be re-submitted.
            try {
                await api.del('/api/cart');
            } catch { /* Best-effort: the order is already the source of record. */ }

            await chargeForOrder(placed);
            setStep('done');
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to place order'));
        } finally {
            setSubmitting(false);
        }
    };

    /**
     * Charge is attempted once with a stable idempotency key so a retry after a
     * provider failure can never double-charge (spec: idempotency + no false
     * success). A failed charge is surfaced to the user, never swallowed.
     */
    const chargeForOrder = async (placed: PlacedOrder) => {
        setPaymentState('paying');
        setPaymentError(null);
        try {
            await api.post('/api/payments/charge', {
                order_id: placed.id,
                // Server-computed order total (includes shipping) is authoritative.
                amount: placed.total_amount,
                method,
                idempotency_key: `checkout-${placed.id}`,
            });
            setPaymentState('paid');
        } catch (e) {
            setPaymentState('failed');
            setPaymentError(errorMessage(e, 'Payment could not be completed'));
        }
    };

    const itemCount = cart?.item_count ?? 0;

    return (
        <AppLayout title="Checkout">
            <Head title="Checkout" />

            <div className="space-y-6">
                {/* Progress steps */}
                <div className="flex items-center justify-center gap-4 text-sm">
                    {(['details', 'payment', 'done'] as const).map((s, i) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                                step === s ? 'bg-indigo-600 text-white' :
                                (['details', 'payment', 'done'].indexOf(step) > i ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500')
                            }`}>
                                {(['details', 'payment', 'done'].indexOf(step) > i) ? <CheckCircle className="h-4 w-4" /> : i + 1}
                            </div>
                            <span className={step === s ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-500'}>
                                {s === 'details' ? 'Delivery' : s === 'payment' ? 'Payment' : 'Done'}
                            </span>
                            {i < 2 && <div className="h-px w-12 bg-gray-300" />}
                        </div>
                    ))}
                </div>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">Loading cart...</p>
                    </div>
                ) : cartError ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-red-600 font-medium">{cartError}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadCart}
                            className="mt-4"
                        >
                            <RefreshCcw className="h-4 w-4" /> Retry
                        </Button>
                    </div>
                ) : itemCount === 0 && step !== 'done' ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Your cart is empty</h3>
                        <Link href="/products" className={`mt-4 ${buttonClasses('primary', 'md')}`}>
                            Browse Products
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-6">
                            {step === 'details' && (
                                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Delivery Details</h2>
                                    <div className="mt-4 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address *</label>
                                            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
                                                placeholder="123 Main St" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">City</label>
                                                <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Country</label>
                                                <input type="text" value={country} onChange={(e) => setCountry(e.target.value)}
                                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                                            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
                                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                                            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700" />
                                        </div>
                                    </div>
                                    <Button
                                        variant="primary"
                                        fullWidth
                                        className="mt-6"
                                        onClick={() => address.trim() && setStep('payment')}
                                        disabled={!address.trim()}
                                    >
                                        Continue to Payment <ArrowRight className="h-5 w-5" />
                                    </Button>
                                </div>
                            )}

                            {step === 'payment' && (
                                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Method</h2>
                                    <div className="mt-4 space-y-3">
                                        {[
                                            { value: 'card', label: 'Credit/Debit Card' },
                                            { value: 'mobile_money', label: 'Mobile Money' },
                                            { value: 'bank_transfer', label: 'Bank Transfer' },
                                            ...(walletAvailable !== null
                                                ? [{ value: 'wallet', label: `Wallet (${walletAvailable.toFixed(2)} available)` }]
                                                : []),
                                        ].map((opt) => (
                                            <label key={opt.value} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700">
                                                <input type="radio" name="method" value={opt.value} checked={method === opt.value} onChange={(e) => setMethod(e.target.value)} className="text-indigo-600" />
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">{opt.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <p className={`mt-4 rounded-lg p-3 text-xs dark:text-yellow-300 ${
                                        paymentMode === 'live'
                                            ? 'bg-blue-50 text-blue-800 dark:bg-blue-900/20'
                                            : 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20'
                                    }`}>
                                        {paymentMode === 'live'
                                            ? 'Payments are processed securely by our payment provider. Your card details are never stored on EverythingNeed.'
                                            : 'Sandbox mode — no real funds will be charged on this environment.'}
                                    </p>
                                    <div className="mt-6 flex gap-3">
                                        <Button variant="ghost" size="sm" onClick={() => setStep('details')}>
                                            <ArrowLeft className="h-4 w-4" /> Back
                                        </Button>
                                        <Button
                                            variant="primary"
                                            className="flex-1"
                                            onClick={placeOrder}
                                            disabled={submitting}
                                        >
                                            <CreditCard className="h-5 w-5" />
                                            {submitting
                                                ? 'Placing Order...'
                                                : `Pay ${cart ? formatPrice(parseFloat(cart.total)) : ''}`}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {step === 'done' && (
                                <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                                    {paymentState === 'paid' ? (
                                        <>
                                            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                                            <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Order Placed &amp; Paid</h2>
                                            <p className="mt-2 text-gray-500">Order #{order?.order_number}</p>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="mx-auto h-16 w-16 text-amber-500" />
                                            <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
                                                Order Placed — Payment {paymentState === 'paying' ? 'Pending' : 'Not Completed'}
                                            </h2>
                                            <p className="mt-2 text-gray-500">Order #{order?.order_number}</p>
                                        </>
                                    )}
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Total: {order ? formatPrice(order.total_amount) : ''}
                                    </p>
                                    {paymentState === 'failed' && (
                                        <div className="mx-auto mt-6 max-w-md rounded-lg border border-amber-300 bg-amber-50 p-4 text-left text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
                                            <p className="font-semibold">Your order was created but payment was not completed.</p>
                                            {paymentError && <p className="mt-1">{paymentError}</p>}
                                            <p className="mt-2">
                                                Your card has not been charged. Retry the payment, or contact support if the problem persists.
                                            </p>
                                            <Button
                                                type="button"
                                                variant="primary"
                                                size="sm"
                                                className="mt-3"
                                                onClick={() => order && chargeForOrder(order)}
                                            >
                                                Retry payment
                                            </Button>
                                        </div>
                                    )}
                                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                                        <Link href={`/orders/${order?.id}`} className={buttonClasses('primary', 'md')}>
                                            Track Order
                                        </Link>
                                        <Link href="/orders" className={buttonClasses('outline', 'md')}>
                                            View All Orders
                                        </Link>
                                        <Link href="/products" className={buttonClasses('outline', 'md')}>
                                            Continue Shopping
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Order summary sidebar */}
                        {cart && cart.cart.items.length > 0 && (
                            <div className="lg:col-span-1">
                                <div className="sticky top-24 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Order Summary</h3>
                                    <div className="mt-4 divide-y dark:divide-gray-700">
                                        {cart.cart.items.map((item) => (
                                            <div key={item.id} className="flex items-center gap-3 py-3">
                                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-gray-100">
                                                    {item.product?.image_url ? (
                                                        <Image src={item.product.image_url} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="flex h-full items-center justify-center text-gray-400"><ShoppingCart className="h-4 w-4" /></div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{item.product?.name ?? 'Product'}</p>
                                                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                                </div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatPrice(item.unit_price * item.quantity)}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Subtotal</span>
                                            <span>{formatPrice(parseFloat(cart.subtotal))}</span>
                                        </div>
                                        {parseFloat(cart.discount) > 0 && (
                                            <div className="flex justify-between text-sm text-green-600">
                                                <span>Discount</span>
                                                <span>-{formatPrice(parseFloat(cart.discount))}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Shipping</span>
                                            <span className={parseFloat(cart.shipping ?? '0') === 0 ? 'text-green-600' : ''}>
                                                {parseFloat(cart.shipping ?? '0') === 0 ? 'Free' : formatPrice(parseFloat(cart.shipping ?? '0'))}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-lg font-bold">
                                            <span>Total</span>
                                            <span>{formatPrice(parseFloat(cart.total))}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
