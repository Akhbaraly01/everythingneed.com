import AppLayout from '@/layouts/AppLayout';
import { Head, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';

/**
 * Privacy controls backed by the per-user settings store
 * (privacy.* keys) - data visibility, marketing contact, analytics.
 */
const OPTIONS = [
    { key: 'privacy.profile_visibility', name: 'Public profile', description: 'Let other users see your public profile and reviews.' },
    { key: 'privacy.show_online_status', name: 'Online status', description: 'Show when you are active to conversation partners.' },
    { key: 'privacy.marketing_contact', name: 'Marketing contact', description: 'Allow deals and promotional messages.' },
    { key: 'privacy.usage_analytics', name: 'Usage analytics', description: 'Help improve the app with anonymous usage data.' },
] as const;

export default function Privacy() {
    const { auth } = usePage().props as { auth?: { user?: { id: string } } | null };
    const userId = auth?.user?.id ?? '';
    const [values, setValues] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) {
            setLoadError('You need to be signed in to manage privacy preferences.');
            setLoading(false);
            return;
        }

        // Per-user settings only: /api/settings is admin-only (403 otherwise).
        api.get<{ data: Record<string, string> }>(`/api/users/${userId}/settings`)
            .then((res) => {
                const next: Record<string, boolean> = {};
                for (const opt of OPTIONS) {
                    next[opt.key] = (res.data?.[opt.key] ?? '1') === '1';
                }
                setValues(next);
                setLoadError(null);
            })
            .catch((e) => setLoadError(errorMessage(e, 'Could not load your privacy preferences')))
            .finally(() => setLoading(false));
    }, [userId]);

    const save = async () => {
        if (!userId) return;
        setSaving(true);
        try {
            await api.put(`/api/users/${userId}/settings`, {
                settings: OPTIONS.map((o) => ({ key: o.key, value: values[o.key] ? '1' : '0' })),
            });
            toast.success('Privacy preferences saved.');
        } catch (e) {
            toast.error(errorMessage(e, 'Could not save preferences'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <AppLayout title="Privacy">
            <Head title="Privacy" />
            <div className="mx-auto max-w-2xl space-y-6 px-3 py-6">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                        <ShieldCheck className="h-6 w-6" /> Privacy
                    </h1>
                    <p className="text-sm text-gray-500">Control what others see and how we may contact you.</p>
                </div>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : (
                    <div className="space-y-2 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                        {loadError && (
                            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300" role="alert">
                                {loadError}
                            </p>
                        )}
                        {OPTIONS.map((opt) => (
                            <div key={opt.key} className="flex items-center justify-between gap-4 py-2">
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{opt.name}</p>
                                    <p className="text-sm text-gray-500">{opt.description}</p>
                                </div>
                                <label className="relative inline-flex cursor-pointer items-center">
                                    <input
                                        type="checkbox"
                                        className="peer sr-only"
                                        checked={values[opt.key] ?? false}
                                        onChange={(e) => setValues((v) => ({ ...v, [opt.key]: e.target.checked }))}
                                    />
                                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white" />
                                </label>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => void save()}
                            disabled={saving}
                            className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save preferences'}
                        </button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
