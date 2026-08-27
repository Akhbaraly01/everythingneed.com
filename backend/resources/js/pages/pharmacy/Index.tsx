import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Pill, Search, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Medicine {
    id: string;
    name: string;
    description?: string;
    category?: string;
    price: number;
    stock_quantity: number;
    requires_prescription: boolean;
    image_url?: string;
}

export default function PharmacyIndex() {
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    useEffect(() => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (categoryFilter) params.set('category', categoryFilter);
        const qs = params.toString();

        api.get<{ data: Medicine[] }>(`/api/medicines${qs ? `?${qs}` : ''}`)
            .then((res) => setMedicines(res.data))
            .catch(() => setMedicines([]))
            .finally(() => setLoading(false));
    }, [search, categoryFilter]);

    const addToCart = (med: Medicine) => {
        if (med.requires_prescription) {
            alert('This medicine requires a valid prescription. Please upload a prescription first.');
            return;
        }
        try {
            const cart = JSON.parse(localStorage.getItem('pharmacy_cart') ?? '[]');
            const existing = cart.find((i: any) => i.medicine_id === med.id);
            if (existing) { existing.quantity += 1; } else {
                cart.push({ medicine_id: med.id, name: med.name, price: med.price, quantity: 1, image_url: med.image_url });
            }
            localStorage.setItem('pharmacy_cart', JSON.stringify(cart));
            alert('Added to cart');
        } catch {}
    };

    return (
        <AppLayout title="Pharmacy">
            <Head title="Pharmacy" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pharmacy</h1>
                    <p className="text-sm text-gray-500">Order medicines and healthcare products</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search medicines..."
                            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700" />
                    </div>
                    <Link href="/pharmacy/cart" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                        <ShoppingCart className="h-4 w-4" /> Cart
                    </Link>
                </div>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading...</p></div>
                ) : medicines.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Pill className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No medicines found</h3>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {medicines.map((med) => (
                            <div key={med.id} className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center dark:bg-gray-700">
                                    {med.image_url ? <img src={med.image_url} alt="" className="h-full w-full object-cover rounded-lg" /> : <Pill className="h-10 w-10 text-gray-400" />}
                                </div>
                                <div className="mt-3">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{med.name}</h3>
                                    {med.category && <p className="text-xs text-indigo-600">{med.category}</p>}
                                    {med.description && <p className="mt-1 text-xs text-gray-500 line-clamp-2">{med.description}</p>}
                                    {med.requires_prescription && <p className="mt-1 text-xs text-orange-600 font-medium">Prescription required</p>}
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(med.price)}</span>
                                        <button onClick={() => addToCart(med)} disabled={med.stock_quantity <= 0}
                                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
                                            {med.stock_quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
