import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { ArrowLeft, Upload, X, FileText } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { NeedCategory } from '@/types';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'GHS', 'KES', 'NGN', 'ZAR', 'INR', 'AED'];

interface UploadedFile {
    url: string;
    name: string;
}

/**
 * Spec S11 - Submit Your Need. Every field in the spec is collected; the
 * draft option persists a `draft` (spec S13) the owner submits later.
 * Deep links (?type= / ?category=) from the need carousel preselect a
 * matching real category.
 */
export default function NeedsRequest() {
    const { auth } = usePage().props as { auth?: { user?: { id: string } } };
    const [categories, setCategories] = useState<NeedCategory[]>([]);
    const [form, setForm] = useState({
        title: '',
        description: '',
        category_id: '',
        subcategory: '',
        quantity: '',
        budget_min: '',
        budget_max: '',
        currency: 'USD',
        country: '',
        location: '',
        preferred_date: '',
        deadline: '',
        service_requirements: '',
        delivery_requirements: '',
        notes: '',
    });
    const [images, setImages] = useState<UploadedFile[]>([]);
    const [documents, setDocuments] = useState<UploadedFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get<{ data: NeedCategory[] }>('/api/need-categories')
            .then((res) => setCategories(res.data ?? []))
            .catch(() => setCategories([]));
    }, []);

    // Deep links from NeedCarousel: /needs/request?type=product|worker|... and
    // ?category={key} preselect the matching real category when one exists.
    useEffect(() => {
        if (categories.length === 0) return;
        const params = new URLSearchParams(window.location.search);
        const needle = (params.get('category') ?? params.get('type') ?? '').toLowerCase();
        if (!needle) return;
        const match = categories.find(
            (c) => c.slug.toLowerCase() === needle || c.name.toLowerCase().replace(/\s+/g, '-').includes(needle),
        );
        if (match) setForm((f) => ({ ...f, category_id: match.id }));
    }, [categories]);

    const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value }));

    const uploadFiles = async (files: FileList | null, bucket: 'image' | 'document') => {
        if (!files || files.length === 0) return;
        setUploading(true);
        setError(null);
        try {
            for (const file of Array.from(files)) {
                const fd = new FormData();
                fd.append('file', file);
                fd.append('folder', bucket === 'image' ? 'need-images' : 'need-documents');
                const res = await api.post<{ data: { url: string; name: string } }>('/api/upload', fd);
                const entry = res.data;
                if (bucket === 'image') setImages((prev) => [...prev, entry]);
                else setDocuments((prev) => [...prev, entry]);
            }
        } catch (e) {
            setError(errorMessage(e, 'Upload failed'));
        } finally {
            setUploading(false);
        }
    };

    const submit = async (asDraft: boolean) => {
        if (!auth?.user) {
            router.visit('/login');
            return;
        }
        if (!form.title.trim()) {
            setError('A title is required.');
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            const num = (v: string) => (v.trim() !== '' && Number.isFinite(Number(v)) ? Number(v) : undefined);
            const res = await api.post<{ data: { id: string } }>('/api/need-requests', {
                title: form.title,
                description: form.description || form.title,
                category_id: form.category_id || undefined,
                subcategory: form.subcategory || undefined,
                quantity: num(form.quantity),
                budget_min: num(form.budget_min),
                budget_max: num(form.budget_max),
                currency: form.currency,
                country: form.country || undefined,
                location: form.location || undefined,
                preferred_date: form.preferred_date || undefined,
                deadline: form.deadline || undefined,
                service_requirements: form.service_requirements || undefined,
                delivery_requirements: form.delivery_requirements || undefined,
                notes: form.notes || undefined,
                images: images.length > 0 ? images.map((i) => i.url) : undefined,
                attachments: documents.length > 0 ? documents.map((d) => d.url) : undefined,
                save_as_draft: asDraft,
            });
            router.visit(`/needs/my-needs/${res.data.id}`);
        } catch (e) {
            setError(errorMessage(e, 'Failed to submit'));
        }
        setSubmitting(false);
    };

    const categoryName = useMemo(
        () => categories.find((c) => c.id === form.category_id)?.name,
        [categories, form.category_id],
    );

    const inputClass = 'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white';
    const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300';

    return (
        <AppLayout title="Submit a Need">
            <Head title="Submit a Need" />
            <div className="mx-auto max-w-3xl space-y-6">
                <Link href="/needs" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4" /> Back to Needs
                </Link>
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Submit Your Need</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Tell providers exactly what you need - you can save a draft and finish later.
                    </p>

                    {error && (
                        <div role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                            {error}
                        </div>
                    )}

                    <div className="mt-6 space-y-4">
                        <div>
                            <label className={labelClass} htmlFor="need-title">Title *</label>
                            <input id="need-title" type="text" value={form.title} onChange={set('title')} placeholder="What do you need?" className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass} htmlFor="need-description">Description</label>
                            <textarea id="need-description" value={form.description} onChange={set('description')} rows={4} placeholder="Describe the requirement in detail..." className={inputClass} />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className={labelClass} htmlFor="need-category">Category</label>
                                <select id="need-category" value={form.category_id} onChange={set('category_id')} className={inputClass}>
                                    <option value="">Select a category</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                {categoryName && <p className="mt-1 text-xs text-gray-500">Selected: {categoryName}</p>}
                            </div>
                            <div>
                                <label className={labelClass} htmlFor="need-subcategory">Subcategory</label>
                                <input id="need-subcategory" type="text" value={form.subcategory} onChange={set('subcategory')} placeholder="e.g. Emergency call-out" className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass} htmlFor="need-quantity">Quantity</label>
                                <input id="need-quantity" type="number" min={1} value={form.quantity} onChange={set('quantity')} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass} htmlFor="need-location">Location</label>
                                <input id="need-location" type="text" value={form.location} onChange={set('location')} placeholder="City or area" className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass} htmlFor="need-country">Country</label>
                                <input id="need-country" type="text" value={form.country} onChange={set('country')} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass} htmlFor="need-currency">Currency</label>
                                <select id="need-currency" value={form.currency} onChange={set('currency')} className={inputClass}>
                                    {CURRENCIES.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass} htmlFor="need-budget-min">Budget from</label>
                                <input id="need-budget-min" type="number" min={0} value={form.budget_min} onChange={set('budget_min')} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass} htmlFor="need-budget-max">Budget to</label>
                                <input id="need-budget-max" type="number" min={0} value={form.budget_max} onChange={set('budget_max')} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass} htmlFor="need-preferred">Preferred date</label>
                                <input id="need-preferred" type="date" value={form.preferred_date} onChange={set('preferred_date')} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass} htmlFor="need-deadline">Deadline</label>
                                <input id="need-deadline" type="date" value={form.deadline} onChange={set('deadline')} className={inputClass} />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass} htmlFor="need-service-requirements">Service requirements</label>
                            <textarea id="need-service-requirements" value={form.service_requirements} onChange={set('service_requirements')} rows={3} placeholder="Skills, tools, certifications..." className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass} htmlFor="need-delivery-requirements">Delivery requirements</label>
                            <textarea id="need-delivery-requirements" value={form.delivery_requirements} onChange={set('delivery_requirements')} rows={3} placeholder="How/when should it be delivered?" className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass} htmlFor="need-notes">Additional notes</label>
                            <textarea id="need-notes" value={form.notes} onChange={set('notes')} rows={3} className={inputClass} />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <span className={labelClass}>Images</span>
                                <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 hover:border-indigo-400 dark:border-gray-600">
                                    <Upload className="h-4 w-4" />
                                    {uploading ? 'Uploading...' : 'Add images'}
                                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadFiles(e.target.files, 'image')} />
                                </label>
                                {images.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {images.map((img) => (
                                            <span key={img.url} className="relative inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-700">
                                                <FileText className="h-3 w-3" />
                                                <a href={img.url} target="_blank" rel="noreferrer" className="max-w-[140px] truncate hover:underline">{img.name}</a>
                                                <button type="button" aria-label={`Remove ${img.name}`} onClick={() => setImages((p) => p.filter((x) => x.url !== img.url))}>
                                                    <X className="h-3 w-3 text-red-500" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <span className={labelClass}>Documents</span>
                                <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 hover:border-indigo-400 dark:border-gray-600">
                                    <Upload className="h-4 w-4" />
                                    {uploading ? 'Uploading...' : 'Add documents'}
                                    <input type="file" multiple className="hidden" onChange={(e) => uploadFiles(e.target.files, 'document')} />
                                </label>
                                {documents.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {documents.map((doc) => (
                                            <span key={doc.url} className="relative inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-700">
                                                <FileText className="h-3 w-3" />
                                                <a href={doc.url} target="_blank" rel="noreferrer" className="max-w-[140px] truncate hover:underline">{doc.name}</a>
                                                <button type="button" aria-label={`Remove ${doc.name}`} onClick={() => setDocuments((p) => p.filter((x) => x.url !== doc.url))}>
                                                    <X className="h-3 w-3 text-red-500" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <button
                            type="button"
                            onClick={() => submit(true)}
                            disabled={submitting || uploading || !form.title}
                            className="w-full rounded-lg border border-gray-300 px-6 py-3 text-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                            Save draft
                        </button>
                        <button
                            type="button"
                            onClick={() => submit(false)}
                            disabled={submitting || uploading || !form.title}
                            data-testid="need-submit-button"
                            className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                        >
                            {submitting ? 'Submitting...' : 'Submit request'}
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
