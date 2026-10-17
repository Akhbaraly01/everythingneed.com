import AppLayout from '@/layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { useEffect, useState } from 'react';
import { Package, ArrowRight } from 'lucide-react';
import MediaUploadInput from '@/components/shared/MediaUploadInput';

export default function VendorProductCreate() {
    const [form, setForm] = useState({ vendor_id: '', name: '', description: '', category: '', price: '', stock_quantity: '', image_url: '', video_url: '' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get<{ data: { id: string } }>('/api/vendors/mine')
            .then((res) => setForm((f) => ({ ...f, vendor_id: res.data.id })))
            .catch(() => setError('You need a vendor profile before adding products.'));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.vendor_id) { setError('Your vendor profile is still loading - try again in a moment.'); return; }
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
                    <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Product Name</label><input required data-testid="product-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></div>
                    <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Category</label><input required data-testid="product-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></div>
                        <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Price</label><input type="number" step="0.01" required data-testid="product-price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Stock Quantity</label><input type="number" required data-testid="product-stock" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></div>
                        <MediaUploadInput
                            kind="image"
                            value={form.image_url}
                            onChange={(url) => setForm({ ...form, image_url: url })}
                            folder="products"
                            label="Product photo"
                            uploadTestId="product-image"
                            hint="Uploaded photos are auto-compressed (no manual resizing)."
                        />
                    </div>
                    <MediaUploadInput
                        kind="video"
                        value={form.video_url}
                        onChange={(url) => setForm({ ...form, video_url: url })}
                        folder="products"
                        label="Product video (plays in-app on your product page)"
                        linkTestId="product-video-url"
                        uploadTestId="product-video"
                        hint="Upload a video (auto-compressed) or paste a YouTube/MP4 link."
                    />
                </div>
                <button type="submit" disabled={submitting || !form.vendor_id} data-testid="product-submit" className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {submitting ? 'Creating...' : 'Create Product'} <ArrowRight className="h-4 w-4" />
                </button>
            </form>
        </AppLayout>
    );
}
