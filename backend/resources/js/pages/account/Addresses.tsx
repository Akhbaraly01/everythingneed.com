import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { MapPin, Plus, Trash2, Check } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Address {
    id: string;
    label: string;
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    is_default: boolean;
}

export default function AccountAddresses() {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ label: 'Home', street: '', city: '', state: '', postal_code: '', country: 'US' });

    useEffect(() => {
        api.get<{ data: Address[] }>('/api/user/addresses')
            .then((res) => setAddresses(res.data))
            .catch(() => setAddresses([]))
            .finally(() => setLoading(false));
    }, []);

    const addAddress = async () => {
        try {
            const res = await api.post<{ data: Address }>('/api/user/addresses', form);
            setAddresses([...addresses, res.data]);
            setShowForm(false);
            setForm({ label: 'Home', street: '', city: '', state: '', postal_code: '', country: 'US' });
        } catch {}
    };

    const deleteAddress = async (id: string) => {
        try {
            await api.del(`/api/user/addresses/${id}`);
            setAddresses(addresses.filter((a) => a.id !== id));
        } catch {}
    };

    const setDefault = async (id: string) => {
        try {
            await api.put(`/api/user/addresses/${id}/default`);
            setAddresses(addresses.map((a) => ({ ...a, is_default: a.id === id })));
        } catch {}
    };

    return (
        <AppLayout title="My Addresses">
            <Head title="My Addresses" />

            <div className="max-w-2xl space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Addresses</h1>
                    <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                        <Plus className="h-4 w-4" /> Add Address
                    </button>
                </div>

                {showForm && (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="font-semibold text-gray-900 dark:text-white">New Address</h2>
                        <div className="mt-4 space-y-3">
                            <input type="text" placeholder="Label (Home, Work)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                            <input type="text" placeholder="Street address" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })}
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                            <div className="grid grid-cols-2 gap-3">
                                <input type="text" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                <input type="text" placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
                                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <input type="text" placeholder="Postal code" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                <input type="text" placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
                                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button onClick={addAddress} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">Save</button>
                            <button onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : addresses.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No addresses</h3>
                        <p className="mt-2 text-gray-500">Add a delivery address to get started.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {addresses.map((a) => (
                            <div key={a.id} className={`flex items-center justify-between rounded-lg bg-white p-4 shadow dark:bg-gray-800 ${a.is_default ? 'ring-2 ring-indigo-500' : ''}`}>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-900 dark:text-white">{a.label}</span>
                                        {a.is_default && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">Default</span>}
                                    </div>
                                    <p className="text-sm text-gray-500">{a.street}, {a.city}, {a.state} {a.postal_code}</p>
                                    <p className="text-sm text-gray-500">{a.country}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!a.is_default && (
                                        <button onClick={() => setDefault(a.id)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-indigo-600" title="Set as default">
                                            <Check className="h-4 w-4" />
                                        </button>
                                    )}
                                    <button onClick={() => deleteAddress(a.id)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600" title="Delete">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
