import AppLayout from '@/layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { Package, ArrowRight } from 'lucide-react';

export default function VendorProductEdit({ product_id }: { product_id?: string }) {
    const [form, setForm] = useState({ name: '', description: '', category: '', price: '', stock_quantity: '', image_url: '', is_active: true });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const id = product_id || window.location.pathname.split('/').pop();
        if (id) {
            api.get<{ data: { name: string; description?: string | null; category: string; price: number | string; stock_quantity: number | string; image_url?: string | null; is_active: boolean } }>(`/api/products/${id}`)
                .then((res) => setForm({ name: res.data.name, description: res.data.description || '', category: res.data.category, price: String(res.data.price), stock_quantity: String(res.data.stock_quantity), image_url: res.data.image_url || '', is_active: res.data.is_active }))
                .catch(() => {})
                .finally(() => setLoading(false));
        } else setLoading(false);
    }, [product_id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const id = product_id || window.location.pathname.split('/').pop();
        setSubmitting(true);
        try {
            await api.put(`/api/vendor/products/${id}`, { ...form, price: parseFloat(form.price), stock_quantity: parseInt(form.stock_quantity) });
            router.visit('/vendor/products');
        } catch (err) {
            toast.error(errorMessage(err, 'Failed to save the product'));
            setSubmitting(false);
        }
    };

    if (loading) return <AppLayout title="Edit Product"><p className="p-12 text-center text-gray-500">Loading...</p></AppLayout>;

    return (
        <AppLayout title="Edit Product">
            <Head title="Edit Product" />
            <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Package className="h-6 w-6" /> Edit Product</h1>
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-4">
                    <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Product Name</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></div>
                    <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Category</label><input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></div>
                        <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Price</label><input type="number" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Stock</label><input type="number" required value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></div>
                        <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Image URL</label><input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></div>
                    </div>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
                </div>
                <button type="submit" disabled={submitting} className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {submitting ? 'Saving...' : 'Save Changes'} <ArrowRight className="h-4 w-4" />
                </button>
            </form>
        </AppLayout>
    );
}
