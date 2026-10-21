import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import {  api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/currency';
import { Trash2, Plus, Minus, ArrowRight, ShoppingCart, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from '@/components/shared/Image';

interface CartItem {
    medicine_id: string;
    name: string;
    price: number;
    quantity: number;
    image_url?: string;
    requires_prescription?: boolean;
}

interface SavedAddress {
    id: string;
    line1: string;
    line2?: string | null;
    city: string;
    region?: string | null;
    postal_code?: string | null;
    country: string;
    is_default?: boolean;
}

const MANUAL = 'manual';

function formatAddress(address: SavedAddress): string {
    return [
        address.line1,
        address.line2,
        address.city,
        address.region,
        address.postal_code,
        address.country,
    ]
        .filter((part): part is string => Boolean(part && String(part).trim() !== ''))
        .join(', ');
}

export default function PharmacyCart() {
    const [items, setItems] = useState<CartItem[]>([]);
    const [blockedByPrescription, setBlockedByPrescription] = useState(false);
    const [addresses, setAddresses] = useState<SavedAddress[]>([]);
    const [addressChoice, setAddressChoice] = useState<string>(MANUAL);
    const [manualAddress, setManualAddress] = useState('');
    const [addressError, setAddressError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem('pharmacy_cart');
            if (stored) setItems(JSON.parse(stored));
        } catch {
            toast.warning('Your saved cart could not be read and has been cleared.');
            try { localStorage.removeItem('pharmacy_cart'); } catch { /* storage unavailable */ }
        }
    }, []);

    useEffect(() => {
        api.get<{ data: SavedAddress[] }>('/api/addresses')
            .then((res) => {
                const rows = res.data ?? [];
                setAddresses(rows);
                const preferred = rows.find((a) => a.is_default) ?? rows[0];
                if (preferred) setAddressChoice(preferred.id);
            })
            .catch(() => setAddresses([]));
    }, []);

    const updateQty = (medicineId: string, qty: number) => {
        if (qty < 1) return;
        const updated = items.map((i) => i.medicine_id === medicineId ? { ...i, quantity: qty } : i);
        setItems(updated);
        localStorage.setItem('pharmacy_cart', JSON.stringify(updated));
    };

    const removeItem = (medicineId: string) => {
        const updated = items.filter((i) => i.medicine_id !== medicineId);
        setItems(updated);
        if (updated.length === 0) localStorage.removeItem('pharmacy_cart');
        else localStorage.setItem('pharmacy_cart', JSON.stringify(updated));
    };

    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const hasRx = items.some((i) => i.requires_prescription);

    const resolveAddress = (): string => {
        if (addressChoice === MANUAL) return manualAddress.trim();
        const chosen = addresses.find((a) => a.id === addressChoice);
        return chosen ? formatAddress(chosen) : '';
    };

    const handleCheckout = async () => {
        if (items.length === 0) return;
        if (submitting) return;

        const deliveryAddress = resolveAddress();
        if (!deliveryAddress) {
            setAddressError('Choose a saved address or type where the medicines should be delivered.');
            return;
        }

        setAddressError('');
        setBlockedByPrescription(false);
        setSubmitting(true);
        try {
            const res = await api.post<{ data: { id: string } }>('/api/pharmacy/orders', {
                items: items.map((i) => ({ medicine_id: i.medicine_id, quantity: i.quantity })),
                delivery_address: deliveryAddress,
            });
            localStorage.removeItem('pharmacy_cart');
            router.visit(`/pharmacy/orders/${res.data.id}/confirmation`);
        } catch (e) {
            const message = errorMessage(e, 'Failed to place order');
            // L-H-4: the server gates Rx medicines behind an active
            // prescription — surface the path to fix it instead of a bare toast.
            if (/prescription/i.test(message)) setBlockedByPrescription(true);
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AppLayout title="Pharmacy Cart">
            <Head title="Pharmacy Cart" />

            <div className="max-w-2xl space-y-6">
                <Link href="/pharmacy" className="text-sm text-gray-500 hover:text-gray-700">&larr; Back to Pharmacy</Link>

                {items.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Your cart is empty</h3>
                        <Link href="/pharmacy" className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                            Browse Medicines
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {items.map((item) => (
                            <div key={item.medicine_id} className="flex items-center gap-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                    {item.image_url ? <Image src={item.image_url} alt="" className="h-full w-full object-cover" /> : null}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {item.name}
                                        {item.requires_prescription && (
                                            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                                                Rx required
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-sm text-gray-500">{formatPrice(item.price)} each</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => updateQty(item.medicine_id, item.quantity - 1)} className="rounded border p-1"><Minus className="h-3 w-3" /></button>
                                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                                    <button onClick={() => updateQty(item.medicine_id, item.quantity + 1)} className="rounded border p-1"><Plus className="h-3 w-3" /></button>
                                </div>
                                <p className="w-20 text-right font-semibold">{formatPrice(item.price * item.quantity)}</p>
                                <button onClick={() => removeItem(item.medicine_id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                            </div>
                        ))}

                        {(hasRx || blockedByPrescription) && (
                            <div
                                data-testid="prescription-notice"
                                className={`rounded-lg border p-4 text-sm ${
                                    blockedByPrescription
                                        ? 'border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200'
                                        : 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200'
                                }`}
                            >
                                <p className="font-semibold">
                                    {blockedByPrescription
                                        ? 'We could not place your order: an active prescription is required for one or more items.'
                                        : 'One or more items in your cart require an active prescription.'}
                                </p>
                                <p className="mt-1">
                                    Get a prescription from a doctor, or upload an existing one — then place your order.
                                </p>
                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-medium underline">
                                    <Link href="/pharmacy/prescription-upload">Upload a prescription</Link>
                                    <Link href="/healthcare/prescriptions">My prescriptions</Link>
                                    <Link href="/healthcare/doctors">Book a consultation</Link>
                                </div>
                            </div>
                        )}

                        {/* Delivery address */}
                        <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                                <MapPin className="h-4 w-4" /> Delivery address
                            </h2>

                            {addresses.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    {addresses.map((address) => (
                                        <label
                                            key={address.id}
                                            className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm ${
                                                addressChoice === address.id
                                                    ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-900/20'
                                                    : 'border-gray-200 dark:border-gray-700'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="delivery_address"
                                                value={address.id}
                                                checked={addressChoice === address.id}
                                                onChange={() => setAddressChoice(address.id)}
                                                className="mt-0.5 text-indigo-600"
                                            />
                                            <span className="text-gray-700 dark:text-gray-300">
                                                {formatAddress(address)}
                                                {address.is_default && (
                                                    <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-800">
                                                        Default
                                                    </span>
                                                )}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            <label
                                className={`mt-3 flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm ${
                                    addressChoice === MANUAL
                                        ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-900/20'
                                        : 'border-gray-200 dark:border-gray-700'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="delivery_address"
                                    value={MANUAL}
                                    checked={addressChoice === MANUAL}
                                    onChange={() => setAddressChoice(MANUAL)}
                                    className="mt-0.5 text-indigo-600"
                                />
                                <span className="w-full text-gray-700 dark:text-gray-300">
                                    <span className="block font-medium">Deliver to another address</span>
                                    <input
                                        type="text"
                                        value={manualAddress}
                                        onChange={(e) => setManualAddress(e.target.value)}
                                        placeholder="Street, city, region, postal code, country"
                                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
                                    />
                                </span>
                            </label>

                            {addressError && (
                                <p className="mt-2 text-xs text-red-600 dark:text-red-400">{addressError}</p>
                            )}
                        </div>

                        <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                            <div className="flex justify-between text-lg font-bold">
                                <span>Total</span><span>{formatPrice(subtotal)}</span>
                            </div>
                            <button
                                onClick={() => void handleCheckout()}
                                disabled={submitting}
                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {submitting ? 'Placing order...' : 'Place Order'} <ArrowRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
