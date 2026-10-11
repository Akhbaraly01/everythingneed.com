import AppLayout from '@/layouts/AppLayout';
import { Head, router, usePage } from '@inertiajs/react';
import {  api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { Camera } from 'lucide-react';
import { useState } from 'react';
import Image from '@/components/shared/Image';

export default function AccountProfile() {
    const { auth } = usePage().props as unknown as { auth: { user: { id: string; name: string; email: string; phone?: string; avatar_url?: string } } };
    const [name, setName] = useState(auth.user.name);
    const [phone, setPhone] = useState(auth.user.phone ?? '');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            await api.put('/api/profile', { full_name: name, phone });
            router.reload({ only: ['auth'] });
            setSaved(true);
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to save'));
        }
        setSaving(false);
    };

    return (
        <AppLayout title="My Profile">
            <Head title="My Profile" />

            <div className="max-w-2xl space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="relative h-20 w-20 rounded-full bg-gray-200">
                            {auth.user.avatar_url ? (
                                <Image src={auth.user.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                            ) : (
                                <div className="flex h-full items-center justify-center text-2xl font-bold text-gray-500">
                                    {auth.user.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <button className="absolute bottom-0 right-0 rounded-full bg-indigo-600 p-1.5 text-white hover:bg-indigo-500">
                                <Camera className="h-3 w-3" />
                            </button>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{auth.user.name}</p>
                            <p className="text-sm text-gray-500">{auth.user.email}</p>
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input type="email" value={auth.user.email} readOnly title="Email cannot be changed here"
                                className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none dark:border-gray-600 dark:bg-gray-700" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700" />
                        </div>
                    </div>

                    <button onClick={handleSave} disabled={saving}
                        className="mt-6 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    {saved && <p className="mt-2 text-sm text-green-600">Profile saved.</p>}
                </div>
            </div>
        </AppLayout>
    );
}
