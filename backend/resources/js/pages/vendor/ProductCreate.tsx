import AppLayout from '@/layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { useState } from 'react';
import { Package, ArrowRight } from 'lucide-react';
import ImageUploadField from '@/components/shared/ImageUploadField';

export default function VendorProductCreate() {
    const [form, setForm] = useState({ name: '', description: '', category: '', price: '', stock_quantity: '', image_url: '', video_url: '' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true); setError('');
        try {
            await api.post('/api/vendor/products', { ...form, price: parseFloat(form.price), stock_quantity: parseInt(form.stock_quantity) });
            router.visit('/vendor/products');
        } catch (err) { setError(errorMessage(err, 'Failed to create product')); setSubmitting(false); }
    };

    return (
        <AppLayout title="Add Product">
            <Head title="Add Product" />
            <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Package className="h-6 w-6" /> Add Product</h1>
                {error && <div className="rounded bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20">{error}</div>}
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-4">
                    <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Product Name</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></div>
                    <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Category</label><input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></div>
                        <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Price</label><input type="number" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Stock Quantity</label><input type="number" required value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></div>
                        <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Image URL</label><input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://… or upload below" className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></div>
                    </div>
                    <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Video URL (plays in-app on your product page)</label><input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://www.youtube.com/watch?v=… or MP4 link" className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></div>
                    <ImageUploadField
                        value={form.image_url ? [form.image_url] : []}
                        onChange={(urls) => setForm({ ...form, image_url: urls[0] ?? '' })}
                        folder="products"
                        max={1}
                        label="Product photo or video (upload)"
                        hint="Upload fills the Image URL above. JPG, PNG, GIF, MP4, WebM up to 10MB."
                    />
                </div>
                <button type="submit" disabled={submitting} className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {submitting ? 'Creating...' : 'Create Product'} <ArrowRight className="h-4 w-4" />
                </button>
            </form>
        </AppLayout>
    );
}
