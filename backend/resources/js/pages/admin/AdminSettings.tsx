import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { Settings } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SystemSettings {
    site_name: string;
    site_url: string;
    maintenance_mode: boolean;
    registration_open: boolean;
    email_verification_required: boolean;
    max_upload_size_mb: number;
    currency: string;
    timezone: string;
}

export default function AdminSettings() {
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<SystemSettings>('/api/admin/settings')
            .then((res) => setSettings(res.data))
            .catch(() => setSettings(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <AppLayout title="Admin Settings"><p className="p-12 text-center text-gray-500">Loading...</p></AppLayout>;
    if (!settings) return <AppLayout title="Admin Settings"><p className="p-12 text-center text-red-500">Failed to load</p></AppLayout>;

    const Toggle = ({ label, value }: { label: string; value: boolean }) => (
        <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {value ? 'ON' : 'OFF'}
            </span>
        </div>
    );

    return (
        <AppLayout title="Admin Settings">
            <Head title="Admin Settings" />
            <div className="max-w-2xl space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Settings className="h-6 w-6" /> Admin Settings</h1>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h2 className="font-semibold text-gray-900 dark:text-white">General</h2>
                    <div className="divide-y dark:divide-gray-700">
                        <div className="flex items-center justify-between py-3">
                            <span className="text-sm text-gray-600">Site Name</span>
                            <span className="font-medium text-gray-900 dark:text-white">{settings.site_name}</span>
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <span className="text-sm text-gray-600">Currency</span>
                            <span className="font-medium text-gray-900 dark:text-white">{settings.currency}</span>
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <span className="text-sm text-gray-600">Timezone</span>
                            <span className="font-medium text-gray-900 dark:text-white">{settings.timezone}</span>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h2 className="font-semibold text-gray-900 dark:text-white">Feature Toggles</h2>
                    <div className="divide-y dark:divide-gray-700">
                        <Toggle label="Maintenance Mode" value={settings.maintenance_mode} />
                        <Toggle label="Registration Open" value={settings.registration_open} />
                        <Toggle label="Email Verification Required" value={settings.email_verification_required} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
