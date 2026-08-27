import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle, CreditCard, ArrowRight, ArrowLeft, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';

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
    total: string;
    item_count: number;
}

interface PlacedOrder {
    id: string;
    order_number: string;
    total_amount: number;
    status: string;
}

export default function CheckoutPage() {
    const { auth } = usePage().props as { auth?: { user?: { id: string; name: string; email: string } } };
    const [step, setStep] = useState<'details' | 'payment' | 'done'>('details');
    const [cart, setCart] = useState<CartData | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [order, setOrder] = useState<PlacedOrder | null>(null);

    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');
    const [phone, setPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [method, setMethod] = useState('card');

    useEffect(() => {
        if (!auth?.user) {
            router.visit('/login');
            return;
        }
        api.get<CartData>('/api/cart')
            .then((data) => setCart(data))
            .catch(() => setCart(null))
            .finally(() => setLoading(false));
    }, []);

    const placeOrder = async () => {
        if (!address.trim()) return;
        setSubmitting(true);
        try {
            const res = await api.post<{ data: PlacedOrder }>('/api/product-orders', {
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

            try {
                await api.post('/api/payments/charge', {
                    order_id: placed.id,
                    amount: parseFloat(cart!.total),
                    method,
                });
            } catch {}

            setStep('done');
        } catch (e: any) {
            alert(e.message ?? 'Failed to place order');
        } finally {
            setSubmitting(false);
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
                ) : itemCount === 0 && step !== 'done' ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Your cart is empty</h3>
                        <Link href="/products" className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
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
                                    <button
                                        onClick={() => address.trim() && setStep('payment')}
                                        disabled={!address.trim()}
                                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                                    >
                                        Continue to Payment <ArrowRight className="h-5 w-5" />
                                    </button>
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
                                        ].map((opt) => (
                                            <label key={opt.value} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700">
                                                <input type="radio" name="method" value={opt.value} checked={method === opt.value} onChange={(e) => setMethod(e.target.value)} className="text-indigo-600" />
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">{opt.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <p className="mt-4 rounded-lg bg-yellow-50 p-3 text-xs text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                                        Test mode — no real payment will be charged.
                                    </p>
                                    <div className="mt-6 flex gap-3">
                                        <button onClick={() => setStep('details')} className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600">
                                            <ArrowLeft className="h-4 w-4" /> Back
                                        </button>
                                        <button
                                            onClick={placeOrder}
                                            disabled={submitting}
                                            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                                        >
                                            <CreditCard className="h-5 w-5" />
                                            {submitting ? 'Placing Order...' : `Pay ${cart ? formatCurrency(parseFloat(cart.total)) : ''}`}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 'done' && (
                                <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                                    <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                                    <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Order Placed!</h2>
                                    <p className="mt-2 text-gray-500">Order #{order?.order_number}</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Total: {order ? formatCurrency(order.total_amount) : ''}
                                    </p>
                                    <div className="mt-8 flex justify-center gap-4">
                                        <Link href={`/orders/${order?.id}`} className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                                            Track Order
                                        </Link>
                                        <Link href="/orders" className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600">
                                            View All Orders
                                        </Link>
                                        <Link href="/products" className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600">
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
                                                        <img src={item.product.image_url} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="flex h-full items-center justify-center text-gray-400"><ShoppingCart className="h-4 w-4" /></div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{item.product?.name ?? 'Product'}</p>
                                                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                                </div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(item.unit_price * item.quantity)}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Subtotal</span>
                                            <span>{formatCurrency(parseFloat(cart.subtotal))}</span>
                                        </div>
                                        {parseFloat(cart.discount) > 0 && (
                                            <div className="flex justify-between text-sm text-green-600">
                                                <span>Discount</span>
                                                <span>-{formatCurrency(parseFloat(cart.discount))}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-lg font-bold">
                                            <span>Total</span>
                                            <span>{formatCurrency(parseFloat(cart.total))}</span>
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
