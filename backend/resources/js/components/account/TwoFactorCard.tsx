import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { api, errorMessage } from '@/lib/api';

interface EnableResponse {
    message: string;
    data: { secret: string; qr_code_url: string };
}

interface SharedAuth {
    two_factor_enabled?: boolean;
}

export default function TwoFactorCard() {
    const auth = usePage().props.auth as SharedAuth | null;
    const enabled = !!auth?.two_factor_enabled;
    const [busy, setBusy] = useState(false);
    const [setup, setSetup] = useState<{ secret: string; qr_code_url: string } | null>(null);
    const [code, setCode] = useState('');

    const refreshAuth = () => router.reload({ only: ['auth'] });

    const handleEnable = async () => {
        setBusy(true);
        try {
            const res = await api.post<EnableResponse>('/api/auth/2fa/enable');
            setSetup(res.data);
            setCode('');
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to start 2FA setup'));
        } finally {
            setBusy(false);
        }
    };

    const handleVerify = async () => {
        if (!/^\d{6}$/.test(code)) {
            toast.error('Enter the 6-digit code from your authenticator app');
            return;
        }
        setBusy(true);
        try {
            await api.post('/api/auth/2fa/verify', { code });
            toast.success('Two-factor authentication enabled');
            setSetup(null);
            setCode('');
            refreshAuth();
        } catch (e) {
            toast.error(errorMessage(e, 'Verification failed'));
        } finally {
            setBusy(false);
        }
    };

    const handleDisable = async () => {
        setBusy(true);
        try {
            await api.post('/api/auth/2fa/disable');
            toast.success('Two-factor authentication disabled');
            setSetup(null);
            refreshAuth();
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to disable 2FA'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Two-Factor Authentication
                    </p>
                    <p className="text-sm text-gray-500">
                        {enabled
                            ? '2FA is enabled — a 6-digit code is required at login.'
                            : 'Add an extra layer of security using a TOTP authenticator app.'}
                    </p>
                </div>
                {!setup && (
                    enabled ? (
                        <button
                            onClick={handleDisable}
                            disabled={busy}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600"
                        >
                            {busy ? 'Disabling...' : 'Disable'}
                        </button>
                    ) : (
                        <button
                            onClick={handleEnable}
                            disabled={busy}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                        >
                            {busy ? 'Starting...' : 'Enable'}
                        </button>
                    )
                )}
            </div>

            {setup && (
                <div className="mt-4 space-y-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                    <div className="flex flex-col gap-4 sm:flex-row">
                        <img
                            src={setup.qr_code_url}
                            alt="Scan this QR code with your authenticator app"
                            className="h-40 w-40 rounded-lg border border-gray-200 dark:border-gray-700"
                        />
                        <div className="flex-1 space-y-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                Scan or enter this secret
                            </p>
                            <p className="break-all rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                                {setup.secret}
                            </p>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                6-digit verification code
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={6}
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                placeholder="000000"
                                className="block w-36 rounded-lg border border-gray-300 px-3 py-2 font-mono tracking-widest focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleVerify}
                            disabled={busy}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                        >
                            {busy ? 'Verifying...' : 'Verify & Enable'}
                        </button>
                        <button
                            onClick={() => {
                                setSetup(null);
                                setCode('');
                            }}
                            disabled={busy}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
