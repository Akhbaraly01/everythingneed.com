import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthLayout from '@/layouts/AuthLayout';
import { ShieldCheck } from 'lucide-react';

/**
 * Plan Q: authenticator-app challenge for the web guard.
 * Reached only with a pending 2FA session (server redirects here).
 */
export default function TwoFactorChallenge() {
    const { data, setData, post, processing, errors } = useForm({ code: '' });
    const [localError, setLocalError] = useState('');

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (data.code.trim().length < 6) {
            setLocalError('Enter the 6-digit code from your authenticator app.');
            return;
        }
        setLocalError('');
        post('/2fa/challenge');
    };

    return (
        <AuthLayout title="Two-factor authentication" description="Enter the code from your authenticator app">
            <Head title="Verify it's you" />
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="totp-code" className="text-sm font-medium">Authentication code</label>
                    <input
                        id="totp-code"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="000000"
                        value={data.code}
                        onChange={(e) => setData('code', e.target.value.replace(/\D/g, '').slice(0, 8))}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {(errors.code || localError) && (
                        <p className="text-sm text-destructive">{errors.code ?? localError}</p>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={processing}
                    className="flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                    Verify & Sign In
                </button>
            </form>
        </AuthLayout>
    );
}
