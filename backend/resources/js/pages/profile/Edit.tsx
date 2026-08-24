import AppLayout from '@/layouts/AppLayout';
import { Head, useForm } from '@inertiajs/react';
import { useApp } from '@/hooks/use-app';
import { useState } from 'react';

export default function ProfileEdit() {
    const { user } = useApp();
    const { data, setData, put, processing, errors } = useForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
        phone: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/profile');
    };

    return (
        <AppLayout title="Profile">
            <Head title="Profile" />

            <div className="max-w-2xl">
                <div className="rounded-lg bg-white shadow dark:bg-gray-800">
                    <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Profile</h3>
                    </div>
                    <form onSubmit={submit} className="space-y-6 p-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Full name
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Email address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Phone number
                            </label>
                            <input
                                id="phone"
                                type="tel"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                            >
                                {processing ? 'Saving...' : 'Save changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
