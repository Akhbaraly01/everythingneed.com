import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { api, ApiError } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X, Package } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    category: string;
    price: number | string;
    stock_quantity: number;
    is_active: boolean;
}

interface Props {
    products: { data: Product[]; current_page: number; last_page: number; total: number };
}

const emptyForm = { name: '', category: '', price: '', stock_quantity: '0', description: '' };

export default function VendorProducts({ products }: Props) {
    const [editing, setEditing] = useState<Product | null>(null);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [busy, setBusy] = useState(false);

    const openCreate = () => { setForm(emptyForm); setEditing(null); setCreating(true); };
    const openEdit = (p: Product) => {
        setForm({ name: p.name, category: p.category, price: String(p.price), stock_quantity: String(p.stock_quantity), description: '' });
        setEditing(p);
        setCreating(true);
    };

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        try {
            const payload = {
                name: form.name,
                category: form.category,
                price: Number(form.price),
                stock_quantity: Number(form.stock_quantity),
            };

            if (editing) {
                await api.put(`/api/products/${editing.id}`, payload);
                toast.success('Product updated');
            } else {
                await api.post('/api/products', payload);
                toast.success('Product created');
            }
            setCreating(false);
            router.reload({ only: ['products'] });
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Save failed');
        } finally {
            setBusy(false);
        }
    };

    const toggleActive = async (p: Product) => {
        try {
            await api.put(`/api/products/${p.id}`, { is_active: !p.is_active });
            router.reload({ only: ['products'] });
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Update failed');
        }
    };

    const destroy = async (p: Product) => {
        if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
        try {
            await api.del(`/api/products/${p.id}`);
            toast.success('Product deleted');
            router.reload({ only: ['products'] });
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Delete failed');
        }
    };

    return (
        <AppLayout title="Vendor products">
            <Head title="My products" />
            <div className="mx-auto max-w-5xl px-4 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Products</h1>
                    <button onClick={openCreate} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                        <Plus className="h-4 w-4" /> Add product
                    </button>
                </div>

                {products.data.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 p-16 text-center dark:border-gray-600">
                        <Package className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                        <p className="font-medium text-gray-900 dark:text-white">No products yet</p>
                        <button onClick={openCreate} className="mt-3 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                            Create your first product
                        </button>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-5 py-3">Product</th>
                                    <th className="px-5 py-3">Category</th>
                                    <th className="px-5 py-3">Price</th>
                                    <th className="px-5 py-3">Stock</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {products.data.map((p) => (
                                    <tr key={p.id}>
                                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{p.name}</td>
                                        <td className="px-5 py-3 capitalize text-gray-500">{p.category}</td>
                                        <td className="px-5 py-3 font-semibold text-indigo-600">{formatCurrency(Number(p.price))}</td>
                                        <td className="px-5 py-3">{p.stock_quantity > 0 ? p.stock_quantity : <span className="text-red-500">Out</span>}</td>
                                        <td className="px-5 py-3">
                                            <button onClick={() => toggleActive(p)} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                                                {p.is_active ? 'Active' : 'Hidden'}
                                            </button>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openEdit(p)} className="text-gray-400 hover:text-indigo-600"><Pencil className="h-4 w-4" /></button>
                                                <button onClick={() => destroy(p)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Create / edit modal */}
                {creating && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/50" onClick={() => setCreating(false)} />
                        <form onSubmit={save} className="relative w-full max-w-md space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                            <div className="flex items-center justify-between">
                                <h2 className="font-bold text-gray-900 dark:text-white">{editing ? 'Edit product' : 'New product'}</h2>
                                <button type="button" onClick={() => setCreating(false)}><X className="h-5 w-5 text-gray-400" /></button>
                            </div>
                            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Product name" className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                            <input required value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="Category (e.g. electronics)" className="w-full rounded-lg border-gray-300 text-sm capitalize dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                            <div className="grid grid-cols-2 gap-3">
                                <input required type="number" min={0.01} step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="Price" className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                                <input required type="number" min={0} value={form.stock_quantity} onChange={(e) => setForm((f) => ({ ...f, stock_quantity: e.target.value }))} placeholder="Stock" className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setCreating(false)} className="rounded-lg px-4 py-2 text-sm text-gray-500">Cancel</button>
                                <button type="submit" disabled={busy} className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
                                    {busy ? 'Saving…' : editing ? 'Save changes' : 'Create product'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
