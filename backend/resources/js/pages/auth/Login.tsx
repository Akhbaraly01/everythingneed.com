import { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthLayout from '@/layouts/AuthLayout';
import TurnstileWidget from '@/components/auth/TurnstileWidget';
import { api } from '@/lib/api';
import { Button } from '@/components/shared/Button';
import { Mail, Lock, User, Shield, ArrowLeft } from 'lucide-react';

type Tab = 'login' | 'signup' | 'otp';

export default function Login() {
    const { uiTexts } = usePage().props as {
        uiTexts?: { ui?: Record<string, { label?: string; value?: string }> };
    };
    const loginTitle = uiTexts?.ui?.login_title?.value || 'everythingneed.com';
    const loginSubtitle =
        uiTexts?.ui?.login_subtitle?.value || 'Your one-stop platform for all human needs';

    const [activeTab, setActiveTab] = useState<Tab>('login');
    const [otpChannel, setOtpChannel] = useState<'phone' | 'email'>('phone');
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
    const [otpTarget, setOtpTarget] = useState('');
    const [otpInput, setOtpInput] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpError, setOtpError] = useState('');

    const loginForm = useForm({ email: '', password: '', remember: false, 'cf-turnstile-response': '' });
    const signupForm = useForm({ name: '', email: '', password: '', password_confirmation: '', 'cf-turnstile-response': '' });

    const requestOtp = async (target: string) => {
        const trimmed = target.trim();
        if (otpChannel === 'email' ? !trimmed.includes('@') : trimmed.length < 7) {
            setOtpError(otpChannel === 'email' ? 'Enter a valid email first' : 'Enter a valid phone number first');
            return;
        }
        setOtpLoading(true);
        setOtpError('');
        try {
            // No mail or SMS is sent — the code is issued locally (see OtpSender).
            const path =
                otpChannel === 'email' ? '/api/auth/otp/email/request' : '/api/auth/otp/request';
            const body = otpChannel === 'email' ? { email: trimmed } : { phone: trimmed };
            await api.post(path, body);
            setOtpTarget(trimmed);
            setOtpSent(true);
        } catch {
            setOtpError('Could not send OTP. Try again.');
        } finally {
            setOtpLoading(false);
        }
    };

    const verifyOtp = async () => {
        const code = otp.join('');
        if (code.length !== 6) {
            setOtpError('Enter all 6 digits');
            return;
        }
        setOtpLoading(true);
        setOtpError('');
        try {
            const path =
                otpChannel === 'email' ? '/api/auth/otp/email/verify' : '/api/auth/otp/verify';
            const body =
                otpChannel === 'email' ? { email: otpTarget, code } : { phone: otpTarget, code };
            await api.post(path, body);
            // Role-aware landing handled by the server's `/` route.
            window.location.href = '/';
        } catch {
            setOtpError('Invalid or expired code');
        } finally {
            setOtpLoading(false);
        }
    };

    const setDigit = (index: number, value: string) => {
        const digit = value.replace(/\D/g, '').slice(-1);
        setOtp((prev) => {
            const next = [...prev];
            next[index] = digit;
            return next;
        });
        if (digit && index < 5) {
            document.getElementById(`otp-${index + 1}`)?.focus();
        }
    };

    return (
        <AuthLayout title={loginTitle} description={loginSubtitle}>
            <Head title="Log in" />
            <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
            </Link>

            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
            </div>

            <div className="mb-6 grid w-full grid-cols-3 rounded-lg bg-muted p-1">
                {(['login', 'signup', 'otp'] as Tab[]).map((t) => (
                    <Button
                        key={t}
                        type="button"
                        onClick={() => setActiveTab(t)}
                        variant={activeTab === t ? 'primary' : 'ghost'}
                        size="sm"
                        className="rounded-md px-3 py-2"
                    >
                        {t === 'login' ? 'Sign In' : t === 'signup' ? 'Sign Up' : 'OTP'}
                    </Button>
                ))}
            </div>

            {activeTab === 'login' && (
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        loginForm.post('/login');
                    }}
                    className="space-y-4"
                >
                    <div className="space-y-2">
                        <label htmlFor="login-email" className="text-sm font-medium">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                id="login-email"
                                type="email"
                                placeholder="Enter your email"
                                value={loginForm.data.email}
                                onChange={(e) => loginForm.setData('email', e.target.value)}
                                className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        {loginForm.errors.email && <p className="text-sm text-destructive">{loginForm.errors.email}</p>}
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="login-password" className="text-sm font-medium">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                id="login-password"
                                type="password"
                                placeholder="Enter your password"
                                value={loginForm.data.password}
                                onChange={(e) => loginForm.setData('password', e.target.value)}
                                className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        {loginForm.errors.password && <p className="text-sm text-destructive">{loginForm.errors.password}</p>}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={loginForm.data.remember}
                                onChange={(e) => loginForm.setData('remember', e.target.checked)}
                                className="rounded border-input"
                            />
                            Remember me
                        </label>
                        <Link href="/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
                    </div>
                    <TurnstileWidget onToken={(token) => loginForm.setData('cf-turnstile-response', token ?? '')} />
                    <Button
                        type="submit"
                        loading={loginForm.processing}
                        fullWidth
                    >
                        Sign In
                    </Button>
                </form>
            )}

            {activeTab === 'signup' && (
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        signupForm.post('/register');
                    }}
                    className="space-y-4"
                >
                    <div className="space-y-2">
                        <label htmlFor="signup-name" className="text-sm font-medium">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                id="signup-name"
                                type="text"
                                placeholder="Enter your full name"
                                value={signupForm.data.name}
                                onChange={(e) => signupForm.setData('name', e.target.value)}
                                className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="signup-email" className="text-sm font-medium">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                id="signup-email"
                                type="email"
                                placeholder="Enter your email"
                                value={signupForm.data.email}
                                onChange={(e) => signupForm.setData('email', e.target.value)}
                                className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="signup-password" className="text-sm font-medium">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                id="signup-password"
                                type="password"
                                placeholder="Create a password"
                                value={signupForm.data.password}
                                onChange={(e) => signupForm.setData('password', e.target.value)}
                                className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>
                    <TurnstileWidget onToken={(token) => signupForm.setData('cf-turnstile-response', token ?? '')} />
                    <Button
                        type="submit"
                        loading={signupForm.processing}
                        fullWidth
                    >
                        Sign Up
                    </Button>
                </form>
            )}

            {activeTab === 'otp' && (
                <div className="space-y-4">
                    {!otpSent ? (
                        <>
                            <div className="grid w-full grid-cols-2 rounded-lg bg-muted p-1">
                                {(['phone', 'email'] as const).map((c) => (
                                    <Button
                                        key={c}
                                        type="button"
                                        onClick={() => {
                                            setOtpChannel(c);
                                            setOtpError('');
                                        }}
                                        variant={otpChannel === c ? 'primary' : 'ghost'}
                                        size="sm"
                                        className="rounded-md px-3 py-1.5 text-xs"
                                    >
                                        {c === 'phone' ? 'Phone' : 'Email'}
                                    </Button>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                No SMS or mail is sent — your code is issued instantly for testing.
                            </p>
                            <div className="space-y-2">
                                <label htmlFor="otp-target" className="text-sm font-medium">
                                    {otpChannel === 'email' ? 'Email' : 'Phone'}
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input
                                        id="otp-target"
                                        type={otpChannel === 'email' ? 'email' : 'tel'}
                                        placeholder={otpChannel === 'email' ? 'Enter your email' : 'Enter your phone (e.g. +15551234567)'}
                                        value={otpInput}
                                        onChange={(e) => setOtpInput(e.target.value)}
                                        className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                            </div>
                            <Button
                                type="button"
                                loading={otpLoading}
                                onClick={() => void requestOtp(otpInput)}
                                fullWidth
                            >
                                Send OTP
                            </Button>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-muted-foreground">Verify Your Login — OTP sent to {otpTarget}</p>
                            <div className="flex justify-center gap-2">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        id={`otp-${index}`}
                                        value={digit}
                                        onChange={(e) => setDigit(index, e.target.value)}
                                        maxLength={1}
                                        inputMode="numeric"
                                        className="h-12 w-11 text-center text-lg font-semibold rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                ))}
                            </div>
                            <Button
                                type="button"
                                disabled={otpLoading}
                                onClick={() => void verifyOtp()}
                                fullWidth
                                iconLeft={<Shield className="h-4 w-4" />}
                            >
                                Verify OTP
                            </Button>
                            <Button
                                type="button"
                                onClick={() => setOtpSent(false)}
                                variant="ghost"
                                size="sm"
                                fullWidth
                                className="text-center text-xs"
                            >
                                Resend code (60s)
                            </Button>
                        </>
                    )}
                    {otpError && <p className="text-sm text-destructive">{otpError}</p>}
                </div>
            )}
        </AuthLayout>
    );
}
