import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { type WorkerProfile } from '@/types';
import { api, ApiError } from '@/lib/api';
import { formatCurrency, getInitials } from '@/lib/utils';
import { toast } from 'sonner';
import { ArrowLeft, Send } from 'lucide-react';

interface Props {
    worker: WorkerProfile;
}

export default function CreateWorkRequest({ worker }: Props) {
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [form, setForm] = useState({
        title: '',
        description: '',
        location: '',
        start_date: '',
        estimated_duration: '',
        budget_min: worker.hourly_rate ? String(worker.hourly_rate) : '',
        budget_max: '',
    });

    const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value }));

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        try {
            await api.post('/api/work-requests', {
                worker_profile_id: worker.id,
                title: form.title,
                description: form.description || null,
                category: worker.category,
                location: form.location || null,
                start_date: form.start_date || null,
                estimated_duration: form.estimated_duration || null,
                budget_min: form.budget_min ? Number(form.budget_min) : null,
                budget_max: form.budget_max ? Number(form.budget_max) : null,
            });

            toast.success('Request sent', {
                description: `${worker.user?.name} will receive your request and can respond with an offer.`,
            });
            router.visit('/job-seekers/my-requests');
        } catch (err) {
            if (err instanceof ApiError) {
                setErrors(err.errors ?? {});
                toast.error(err.message);
            } else {
                toast.error('Something went wrong. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AppLayout title="Request worker">
            <Head title={`Request ${worker.user?.name}`} />
            <div className="mx-auto max-w-2xl px-4 py-8">
                <Link href={`/job-seekers/${worker.id}`} className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600">
                    <ArrowLeft className="h-4 w-4" /> Back to profile
                </Link>

                {/* Recipient card */}
                <div className="mb-6 flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                        {getInitials(worker.user?.name ?? 'W')}
                    </span>
                    <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{worker.user?.name}</p>
                        <p className="text-xs text-gray-500">{worker.headline} · {formatCurrency(worker.hourly_rate ?? 0)}/hr</p>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">Describe the work you need</h1>

                    <Field label="What do you need done?" error={errors.title?.[0]}>
                        <input
                            required
                            value={form.title}
                            onChange={set('title')}
                            placeholder="e.g. Rewire kitchen lighting"
                            className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                    </Field>

                    <Field label="Details & requirements" optional error={errors.description?.[0]}>
                        <textarea
                            rows={4}
                            value={form.description}
                            onChange={set('description')}
                            placeholder="Materials, access instructions, expectations…"
                            className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                    </Field>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Location" optional error={errors.location?.[0]}>
                            <input value={form.location} onChange={set('location')} className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                        </Field>
                        <Field label="Preferred start date" optional error={errors.start_date?.[0]}>
                            <input type="date" value={form.start_date} onChange={set('start_date')} className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                        </Field>
                        <Field label="Estimated duration" optional>
                            <input value={form.estimated_duration} onChange={set('estimated_duration')} placeholder="e.g. 3 days, 2 weeks" className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                        </Field>
                        <Field label="Workers needed" optional>
                            <input type="number" min={1} defaultValue={1} disabled className="w-full cursor-not-allowed rounded-lg border-gray-300 bg-gray-50 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Budget — minimum" error={errors.budget_min?.[0]}>
                            <input type="number" min={0} step="0.01" value={form.budget_min} onChange={set('budget_min')} className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                        </Field>
                        <Field label="Budget — maximum" optional error={errors.budget_max?.[0]}>
                            <input type="number" min={0} step="0.01" value={form.budget_max} onChange={set('budget_max')} className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                        </Field>
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                            <Send className="h-4 w-4" /> {submitting ? 'Sending…' : 'Send request'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

function Field({ label, children, optional, error }: { label: string; children: React.ReactNode; optional?: boolean; error?: string }) {
    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {label} {optional && <span className="font-normal text-gray-400">(optional)</span>}
            </label>
            {children}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}
