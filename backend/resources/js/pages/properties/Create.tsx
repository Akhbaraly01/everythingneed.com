import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {  api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { Building2, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

export default function PropertyCreate() {
    const { auth } = usePage().props as { auth?: { user?: { id: string } } };
    const [form, setForm] = useState({
        title: '', description: '', listing_type: 'sale', property_type: 'apartment', price: '',
        address: '', city: '', state: '', country: '', bedrooms: '1', bathrooms: '1', area_sqft: '',
        image_url: '',
    });
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (key: string, val: string) => setForm({ ...form, [key]: val });

    const handleSubmit = async () => {
        if (!auth?.user) { router.visit('/login'); return; }
        setSubmitting(true);
        try {
            await api.post('/api/properties', {
                ...form,
                price: parseFloat(form.price) || 0,
                bedrooms: parseInt(form.bedrooms) || 1,
                bathrooms: parseInt(form.bathrooms) || 1,
                area_sqft: parseFloat(form.area_sqft) || 0,
            });
            router.visit('/properties');
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to create'));
        }
        setSubmitting(false);
    };

    const inputClass = "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white";

    return (
        <AppLayout title="List Property">
            <Head title="List Property" />
            <div className="max-w-2xl mx-auto space-y-6">
                <Link href="/properties" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4" /> Back to Properties
                </Link>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">List a Property</h1>
                    <p className="text-sm text-gray-500">Fill in details to list your property</p>

                    <div className="mt-6 space-y-4">
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title *</label>
                            <input type="text" value={form.title} onChange={(e) => handleChange('title', e.target.value)} className={inputClass} /></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                            <textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)} rows={4} className={inputClass} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Listing</label>
                                <select value={form.listing_type} onChange={(e) => handleChange('listing_type', e.target.value)} className={inputClass}>
                                    <option value="sale">For Sale</option><option value="rent">For Rent</option>
                                </select></div>
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                                <select value={form.property_type} onChange={(e) => handleChange('property_type', e.target.value)} className={inputClass}>
                                    <option value="apartment">Apartment</option><option value="house">House</option><option value="condo">Condo</option><option value="land">Land</option><option value="commercial">Commercial</option>
                                </select></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price *</label>
                                <input type="number" value={form.price} onChange={(e) => handleChange('price', e.target.value)} className={inputClass} /></div>
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address *</label>
                                <input type="text" value={form.address} onChange={(e) => handleChange('address', e.target.value)} className={inputClass} /></div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">City *</label>
                                <input type="text" value={form.city} onChange={(e) => handleChange('city', e.target.value)} className={inputClass} /></div>
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">State</label>
                                <input type="text" value={form.state} onChange={(e) => handleChange('state', e.target.value)} className={inputClass} /></div>
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Country</label>
                                <input type="text" value={form.country} onChange={(e) => handleChange('country', e.target.value)} className={inputClass} /></div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bedrooms</label>
                                <input type="number" value={form.bedrooms} onChange={(e) => handleChange('bedrooms', e.target.value)} className={inputClass} /></div>
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bathrooms</label>
                                <input type="number" value={form.bathrooms} onChange={(e) => handleChange('bathrooms', e.target.value)} className={inputClass} /></div>
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Area (sqft)</label>
                                <input type="number" value={form.area_sqft} onChange={(e) => handleChange('area_sqft', e.target.value)} className={inputClass} /></div>
                        </div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Image URL</label>
                            <input type="url" value={form.image_url} onChange={(e) => handleChange('image_url', e.target.value)} placeholder="https://..." className={inputClass} /></div>
                    </div>

                    <button onClick={handleSubmit} disabled={submitting || !form.title || !form.price || !form.city || !form.address}
                        className="mt-6 w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
                        <Building2 className="h-5 w-5" /> {submitting ? 'Creating...' : 'List Property'}
                    </button>
                </div>
            </div>
        </AppLayout>
    );
}
