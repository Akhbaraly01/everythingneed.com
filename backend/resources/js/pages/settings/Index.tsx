import AppLayout from '@/layouts/AppLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { api } from '@/lib/api';

interface SettingsProps {
    user: { id: string; name: string; email: string; phone?: string };
    settings: {
        language: string;
        currency: string;
        email_notifications: boolean;
        push_notifications: boolean;
        marketing_emails: boolean;
    };
}

export default function Settings({ user, settings }: SettingsProps) {
    const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'security'>('general');
    const { data, setData, post, processing } = useForm({
        name: user.name,
        email: user.email,
        phone: user.phone ?? '',
        language: settings.language,
        currency: settings.currency,
        email_notifications: settings.email_notifications,
        push_notifications: settings.push_notifications,
        marketing_emails: settings.marketing_emails,
    });

    const handleSaveGeneral = () => {
        post('/settings', { preserveScroll: true });
    };

    const handleSaveNotifications = () => {
        post('/settings', { preserveScroll: true });
    };

    return (
        <AppLayout title="Settings">
            <Head title="Settings" />

            <div className="max-w-4xl">
                <div className="rounded-lg bg-white shadow dark:bg-gray-800">
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="flex gap-6 px-6">
                            {(['general', 'notifications', 'security'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`border-b-2 py-4 text-sm font-medium capitalize ${
                                        activeTab === tab
                                            ? 'border-indigo-500 text-indigo-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Profile</h3>
                                    <p className="mt-1 text-sm text-gray-500">Update your profile information.</p>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                                        <input
                                            type="text"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Language</label>
                                            <select
                                                value={data.language}
                                                onChange={(e) => setData('language', e.target.value)}
                                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="en">English</option>
                                                <option value="es">Spanish</option>
                                                <option value="fr">French</option>
                                            </select>
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Currency</label>
                                            <select
                                                value={data.currency}
                                                onChange={(e) => setData('currency', e.target.value)}
                                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="USD">USD</option>
                                                <option value="EUR">EUR</option>
                                                <option value="GBP">GBP</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSaveGeneral}
                                    disabled={processing}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                                >
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Notification Preferences</h3>
                                    <p className="mt-1 text-sm text-gray-500">Choose what notifications you receive.</p>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        { key: 'email_notifications' as const, name: 'Email notifications', description: 'Receive notifications via email' },
                                        { key: 'push_notifications' as const, name: 'Push notifications', description: 'Receive push notifications in browser' },
                                        { key: 'marketing_emails' as const, name: 'Marketing emails', description: 'Receive deals and promotional offers' },
                                    ].map((item) => (
                                        <div key={item.key} className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                                                <p className="text-sm text-gray-500">{item.description}</p>
                                            </div>
                                            <label className="relative inline-flex cursor-pointer items-center">
                                                <input
                                                    type="checkbox"
                                                    className="peer sr-only"
                                                    checked={data[item.key]}
                                                    onChange={(e) => setData(item.key, e.target.checked)}
                                                />
                                                <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white" />
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={handleSaveNotifications}
                                    disabled={processing}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                                >
                                    {processing ? 'Saving...' : 'Save Preferences'}
                                </button>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Security Settings</h3>
                                    <p className="mt-1 text-sm text-gray-500">Manage your account security.</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">Change Password</p>
                                                <p className="text-sm text-gray-500">Update your password regularly.</p>
                                            </div>
                                            <a
                                                href="/forgot-password"
                                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600"
                                            >
                                                Change
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
