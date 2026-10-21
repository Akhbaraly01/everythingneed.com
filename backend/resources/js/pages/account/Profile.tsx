import AppLayout from '@/layouts/AppLayout';
import { Head, router, usePage } from '@inertiajs/react';
import {  api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { Camera } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from '@/components/shared/Image';
import ImageUploadField from '@/components/shared/ImageUploadField';

interface ProfilePayload {
    id: string;
    email?: string;
    profile?: {
        full_name?: string | null;
        phone?: string | null;
        avatar_url?: string | null;
    };
}

/** The server validates `avatar_url` as a URL, so relative paths are made absolute. */
function absoluteUrl(value: string): string {
    if (/^https?:\/\//i.test(value)) return value;
    try {
        return new URL(value, window.location.origin).toString();
    } catch {
        return value;
    }
}

export default function AccountProfile() {
    const { auth } = usePage().props as unknown as {
        auth: {
            id?: string;
            name?: string;
            email?: string;
            user?: { id?: string; name?: string; email?: string };
        };
    };

    const userId = auth?.id ?? auth?.user?.id;
    const accountName = auth?.user?.name ?? auth?.name ?? '';
    const accountEmail = auth?.user?.email ?? auth?.email ?? '';

    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [pendingUploads, setPendingUploads] = useState<string[]>([]);
    const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        let cancelled = false;

        api.get<{ data: ProfilePayload }>(`/api/users/${userId}`)
            .then((res) => {
                if (cancelled) return;
                const profile = res.data?.profile ?? {};
                setFullName(profile.full_name ?? '');
                setPhone(profile.phone ?? '');
                setAvatarUrl(profile.avatar_url ?? '');
            })
            .catch((e) => {
                if (!cancelled) setLoadError(errorMessage(e, 'Failed to load your profile'));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [userId]);

    const handleUploads = (urls: string[]) => {
        setPendingUploads(urls);
        if (urls.length > 0) setAvatarUrl(urls[urls.length - 1]);
    };

    const handleSave = async () => {
        if (!userId) return;
        setSaving(true);
        setSaved(false);
        try {
            await api.put('/api/profile', {
                full_name: fullName.trim(),
                phone: phone.trim(),
                ...(avatarUrl ? { avatar_url: absoluteUrl(avatarUrl) } : {}),
            });
            router.reload({ only: ['auth'] });
            setSaved(true);
            toast.success('Profile saved.');
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to save'));
        } finally {
            setSaving(false);
        }
    };

    const displayName = fullName.trim() || accountName;

    return (
        <AppLayout title="My Profile">
            <Head title="My Profile" />

            <div className="max-w-2xl space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="relative h-20 w-20 rounded-full bg-gray-200">
                            {avatarUrl ? (
                                <Image src={avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                            ) : (
                                <div className="flex h-full items-center justify-center text-2xl font-bold text-gray-500">
                                    {(displayName || accountName || 'U').charAt(0).toUpperCase()}
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => setAvatarPickerOpen((open) => !open)}
                                aria-label="Change profile photo"
                                aria-expanded={avatarPickerOpen}
                                className="absolute bottom-0 right-0 rounded-full bg-indigo-600 p-1.5 text-white hover:bg-indigo-500"
                            >
                                <Camera className="h-3 w-3" />
                            </button>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{displayName}</p>
                            <p className="text-sm text-gray-500">{accountEmail}</p>
                        </div>
                    </div>

                    {avatarPickerOpen && (
                        <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-4 dark:border-gray-600">
                            <ImageUploadField
                                value={pendingUploads}
                                onChange={handleUploads}
                                folder="avatars"
                                max={1}
                                label="Profile photo"
                                hint="One image — compressed in the browser, then saved with your profile."
                            />
                        </div>
                    )}

                    {loadError && (
                        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
                            {loadError}
                        </p>
                    )}

                    <div className="mt-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                                disabled={loading}
                                placeholder={accountName}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input type="email" value={accountEmail} readOnly title="Email cannot be changed here"
                                className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none dark:border-gray-600 dark:bg-gray-700" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                                disabled={loading}
                                placeholder="Add a phone number"
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700" />
                        </div>
                    </div>

                    <button onClick={() => void handleSave()} disabled={saving || loading}
                        className="mt-6 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    {saved && <p className="mt-2 text-sm text-green-600">Profile saved.</p>}
                </div>
            </div>
        </AppLayout>
    );
}
