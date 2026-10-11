import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthLayout from '@/layouts/AuthLayout';
import { api, errorMessage } from '@/lib/api';
import { Ban, Send } from 'lucide-react';

/**
 * Plan Q: suspended accounts land here (instead of a bare error string)
 * with a real appeal path: throttled guest endpoint filing a support
 * ticket for the suspended account.
 */
export default function Suspended() {
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const [email, setEmail] = useState(params.get('email') ?? '');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.includes('@') || message.trim().length < 10) {
            setError('Enter your account email and explain your appeal (10+ characters).');
            return;
        }
        setSending(true);
        setError('');
        try {
            const res = await api.post<{ message?: string }>('/api/appeals', { email, message: message.trim() });
            setDone(true);
            setMessage(res.message ?? 'Appeal received.');
        } catch (err) {
            setError(errorMessage(err, 'Could not submit appeal. Try again later.'));
        } finally {
            setSending(false);
        }
    };

    return (
        <AuthLayout title="Account suspended" description="Your account is currently suspended">
            <Head title="Account suspended" />
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <Ban className="h-6 w-6 text-destructive" />
            </div>
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    This account has been suspended and cannot sign in. If you believe this is a
                    mistake, send an appeal below - our support team reviews every appeal.
                </p>

                {done ? (
                    <p className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
                        {message || 'Appeal received.'}
                    </p>
                ) : (
                    <form onSubmit={(e) => void submit(e)} className="space-y-3">
                        <div className="space-y-2">
                            <label htmlFor="appeal-email" className="text-sm font-medium">Account email</label>
                            <input
                                id="appeal-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="appeal-message" className="text-sm font-medium">Your appeal</label>
                            <textarea
                                id="appeal-message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={4}
                                maxLength={2000}
                                placeholder="Explain why your account should be restored..."
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <button
                            type="submit"
                            disabled={sending}
                            className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                        >
                            <Send className="h-4 w-4" /> {sending ? 'Sending...' : 'Submit appeal'}
                        </button>
                    </form>
                )}

                <Link href="/login" className="block text-center text-sm text-primary hover:underline">
                    Back to sign in
                </Link>
            </div>
        </AuthLayout>
    );
}
