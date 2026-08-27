import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { Shield } from 'lucide-react';
import { useState } from 'react';

export default function SettingsSecurity() {
    const [current, setCurrent] = useState('');
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [saving, setSaving] = useState(false);

    const handleChangePassword = async () => {
        if (password !== confirmation) { alert('Passwords do not match'); return; }
        if (password.length < 8) { alert('Password must be at least 8 characters'); return; }
        setSaving(true);
        try {
            await api.put('/api/user/password', { current_password: current, password, password_confirmation: confirmation });
            alert('Password changed');
            setCurrent(''); setPassword(''); setConfirmation('');
        } catch (e: any) {
            alert(e.message ?? 'Failed');
        }
        setSaving(false);
    };

    return (
        <AppLayout title="Security Settings">
            <Head title="Security Settings" />
            <div className="max-w-lg space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Security Settings</h1>
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Shield className="h-5 w-5" /> Change Password</h2>
                    <div className="mt-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
                            <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm</label>
                            <input type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700" />
                        </div>
                    </div>
                    <button onClick={handleChangePassword} disabled={saving || !current || !password}
                        className="mt-6 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
                        {saving ? 'Saving...' : 'Update Password'}
                    </button>
                </div>
            </div>
        </AppLayout>
    );
}
