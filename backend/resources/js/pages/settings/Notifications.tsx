import AppLayout from '@/layouts/AppLayout';
import { Head, usePage } from '@inertiajs/react';
import {  api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

interface NotifPrefs {
    email_orders: boolean;
    email_promotions: boolean;
    email_tickets: boolean;
    push_orders: boolean;
    push_messages: boolean;
}

export default function SettingsNotifications() {
    const [prefs, setPrefs] = useState<NotifPrefs>({
        email_orders: true, email_promotions: false, email_tickets: true, push_orders: true, push_messages: true,
    });
    const [saving, setSaving] = useState(false);

    const { props } = usePage();
    const authUser = (props.auth as { user?: { id: string } } | null)?.user;

    useEffect(() => {
        if (!authUser?.id) return;
        api.get<{ data: Record<string, string> }>(`/api/users/${authUser.id}/settings`)
            .then((res) => {
                const stored = res.data ?? {};
                setPrefs((prev) => {
                    const next = { ...prev };
                    (Object.keys(next) as Array<keyof NotifPrefs>).forEach((k) => {
                        const key = `notifications.${k}`;
                        if (stored[key] === '1') next[k] = true;
                        if (stored[key] === '0') next[k] = false;
                    });
                    return next;
                });
            })
            .catch(() => {});
    }, [authUser?.id]);

    const handleSave = async () => {
        if (!authUser?.id) return;
        setSaving(true);
        try {
            await api.put(`/api/users/${authUser.id}/settings`, {
                settings: (Object.keys(prefs) as Array<keyof NotifPrefs>).map((k) => ({
                    key: `notifications.${k}`,
                    value: prefs[k] ? '1' : '0',
                })),
            });
            toast.success('Preferences saved');
        } catch (e) {
            toast.error(errorMessage(e, 'Failed'));
        }
        setSaving(false);
    };

    const toggle = (key: keyof NotifPrefs) => setPrefs({ ...prefs, [key]: !prefs[key] });

    const rows: Array<{ key: keyof NotifPrefs; label: string }> = [
        { key: 'email_orders', label: 'Email me about order updates' },
        { key: 'email_promotions', label: 'Email me about promotions' },
        { key: 'email_tickets', label: 'Email me about support tickets' },
        { key: 'push_orders', label: 'Push notifications for orders' },
        { key: 'push_messages', label: 'Push notifications for messages' },
    ];

    return (
        <AppLayout title="Notification Preferences">
            <Head title="Notification Preferences" />
            <div className="max-w-lg space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notification Preferences</h1>
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="space-y-4">
                        {rows.map((r) => (
                            <label key={r.key} className="flex items-center justify-between cursor-pointer">
                                <span className="text-sm text-gray-700 dark:text-gray-300">{r.label}</span>
                                <button onClick={() => toggle(r.key)} className={`relative h-6 w-11 rounded-full transition ${prefs[r.key] ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                    <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition ${prefs[r.key] ? 'translate-x-5' : ''}`} />
                                </button>
                            </label>
                        ))}
                    </div>
                    <button onClick={handleSave} disabled={saving}
                        className="mt-6 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
                        {saving ? 'Saving...' : 'Save Preferences'}
                    </button>
                </div>
            </div>
        </AppLayout>
    );
}
