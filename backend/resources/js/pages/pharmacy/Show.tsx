import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { Pill, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/currency';

interface Medicine {
    id: string;
    name: string;
    generic_name?: string | null;
    category: string;
    description?: string | null;
    price: number;
    image_url?: string | null;
    requires_prescription: boolean;
    stock_quantity: number;
    dosage_form?: string | null;
    strength?: string | null;
    manufacturer?: string | null;
    vendor?: { id: string; store_name?: string } | null;
}

interface ShowProps {
    product_id: string;
}

export default function PharmacyShow({ product_id }: ShowProps) {
    const [medicine, setMedicine] = useState<Medicine | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [added, setAdded] = useState(false);

    useEffect(() => {
        api.get<{ data: Medicine }>(`/api/medicines/${product_id}`)
            .then((res) => setMedicine(res.data))
            .catch((e) => setError(errorMessage(e, 'Product not found')))
            .finally(() => setLoading(false));
    }, [product_id]);

    const addToCart = () => {
        if (!medicine) return;
        const cart = JSON.parse(localStorage.getItem('pharmacy_cart') ?? '[]') as {
            medicine_id: string; name: string; price: number; quantity: number; image_url?: string | null; requires_prescription?: boolean;
        }[];
        const existing = cart.find((item) => item.medicine_id === medicine.id);
        if (existing) {
            existing.quantity += 1;
            // Sync the gate flag so the cart can warn even for legacy rows.
            existing.requires_prescription = medicine.requires_prescription;
        } else {
            cart.push({
                medicine_id: medicine.id,
                name: medicine.name,
                price: Number(medicine.price),
                quantity: 1,
                image_url: medicine.image_url,
                requires_prescription: medicine.requires_prescription,
            });
        }
        localStorage.setItem('pharmacy_cart', JSON.stringify(cart));
        setAdded(true);
    };

    return (
        <AppLayout title="Pharmacy Product">
            <Head title="Pharmacy Product" />
            <div className="mx-auto max-w-2xl space-y-6">
                <Link href="/pharmacy" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    ← All medicines
                </Link>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">Loading product...</p>
                    </div>
                ) : error || !medicine ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Pill className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Product not found</h3>
                        <p className="mt-1 text-sm text-gray-500">{error ?? 'This medicine does not exist.'}</p>
                    </div>
                ) : (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{medicine.name}</h1>
                            {medicine.requires_prescription && (
                                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                                    Prescription required
                                </span>
                            )}
                        </div>
                        {medicine.generic_name && <p className="text-sm text-gray-500">{medicine.generic_name}</p>}
                        <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{formatPrice(medicine.price)}</p>
                        {medicine.description && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{medicine.description}</p>}

                        <dl className="mt-6 space-y-3 text-sm">
                            <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
                                <dt className="text-gray-500">Category</dt>
                                <dd className="font-medium capitalize text-gray-900 dark:text-white">{medicine.category}</dd>
                            </div>
                            {medicine.dosage_form && (
                                <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
                                    <dt className="text-gray-500">Dosage form</dt>
                                    <dd className="font-medium text-gray-900 dark:text-white">{medicine.dosage_form}</dd>
                                </div>
                            )}
                            {medicine.strength && (
                                <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
                                    <dt className="text-gray-500">Strength</dt>
                                    <dd className="font-medium text-gray-900 dark:text-white">{medicine.strength}</dd>
                                </div>
                            )}
                            {medicine.manufacturer && (
                                <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
                                    <dt className="text-gray-500">Manufacturer</dt>
                                    <dd className="font-medium text-gray-900 dark:text-white">{medicine.manufacturer}</dd>
                                </div>
                            )}
                            {medicine.vendor?.store_name && (
                                <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
                                    <dt className="text-gray-500">Seller</dt>
                                    <dd className="font-medium text-gray-900 dark:text-white">{medicine.vendor.store_name}</dd>
                                </div>
                            )}
                            <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
                                <dt className="text-gray-500">Availability</dt>
                                <dd className="font-medium text-gray-900 dark:text-white">
                                    {medicine.stock_quantity > 0 ? `${medicine.stock_quantity} in stock` : 'Out of stock'}
                                </dd>
                            </div>
                            {medicine.requires_prescription && (
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Prescription</dt>
                                    <dd className="font-medium text-amber-600">Required — upload one at checkout</dd>
                                </div>
                            )}
                        </dl>

                        {added ? (
                            <Link href="/pharmacy/cart" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-500">
                                <ShoppingCart className="h-4 w-4" /> Added — view cart
                            </Link>
                        ) : (
                            <button
                                onClick={addToCart}
                                disabled={medicine.stock_quantity <= 0}
                                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                            >
                                <ShoppingCart className="h-4 w-4" />
                                {medicine.stock_quantity > 0 ? 'Add to cart' : 'Out of stock'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
