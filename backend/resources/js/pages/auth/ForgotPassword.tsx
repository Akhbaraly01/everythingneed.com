import { Head, Link, useForm } from '@inertiajs/react';
import AuthLayout from '@/layouts/AuthLayout';

export default function ForgotPassword() {
    const { data, setData, post, processing, errors, status } = useForm({
        email: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/forgot-password');
    };

    return (
        <AuthLayout title="Reset your password">
            <Head title="Forgot password" />

            {status && (
                <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    {status}
                </div>
            )}

            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Enter your email and we will send you a link to reset your password.
            </p>

            <form onSubmit={submit} className="space-y-6">
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
                        required
                        autoFocus
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="flex w-full justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                >
                    {processing ? 'Sending...' : 'Send reset link'}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Back to sign in
                </Link>
            </p>
        </AuthLayout>
    );
}
