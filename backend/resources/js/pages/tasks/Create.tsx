import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import {  api, ApiError, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

export default function CreateTask() {
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [requirements, setRequirements] = useState<string[]>(['']);
    const [form, setForm] = useState({
        title: '',
        description: '',
        quantity: '1',
        budget: '',
        deadline: '',
    });

    const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value }));

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        try {
            await api.post('/api/tasks', {
                title: form.title,
                description: form.description,
                quantity: Number(form.quantity) || 1,
                budget: Number(form.budget),
                deadline: form.deadline || null,
                requirements: requirements.filter((r) => r.trim()),
            });

            toast.success('Task published', { description: 'Workers on the platform can now apply.' });
            router.visit('/tasks?mine=1');
        } catch (err) {
            if (err instanceof ApiError) {
                setErrors(err.errors ?? {});
                toast.error(errorMessage(err, 'Action failed'));
            } else {
                toast.error('Something went wrong. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AppLayout title="Post a task">
            <Head title="Post a task — Task Center" />
            <div className="mx-auto max-w-2xl px-4 py-8">
                <Link href="/tasks" className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-600">
                    <ArrowLeft className="h-4 w-4" /> Back to board
                </Link>

                <form onSubmit={submit} className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100"><Plus className="h-5 w-5 text-violet-600" /></span>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Describe your task</h1>
                    </div>

                    <Field label="Task title" error={errors.title?.[0]}>
                        <input
                            required
                            value={form.title}
                            onChange={set('title')}
                            placeholder="e.g. Data entry — 200 product records"
                            className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                    </Field>

                    <Field label="Full description" error={errors.description?.[0]}>
                        <textarea
                            required
                            rows={5}
                            value={form.description}
                            onChange={set('description')}
                            placeholder="What needs to be done, expected output, how you'll verify completion…"
                            className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                    </Field>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <Field label="Quantity / units" error={errors.quantity?.[0]}>
                            <input type="number" min={1} value={form.quantity} onChange={set('quantity')} className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                        </Field>
                        <Field label={`Budget`} error={errors.budget?.[0]}>
                            <input type="number" min={0.01} step="0.01" value={form.budget} onChange={set('budget')} placeholder="50.00" className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                        </Field>
                        <Field label="Deadline" optional error={errors.deadline?.[0]}>
                            <input type="date" value={form.deadline} onChange={set('deadline')} className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                        </Field>
                    </div>

                    <Field label="Requirements" optional hint="One per line — workers must satisfy these to complete the task.">
                        <div className="space-y-2">
                            {requirements.map((req, i) => (
                                <div key={i} className="flex gap-2">
                                    <input
                                        value={req}
                                        onChange={(e) => setRequirements((r) => r.map((x, j) => (j === i ? e.target.value : x)))}
                                        placeholder={`Requirement ${i + 1}`}
                                        className="flex-1 rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                    {requirements.length > 1 && (
                                        <button type="button" onClick={() => setRequirements((r) => r.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => setRequirements((r) => [...r, ''])}
                                className="text-sm font-medium text-violet-600 hover:text-violet-700"
                            >
                                + Add requirement
                            </button>
                        </div>
                    </Field>

                    <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                        💡 Payment is only released after you verify the submitted evidence. The budget is paid per task completion.
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-700">
                        <Link href="/tasks" className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400">Cancel</Link>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center gap-2 rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
                        >
                            <Plus className="h-4 w-4" /> {submitting ? 'Publishing…' : 'Publish task'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

function Field({ label, children, optional, error, hint }: {
    label: string; children: React.ReactNode; optional?: boolean; error?: string; hint?: string;
}) {
    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {label} {optional && <span className="font-normal text-gray-400">(optional)</span>}
            </label>
            {children}
            {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}
