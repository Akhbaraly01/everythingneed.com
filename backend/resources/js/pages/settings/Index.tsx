import AppLayout from '@/layouts/AppLayout';
import {Head, useForm} from '@inertiajs/react';
import { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/use-language';
import { useTheme } from '@/components/ThemeProvider';
import { persistCurrency, isDisplayCurrency } from '@/lib/currency';
import TwoFactorCard from '@/components/account/TwoFactorCard';

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
    const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'security' | 'appearance'>('general');
    const [processing, setProcessing] = useState(false);
    const [saved, setSaved] = useState(false);
    const { setLanguage, availableLocales, t } = useLanguage();
    const { theme, setTheme } = useTheme();
    const { data, setData } = useForm({
        name: user.name,
        email: user.email,
        phone: user.phone ?? '',
        language: settings.language,
        currency: settings.currency,
        email_notifications: settings.email_notifications,
        push_notifications: settings.push_notifications,
        marketing_emails: settings.marketing_emails,
    });

    const saveSettings = async (entries: Array<{ key: string; value: string }>) => {
        await api.put(`/api/users/${user.id}/settings`, { settings: entries });
    };

    const tabLabel = (tab: 'general' | 'notifications' | 'security' | 'appearance'): string =>
        t(`settings.tab${tab.charAt(0).toUpperCase()}${tab.slice(1)}`, { defaultValue: tab });

    const handleSaveGeneral = async () => {
        setProcessing(true);
        setSaved(false);
        try {
            await api.put('/api/profile', { full_name: data.name, phone: data.phone });
            await saveSettings([
                { key: 'general.language', value: data.language },
                { key: 'general.currency', value: data.currency },
            ]);
            // Apply immediately: provider + guest fallback stay in sync
            // with what was just persisted server-side.
            setLanguage(data.language);
            if (isDisplayCurrency(data.currency)) {
                persistCurrency(data.currency);
            }
            setSaved(true);
        } catch {
            toast.error(t('settings.saveFailed', { defaultValue: 'Failed to save settings' }));
        } finally {
            setProcessing(false);
        }
    };

    const handleSaveNotifications = async () => {
        setProcessing(true);
        setSaved(false);
        try {
            await saveSettings([
                { key: 'notifications.email_notifications', value: data.email_notifications ? '1' : '0' },
                { key: 'notifications.push_notifications', value: data.push_notifications ? '1' : '0' },
                { key: 'notifications.marketing_emails', value: data.marketing_emails ? '1' : '0' },
            ]);
            setSaved(true);
        } catch {
            toast.error(t('settings.prefsFailed', { defaultValue: 'Failed to save preferences' }));
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AppLayout title={t('nav.settings', { defaultValue: 'Settings' })}>
            <Head title={t('nav.settings', { defaultValue: 'Settings' })} />

            <div className="max-w-4xl">
                <div className="rounded-lg bg-white shadow dark:bg-gray-800">
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="flex gap-6 px-6">
                            {(['general', 'notifications', 'security', 'appearance'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`border-b-2 py-4 text-sm font-medium ${
                                        activeTab === tab
                                            ? 'border-indigo-500 text-indigo-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {tabLabel(tab)}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('settings.profile', { defaultValue: 'Profile' })}</h3>
                                    <p className="mt-1 text-sm text-gray-500">{t('settings.profileText', { defaultValue: 'Update your profile information.' })}</p>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('settings.name', { defaultValue: 'Name' })}</label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('settings.email', { defaultValue: 'Email' })}</label>
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('settings.phone', { defaultValue: 'Phone' })}</label>
                                        <input
                                            type="text"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('settings.language', { defaultValue: 'Language' })}</label>
                                            <select
                                                value={data.language}
                                                onChange={(e) => setData('language', e.target.value)}
                                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="en">English</option>
                                                {availableLocales.filter((meta) => meta.code !== 'en').map((meta) => (
                                                    <option key={meta.code} value={meta.code}>{meta.native}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('settings.currency', { defaultValue: 'Currency' })}</label>
                                            <select
                                                value={data.currency}
                                                onChange={(e) => setData('currency', e.target.value)}
                                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="USD">USD — US Dollar</option>
                                                <option value="EUR">EUR — Euro</option>
                                                <option value="GBP">GBP — British Pound</option>
                                                <option value="GHS">GHS — Ghanaian Cedi</option>
                                                <option value="KES">KES — Kenyan Shilling</option>
                                                <option value="NGN">NGN — Nigerian Naira</option>
                                                <option value="ZAR">ZAR — South African Rand</option>
                                                <option value="INR">INR — Indian Rupee</option>
                                                <option value="AED">AED — UAE Dirham</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSaveGeneral}
                                    disabled={processing}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                                >
                                    {processing ? t('settings.saving', { defaultValue: 'Saving...' }) : t('settings.saveChanges', { defaultValue: 'Save Changes' })}{saved && activeTab === 'general' ? ' ?' : ''}
                                </button>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('settings.notificationPreferences', { defaultValue: 'Notification Preferences' })}</h3>
                                    <p className="mt-1 text-sm text-gray-500">{t('settings.notificationText', { defaultValue: 'Choose what notifications you receive.' })}</p>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        { key: 'email_notifications' as const, name: t('settings.emailNotifications', { defaultValue: 'Email notifications' }), description: t('settings.emailNotificationsText', { defaultValue: 'Receive notifications via email' }) },
                                        { key: 'push_notifications' as const, name: t('settings.pushNotifications', { defaultValue: 'Push notifications' }), description: t('settings.pushNotificationsText', { defaultValue: 'Receive push notifications in browser' }) },
                                        { key: 'marketing_emails' as const, name: t('settings.marketingEmails', { defaultValue: 'Marketing emails' }), description: t('settings.marketingEmailsText', { defaultValue: 'Receive deals and promotional offers' }) },
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
                                    {processing ? t('settings.saving', { defaultValue: 'Saving...' }) : t('settings.savePreferences', { defaultValue: 'Save Preferences' })}{saved && activeTab === 'notifications' ? ' ?' : ''}
                                </button>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('settings.securitySettings', { defaultValue: 'Security Settings' })}</h3>
                                    <p className="mt-1 text-sm text-gray-500">{t('settings.securitySettingsText', { defaultValue: 'Manage your account security.' })}</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{t('settings.changePassword', { defaultValue: 'Change Password' })}</p>
                                                <p className="text-sm text-gray-500">{t('settings.changePasswordText', { defaultValue: 'Update your password regularly.' })}</p>
                                            </div>
                                            <a
                                                href="/forgot-password"
                                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600"
                                            >
                                                {t('settings.change', { defaultValue: 'Change' })}
                                            </a>
                                        </div>
                                    </div>
                                    <TwoFactorCard />
                                </div>
                            </div>
                        )}

                        {activeTab === 'appearance' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('settings.appearance', { defaultValue: 'Appearance' })}</h3>
                                    <p className="mt-1 text-sm text-gray-500">{t('settings.appearanceText', { defaultValue: 'Choose how EverythingNeed looks on this device.' })}</p>
                                </div>
                                <div className="space-y-2">
                                    {([
                                        { value: 'light', name: t('settings.light', { defaultValue: 'Light' }), description: t('settings.lightText', { defaultValue: 'Bright theme' }) },
                                        { value: 'dark', name: t('settings.dark', { defaultValue: 'Dark' }), description: t('settings.darkText', { defaultValue: 'Dimmed Binance-style theme' }) },
                                        { value: 'system', name: t('settings.system', { defaultValue: 'System' }), description: t('settings.systemText', { defaultValue: 'Follow your device setting' }) },
                                    ] as const).map((option) => (
                                        <label
                                            key={option.value}
                                            className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{option.name}</p>
                                                <p className="text-sm text-gray-500">{option.description}</p>
                                            </div>
                                            <input
                                                type="radio"
                                                name="theme"
                                                checked={theme === option.value}
                                                onChange={() => setTheme(option.value)}
                                                className="h-4 w-4 text-indigo-600"
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
