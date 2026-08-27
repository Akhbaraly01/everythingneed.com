import AppLayout from '@/layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import { CreditCard, MapPin, Clock, CheckCircle, ArrowRight } from 'lucide-react';

interface CartItem {
    id: string;
    menu_item: { name: string; price: number; image_url: string };
    quantity: number;
    special_instructions: string;
}

interface Restaurant {
    id: string;
    name: string;
    delivery_fee: number;
}

export default function FoodCheckout() {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ delivery_address: '', phone: '', notes: '' });

    useEffect(() => {
        api.get('/api/food/cart')
            .then((res: any) => {
                setCartItems(res.data?.items || []);
                setRestaurant(res.data?.restaurant || null);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const subtotal = cartItems.reduce((sum, i) => sum + i.menu_item.price * i.quantity, 0);
    const deliveryFee = restaurant?.delivery_fee || 0;
    const total = subtotal + deliveryFee;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await api.post<{ data: { id: string } }>('/api/food/orders', {
                restaurant_id: restaurant?.id,
                items: cartItems.map((i) => ({ menu_item_id: i.menu_item.id || i.id, quantity: i.quantity, special_instructions: i.special_instructions })),
                ...form,
            });
            router.visit(`/food/orders/${res.data.id}`);
        } catch {
            setSubmitting(false);
        }
    };

    if (loading) return <AppLayout title="Food Checkout"><p className="p-12 text-center text-gray-500">Loading...</p></AppLayout>;
    if (cartItems.length === 0) return <AppLayout title="Food Checkout"><p className="p-12 text-center text-gray-500">Your cart is empty</p></AppLayout>;

    return (
        <AppLayout title="Food Checkout">
            <Head title="Food Checkout" />
            <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Checkout</h1>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-4">
                    <h2 className="font-semibold text-gray-900 dark:text-white">Delivery Details</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Delivery Address</label>
                        <input
                            required
                            value={form.delivery_address}
                            onChange={(e) => setForm({ ...form, delivery_address: e.target.value })}
                            className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                            placeholder="Full delivery address"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                        <input
                            required
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                            placeholder="Contact phone number"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Special Instructions</label>
                        <textarea
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            rows={2}
                            className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                            placeholder="Any special instructions for delivery..."
                        />
                    </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h2>
                    <div className="divide-y dark:divide-gray-700">
                        {cartItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between py-3">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{item.menu_item.name}</p>
                                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-white">${(item.menu_item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 space-y-2 border-t pt-4 dark:border-gray-700">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="text-gray-900 dark:text-white">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Delivery Fee</span>
                            <span className="text-gray-900 dark:text-white">${deliveryFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                            <span className="text-gray-900 dark:text-white">Total</span>
                            <span className="text-gray-900 dark:text-white">${total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {submitting ? 'Placing Order...' : 'Place Order'} <ArrowRight className="h-4 w-4" />
                </button>
            </form>
        </AppLayout>
    );
}
