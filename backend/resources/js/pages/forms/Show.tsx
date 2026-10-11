import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { api, ApiError, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { Send, CheckCircle2, ArrowLeft } from 'lucide-react';

type FieldType =
    | 'text' | 'textarea' | 'number' | 'email' | 'phone' | 'date'
    | 'select' | 'multiselect' | 'checkbox' | 'radio'
    | 'file' | 'image' | 'address' | 'country' | 'currency';

interface FieldDef {
    key: string;
    label: string;
    type: FieldType;
    required?: boolean;
    options?: string[];
    max?: number;
}

interface FormProps {
    form: {
        name: string;
        slug: string;
        fields: FieldDef[];
    };
}

type Answers = Record<string, string | boolean | string[]>;

const inputClass =
    'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white';

export default function DynamicFormShow({ form }: FormProps) {
    const [answers, setAnswers] = useState<Answers>(() => {
        const initial: Answers = {};
        form.fields.forEach((f) => {
            if (f.type === 'checkbox') initial[f.key] = false;
            else if (f.type === 'multiselect') initial[f.key] = [];
            else initial[f.key] = '';
        });
        return initial;
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    const setValue = (key: string, value: string | boolean | string[]) => {
        setAnswers((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const clientValidate = (): boolean => {
        const next: Record<string, string> = {};
        form.fields.forEach((f) => {
            const value = answers[f.key];
            if (!f.required) return;
            const empty =
                value === undefined ||
                value === null ||
                value === '' ||
                value === false ||
                (Array.isArray(value) && value.length === 0);
            if (empty) next[f.key] = `${f.label} is required.`;
        });
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const submit = async () => {
        setSubmitting(true);
        try {
            await api.post(`/api/forms/${form.slug}/submit`, answers);
            setDone(true);
            toast.success('Submitted. Thank you!');
        } catch (e) {
            if (e instanceof ApiError && e.errors) {
                const mapped: Record<string, string> = {};
                Object.entries(e.errors).forEach(([key, list]) => {
                    mapped[key] = list[0] ?? 'Invalid value.';
                });
                setErrors(mapped);
            }
            toast.error(errorMessage(e, 'Could not submit the form'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientValidate()) return;
        void submit();
    };

    const renderField = (field: FieldDef) => {
        const value = answers[field.key];
        const error = errors[field.key];
        const label = (
            <span className="text-sm text-gray-700 dark:text-gray-200">
                {field.label}
                {field.required ? ' *' : ''}
            </span>
        );

        let control: React.ReactNode;

        switch (field.type) {
            case 'textarea':
                control = (
                    <textarea
                        value={typeof value === 'string' ? value : ''}
                        onChange={(e) => setValue(field.key, e.target.value)}
                        rows={4}
                        maxLength={field.max}
                        className={inputClass}
                    />
                );
                break;
            case 'select':
                control = (
                    <select
                        value={typeof value === 'string' ? value : ''}
                        onChange={(e) => setValue(field.key, e.target.value)}
                        className={inputClass}
                    >
                        <option value="">Select…</option>
                        {(field.options ?? []).map((opt) => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                );
                break;
            case 'radio':
                control = (
                    <div className="mt-1 space-y-1">
                        {(field.options ?? []).map((opt) => (
                            <label key={opt} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                                <input
                                    type="radio"
                                    name={field.key}
                                    value={opt}
                                    checked={value === opt}
                                    onChange={() => setValue(field.key, opt)}
                                />
                                {opt}
                            </label>
                        ))}
                    </div>
                );
                break;
            case 'multiselect':
                control = (
                    <div className="mt-1 space-y-1">
                        {(field.options ?? []).map((opt) => {
                            const list = Array.isArray(value) ? value : [];
                            const checked = list.includes(opt);
                            return (
                                <label key={opt} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() =>
                                            setValue(
                                                field.key,
                                                checked ? list.filter((v) => v !== opt) : [...list, opt],
                                            )
                                        }
                                    />
                                    {opt}
                                </label>
                            );
                        })}
                    </div>
                );
                break;
            case 'checkbox':
                control = (
                    <label className="mt-1 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                        <input
                            type="checkbox"
                            checked={value === true}
                            onChange={(e) => setValue(field.key, e.target.checked)}
                        />
                        Yes
                    </label>
                );
                break;
            case 'number':
            case 'currency':
                control = (
                    <input
                        type="number"
                        value={typeof value === 'string' ? value : ''}
                        onChange={(e) => setValue(field.key, e.target.value)}
                        className={inputClass}
                    />
                );
                break;
            case 'date':
                control = (
                    <input
                        type="date"
                        value={typeof value === 'string' ? value : ''}
                        onChange={(e) => setValue(field.key, e.target.value)}
                        className={inputClass}
                    />
                );
                break;
            case 'email':
                control = (
                    <input
                        type="email"
                        value={typeof value === 'string' ? value : ''}
                        onChange={(e) => setValue(field.key, e.target.value)}
                        className={inputClass}
                    />
                );
                break;
            case 'phone':
                control = (
                    <input
                        type="tel"
                        value={typeof value === 'string' ? value : ''}
                        onChange={(e) => setValue(field.key, e.target.value)}
                        className={inputClass}
                    />
                );
                break;
            case 'file':
            case 'image':
                control = (
                    <input
                        type="url"
                        placeholder="https://"
                        value={typeof value === 'string' ? value : ''}
                        onChange={(e) => setValue(field.key, e.target.value)}
                        className={inputClass}
                    />
                );
                break;
            default:
                control = (
                    <input
                        type="text"
                        value={typeof value === 'string' ? value : ''}
                        onChange={(e) => setValue(field.key, e.target.value)}
                        maxLength={field.max}
                        className={inputClass}
                    />
                );
                break;
        }

        return (
            <label key={field.key} className="block">
                {label}
                {control}
                {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
            </label>
        );
    };

    return (
        <AppLayout title={form.name}>
            <Head title={form.name} />
            <div className="mx-auto max-w-2xl">
                <Link
                    href="/"
                    className="mb-4 inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-500"
                >
                    <ArrowLeft className="h-4 w-4" /> Back
                </Link>

                <div className="rounded-xl bg-white p-6 shadow dark:bg-gray-800 sm:p-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{form.name}</h1>

                    {done ? (
                        <div className="mt-8 flex flex-col items-center text-center">
                            <CheckCircle2 className="h-12 w-12 text-green-500" />
                            <p className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                                Your response has been recorded.
                            </p>
                            <p className="mt-1 text-sm text-gray-500">We will get back to you if a reply is needed.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                            {form.fields.map(renderField)}

                            {Object.keys(errors).length > 0 && Object.keys(errors).length <= 3 && (
                                <p className="text-sm text-red-600">Please fix the highlighted fields.</p>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 sm:w-auto"
                            >
                                <Send className="h-4 w-4" />
                                {submitting ? 'Submitting…' : 'Submit'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
