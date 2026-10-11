import AppLayout from '@/layouts/AppLayout';
import {Head} from '@inertiajs/react';
import {  api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';
import { useState } from 'react';

export default function AccountChangePassword() {
    const [current, setCurrent] = useState('');
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (password !== confirmation) {
            toast.warning('Passwords do not match');
            return;
        }
        if (password.length < 8) {
            toast.warning('Password must be at least 8 characters');
            return;
        }
        setSaving(true);
        try {
            await api.post('/api/auth/change-password', { current_password: current, password, password_confirmation: confirmation });
            toast.success('Password changed successfully');
            setCurrent('');
            setPassword('');
            setConfirmation('');
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to change password'));
        }
        setSaving(false);
    };

    return (
        <AppLayout title="Change Password">
            <Head title="Change Password" />

            <div className="max-w-lg space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Change Password</h1>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="space-y-4">
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
                            <input type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700" />
                        </div>
                    </div>

                    <button onClick={handleSave} disabled={saving || !current || !password || !confirmation}
                        className="mt-6 flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
                        <Lock className="h-4 w-4" /> {saving ? 'Saving...' : 'Update Password'}
                    </button>
                </div>
            </div>
        </AppLayout>
    );
}
