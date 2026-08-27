import AppLayout from '@/layouts/AppLayout';
import { Head, usePage } from '@inertiajs/react';
import { api } from '@/lib/api';
import { User } from 'lucide-react';
import { useState } from 'react';

export default function SettingsProfile() {
    const { auth } = usePage().props as { auth: { user: { id: string; name: string; email: string; phone?: string } } };
    const [name, setName] = useState(auth.user.name);
    const [email, setEmail] = useState(auth.user.email);
    const [phone, setPhone] = useState(auth.user.phone ?? '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/api/user/profile', { name, email, phone });
            alert('Profile updated');
        } catch (e: any) {
            alert(e.message ?? 'Failed to save');
        }
        setSaving(false);
    };

    return (
        <AppLayout title="Profile Settings">
            <Head title="Profile Settings" />
            <div className="max-w-2xl space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700" />
                        </div>
                    </div>
                    <button onClick={handleSave} disabled={saving}
                        className="mt-6 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </AppLayout>
    );
}
