import AppLayout from '@/layouts/AppLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Settings() {
    const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'security'>('general');

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
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Appearance</h3>
                                    <p className="mt-1 text-sm text-gray-500">Customize how EverythingNeed looks on your device.</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">Language</p>
                                            <p className="text-sm text-gray-500">Select your preferred language.</p>
                                        </div>
                                        <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700">
                                            <option>English</option>
                                            <option>Spanish</option>
                                            <option>French</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">Currency</p>
                                            <p className="text-sm text-gray-500">Select your preferred currency.</p>
                                        </div>
                                        <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700">
                                            <option>USD</option>
                                            <option>EUR</option>
                                            <option>GBP</option>
                                        </select>
                                    </div>
                                </div>
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
                                        { name: 'Order updates', description: 'Get notified about order status changes' },
                                        { name: 'Promotions', description: 'Receive deals and promotional offers' },
                                        { name: 'Security alerts', description: 'Get notified about suspicious activity' },
                                    ].map((item) => (
                                        <div key={item.name} className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                                                <p className="text-sm text-gray-500">{item.description}</p>
                                            </div>
                                            <label className="relative inline-flex cursor-pointer items-center">
                                                <input type="checkbox" className="peer sr-only" defaultChecked />
                                                <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white" />
                                            </label>
                                        </div>
                                    ))}
                                </div>
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
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                                                <p className="text-sm text-gray-500">Add an extra layer of security to your account.</p>
                                            </div>
                                            <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600">
                                                Enable
                                            </button>
                                        </div>
                                    </div>
                                    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">Change Password</p>
                                                <p className="text-sm text-gray-500">Update your password regularly.</p>
                                            </div>
                                            <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600">
                                                Change
                                            </button>
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
