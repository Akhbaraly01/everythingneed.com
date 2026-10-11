import AppLayout from '@/layouts/AppLayout';
import { Head, router, usePage } from '@inertiajs/react';
import {  api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { Store } from 'lucide-react';
import { useState } from 'react';

export default function VendorRegister() {
    const { auth } = usePage().props as { auth?: { user?: { id: string } } };
    const [form, setForm] = useState({ store_name: '', category: '', description: '', business_type: 'individual', phone: '', address: '' });
    const [submitting, setSubmitting] = useState(false);

    const handleRegister = async () => {
        if (!auth?.user) { router.visit('/login'); return; }
        if (!form.category.trim()) { toast.warning('Please enter a store category'); return; }
        setSubmitting(true);
        try {
            await api.post('/api/vendors', {
                store_name: form.store_name,
                category: form.category,
                description: form.description,
                business_type: form.business_type,
                phone: form.phone,
                address: form.address,
            });
            router.visit('/vendor');
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to register'));
        }
        setSubmitting(false);
    };

    const inputClass = "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white";

    return (
        <AppLayout title="Become a Vendor">
            <Head title="Become a Vendor" />
            <div className="max-w-lg mx-auto space-y-6">
                <div className="text-center">
                    <Store className="mx-auto h-12 w-12 text-indigo-600" />
                    <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Become a Vendor</h1>
                    <p className="text-sm text-gray-500">Start selling on EverythingNeed</p>
                </div>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="space-y-4">
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Store Name *</label>
                            <input type="text" value={form.store_name} onChange={(e) => setForm({ ...form, store_name: e.target.value })} className={inputClass} /></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Store Category *</label>
                            <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Electronics, Fashion, Food" className={inputClass} /></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inputClass} /></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Business Type</label>
                            <select value={form.business_type} onChange={(e) => setForm({ ...form, business_type: e.target.value })} className={inputClass}>
                                <option value="individual">Individual</option><option value="business">Business</option><option value="corporation">Corporation</option>
                            </select></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} /></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                            <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} /></div>
                    </div>
                    <button onClick={handleRegister} disabled={submitting || !form.store_name}
                        className="mt-6 w-full rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
                        {submitting ? 'Registering...' : 'Register Store'}
                    </button>
                </div>
            </div>
        </AppLayout>
    );
}
