import AppLayout from '@/layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { ArrowRight, Pill } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CartItem {
    medicine_id: string;
    name: string;
    price: number;
    quantity: number;
    image_url?: string;
}

export default function PharmacyCheckout() {
    const [items, setItems] = useState<CartItem[]>([]);
    const [address, setAddress] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem('pharmacy_cart');
            if (stored) setItems(JSON.parse(stored));
        } catch {}
    }, []);

    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const handleOrder = async () => {
        if (!address.trim() || items.length === 0) return;
        setSubmitting(true);
        try {
            await api.post('/api/orders/pharmacy', {
                items: items.map((i) => ({ medicine_id: i.medicine_id, quantity: i.quantity })),
                shipping_address: address,
            });
            localStorage.removeItem('pharmacy_cart');
            router.visit('/orders');
        } catch (e: any) {
            alert(e.message ?? 'Failed to place order');
        }
        setSubmitting(false);
    };

    if (items.length === 0) {
        return (
            <AppLayout title="Pharmacy Checkout">
                <Head title="Pharmacy Checkout" />
                <div className="text-center py-12">
                    <Pill className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4 text-gray-500">Your pharmacy cart is empty.</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Pharmacy Checkout">
            <Head title="Pharmacy Checkout" />

            <div className="max-w-2xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pharmacy Checkout</h1>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Order Summary</h2>
                    {items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm py-1">
                            <span>{item.quantity}x {item.name}</span>
                            <span>{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                    ))}
                    <div className="mt-3 border-t pt-3 flex justify-between font-bold">
                        <span>Total</span><span>{formatCurrency(subtotal)}</span>
                    </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Shipping Address *</label>
                    <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} required
                        placeholder="Enter your delivery address..."
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700" />
                </div>

                <button onClick={handleOrder} disabled={submitting || !address.trim()}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
                    Place Order <ArrowRight className="h-5 w-5" />
                </button>
            </div>
        </AppLayout>
    );
}
