import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { MailCheck } from 'lucide-react';

export default function VerifyEmail() {
    const { post, processing } = useForm({});
    const [resent, setResent] = useState(false);

    const resend = () => {
        post('/email/verification-notification', {
            onSuccess: () => setResent(true),
        });
    };

    return (
        <AppLayout title="Verify email">
            <Head title="Verify your email" />
            <div className="mx-auto max-w-md px-4 py-16 text-center">
                <MailCheck className="mx-auto mb-4 h-14 w-14 text-indigo-500" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Verify your email</h1>
                <p className="mt-2 text-sm text-gray-500">
                    We sent a verification link to your email address.
                    Open it to activate full account features. Links expire after 60 minutes.
                </p>

                {resent && (
                    <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-300">
                        A fresh verification link has been sent.
                    </p>
                )}

                <button
                    onClick={resend}
                    disabled={processing}
                    className="mt-6 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                    {processing ? 'Sending…' : 'Resend verification email'}
                </button>

                <p className="mt-6 text-xs text-gray-400">
                    Development note: with MAIL_MAILER=log the message is written to
                    backend/storage/logs/laravel.log — copy the link from there.
                </p>
            </div>
        </AppLayout>
    );
}
