import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FoodCartItem {
    id: string;
    menu_item_id: string;
    quantity: number;
    unit_price: number;
    special_instructions?: string;
    menu_item?: { id: string; name: string; price: number; image_url?: string };
}

interface FoodCartData {
    items: FoodCartItem[];
    restaurant_id: string;
    restaurant_name: string;
    subtotal: number;
}

export default function FoodCartPage() {
    const [cart, setCart] = useState<FoodCartData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Food cart is stored client-side (localStorage)
        try {
            const stored = localStorage.getItem('food_cart');
            if (stored) {
                setCart(JSON.parse(stored));
            }
        } catch {}
        setLoading(false);
    }, []);

    const updateQty = (itemId: string, qty: number) => {
        if (!cart || qty < 1) return;
        const updated = { ...cart, items: cart.items.map((i) => i.id === itemId ? { ...i, quantity: qty } : i) };
        updated.subtotal = updated.items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
        setCart(updated);
        localStorage.setItem('food_cart', JSON.stringify(updated));
    };

    const removeItem = (itemId: string) => {
        if (!cart) return;
        const updated = { ...cart, items: cart.items.filter((i) => i.id !== itemId) };
        updated.subtotal = updated.items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
        if (updated.items.length === 0) {
            localStorage.removeItem('food_cart');
            setCart(null);
        } else {
            setCart(updated);
            localStorage.setItem('food_cart', JSON.stringify(updated));
        }
    };

    const placeOrder = async () => {
        if (!cart || cart.items.length === 0) return;
        try {
            await api.post(`/api/restaurants/${cart.restaurant_id}/order`, {
                items: cart.items.map((i) => ({ menu_item_id: i.menu_item_id, quantity: i.quantity, special_instructions: i.special_instructions })),
                delivery_address: 'Delivery address',
            });
            localStorage.removeItem('food_cart');
            router.visit('/food');
        } catch (e: any) {
            alert(e.message ?? 'Failed to place order');
        }
    };

    return (
        <AppLayout title="Food Cart">
            <Head title="Food Cart" />

            <div className="space-y-6">
                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading...</p></div>
                ) : !cart || cart.items.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Your food cart is empty</h3>
                        <Link href="/food" className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                            Browse Restaurants
                        </Link>
                    </div>
                ) : (
                    <div className="max-w-2xl space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Order from {cart.restaurant_name}</h2>
                        {cart.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 dark:text-white">{item.menu_item?.name ?? 'Item'}</p>
                                    {item.special_instructions && <p className="text-xs text-gray-500">{item.special_instructions}</p>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => updateQty(item.id, item.quantity - 1)} className="rounded border p-1 hover:bg-gray-50 dark:border-gray-600"><Minus className="h-3 w-3" /></button>
                                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                                    <button onClick={() => updateQty(item.id, item.quantity + 1)} className="rounded border p-1 hover:bg-gray-50 dark:border-gray-600"><Plus className="h-3 w-3" /></button>
                                </div>
                                <p className="w-20 text-right font-semibold">{formatCurrency(item.unit_price * item.quantity)}</p>
                                <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                            </div>
                        ))}
                        <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                            <div className="flex justify-between text-lg font-bold">
                                <span>Total</span>
                                <span>{formatCurrency(cart.subtotal)}</span>
                            </div>
                            <button onClick={placeOrder} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-500">
                                Place Order <ArrowRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
