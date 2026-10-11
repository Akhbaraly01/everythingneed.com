import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api';
import VendorTabs from '@/components/vendor/VendorTabs';

const emptyForm = { name: '', description: '', price: '', duration_minutes: '', is_active: true };

export default function VendorServiceCreate() {
    const [form, setForm] = useState(emptyForm);
    const [busy, setBusy] = useState(false);

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        try {
            await api.post('/api/vendor/services', {
                name: form.name,
                description: form.description || undefined,
                price: Number(form.price),
                duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : undefined,
                is_active: form.is_active,
            });
            toast.success('Service created');
            router.visit('/vendor/services');
        } catch (err) {
            toast.error(errorMessage(err, 'Could not create the service'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <AppLayout title="New service">
            <Head title="New service" />
            <div className="mx-auto max-w-2xl space-y-4">
                <VendorTabs />

                <form onSubmit={save} className="space-y-4 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">New service</h1>
                        <Link href="/vendor/services" className="text-sm text-gray-500 hover:text-indigo-600">
                            Back to services
                        </Link>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                        <input
                            required
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            placeholder="e.g. Deep clean - 2 bedroom"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                            rows={4}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Price</label>
                            <input
                                required
                                type="number"
                                min={0}
                                step="0.01"
                                value={form.price}
                                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Duration (minutes)</label>
                            <input
                                type="number"
                                min={1}
                                value={form.duration_minutes}
                                onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))}
                                placeholder="optional"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        Visible on my store page
                    </label>

                    <div className="flex justify-end gap-2">
                        <Link href="/vendor/services" className="rounded-lg px-4 py-2 text-sm text-gray-500">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={busy}
                            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                            {busy ? 'Creating…' : 'Create service'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
