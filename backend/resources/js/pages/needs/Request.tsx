import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { Button } from '@/components/shared/Button';
import { formatPrice } from '@/lib/currency';
import { ArrowLeft, Upload, X, FileText, Package } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { NeedCategory, NeedCategoryFormField } from '@/types';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'GHS', 'KES', 'NGN', 'ZAR', 'INR', 'AED'];

const PRICING_BASES = [
    { value: 'fixed', label: 'Fixed price' },
    { value: 'range', label: 'Budget range' },
    { value: 'hourly', label: 'Hourly rate' },
    { value: 'per_item', label: 'Per item' },
    { value: 'quote', label: 'Request quotation' },
    { value: 'inspection', label: 'Inspection before quote' },
    { value: 'flexible', label: 'Flexible / undisclosed' },
] as const;

interface PackageNudge {
    id: string;
    name: string;
    price?: number | string | null;
}

interface UploadedFile {
    url: string;
    name: string;
}

// N-22 gig packages: a deal page's "Request {tier}" lands here with the
// listing + tier (+ optional extras) in the query string; the server
// re-resolves every price from the listing on submit.
interface LinkedListing {
    id: string;
    name: string;
    package_index: number | null;
    package: { name: string; price: number; delivery_time?: string | null } | null;
    extras: { name: string; price: number }[];
    extra_indexes: number[];
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
        pricing_basis: 'fixed',
        country: '',
        state: '',
        lga: '',
        city: '',
        location: '',
        is_remote: false,
        preferred_date: '',
        deadline: '',
        is_asap: false,
        preferred_time_window: '',
        service_requirements: '',
        delivery_requirements: '',
        notes: '',
    });
    const [images, setImages] = useState<UploadedFile[]>([]);
    const [documents, setDocuments] = useState<UploadedFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // TODO 18 edit mode: ?edit={id} loads an owned draft/pending request
    // and saves through PUT instead of POST.
    const editId = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('edit')
        : null;
    const [loadingEdit, setLoadingEdit] = useState(!!editId);
    // TODO 05 category questions: schema-driven fields for the chosen category.
    const [schema, setSchema] = useState<NeedCategoryFormField[]>([]);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    // Edit-load owns the answers until the schema for the loaded category
    // arrives; without this the category-change reset below wipes them.
    const editBoot = useRef(false);
    // TODO 06: package nudge + review step.
    const [packages, setPackages] = useState<PackageNudge[]>([]);
    const [reviewing, setReviewing] = useState(false);
    // N-35 quote calculator: guide-powered estimate for the chosen category.
    const [estimate, setEstimate] = useState<{ price_min: number; price_avg: number; price_max: number; currency: string; pricing_unit: string; guide: { slug: string; title: string } } | null>(null);

    // N-22 deep link from a deal page: ?listing={id}&package={i}&addons=1,2
    const [linkedListing, setLinkedListing] = useState<LinkedListing | null>(null);
    const linkedBoot = useRef(false);
    useEffect(() => {
        if (linkedBoot.current) return;
        const params = new URLSearchParams(window.location.search);
        const listingId = params.get('listing');
        if (!listingId) return;
        linkedBoot.current = true;
        const pkgIndexRaw = params.get('package');
        const pkgIndex = pkgIndexRaw !== null && Number.isInteger(Number(pkgIndexRaw)) ? Number(pkgIndexRaw) : null;
        const extraIndexes = (params.get('addons') ?? '')
            .split(',')
            .map((s) => Number(s))
            .filter((n) => Number.isInteger(n) && n >= 0);
        api.get<{ data: { id: string; name: string; category_id?: string; packages?: { name: string; price: number | string; delivery_time?: string | null }[] | null; add_ons?: { name: string; price: number | string }[] | null } }>(`/api/deals/${listingId}`)
            .then((res) => {
                const d = res.data;
                const pkg = pkgIndex !== null ? (d.packages ?? [])[pkgIndex] ?? null : null;
                const extras = extraIndexes
                    .map((i) => (d.add_ons ?? [])[i])
                    .filter((a): a is { name: string; price: number | string } => Boolean(a))
                    .map((a) => ({ name: a.name, price: Number(a.price) }));
                setLinkedListing({
                    id: d.id,
                    name: d.name,
                    package_index: pkg ? pkgIndex : null,
                    package: pkg ? { name: pkg.name, price: Number(pkg.price), delivery_time: pkg.delivery_time } : null,
                    extras,
                    extra_indexes: pkg ? extraIndexes : [],
                });
                setForm((f) => ({
                    ...f,
                    title: f.title.trim() ? f.title : d.name,
                    category_id: f.category_id || d.category_id || '',
                    budget_min: pkg ? String(Number(pkg.price)) : f.budget_min,
                    budget_max: pkg ? String(Number(pkg.price)) : f.budget_max,
                }));
            })
            .catch(() => setError('Could not load the listing package you chose — pick it again from the deal.'));
    }, []);

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

    // Category questions: load the schema (with fields) for the selection.
    // Stale answers are dropped on category change so a plumbing answer can
    // never leak into a tutoring request.
    useEffect(() => {
        if (!form.category_id) {
            setSchema([]);
            setAnswers({});
            return;
        }
        let live = true;
        api.get<{ data: NeedCategory }>(`/api/need-categories/${form.category_id}`)
            .then((res) => {
                if (!live) return;
                setSchema(res.data?.form_schema ?? []);
                if (editBoot.current) {
                    editBoot.current = false;
                } else {
                    setAnswers({});
                }
            })
            .catch(() => {
                if (live) {
                    setSchema([]);
                    if (editBoot.current) {
                        editBoot.current = false;
                    } else {
                        setAnswers({});
                    }
                }
            });
        // Step 1 package nudge: suitable predefined packages for this category.
        api.get<{ data: PackageNudge[] }>(`/api/need-items?category_id=${form.category_id}&is_available=true&per_page=3`)
            .then((res) => {
                if (live) setPackages(Array.isArray(res.data) ? res.data.slice(0, 3) : []);
            })
            .catch(() => {
                if (live) setPackages([]);
            });
        return () => {
            live = false;
        };
    }, [form.category_id]);

    // N-35 estimate: refetch when the category or quantity changes; 404
    // (no priced guide) simply hides the panel — never a fabricated price.
    useEffect(() => {
        if (!form.category_id) {
            setEstimate(null);
            return;
        }
        let live = true;
        const qty = Math.max(1, Number(form.quantity) || 1);
        api.get<{ data: { estimate: { price_min: number; price_avg: number; price_max: number; currency: string; pricing_unit: string }; guide: { slug: string; title: string } } }>(
            `/api/need-estimates?category_id=${form.category_id}&quantity=${qty}`,
        )
            .then((res) => {
                if (!live) return;
                setEstimate({ ...res.data.estimate, guide: res.data.guide });
            })
            .catch(() => {
                if (live) setEstimate(null);
            });
        return () => {
            live = false;
        };
    }, [form.category_id, form.quantity]);

    const setAnswer = (key: string, value: string) =>
        setAnswers((prev) => ({ ...prev, [key]: value }));

    // Edit mode: fill the form from the owned request (server re-checks
    // ownership and editable status on save).
    useEffect(() => {
        if (!editId) return;
        let live = true;
        api.get<{ data: Record<string, unknown> }>(`/api/need-requests/${editId}`)
            .then((res) => {
                if (!live) return;
                const n = res.data ?? {};
                const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));
                setForm((f) => ({
                    ...f,
                    title: str(n.title),
                    description: str(n.description),
                    category_id: str(n.category_id),
                    subcategory: str(n.subcategory),
                    quantity: str(n.quantity),
                    budget_min: str(n.budget_min),
                    budget_max: str(n.budget_max),
                    currency: str(n.currency) || 'USD',
                    pricing_basis: str(n.pricing_basis) || 'fixed',
                    country: str(n.country),
                    state: str(n.state),
                    lga: str(n.lga),
                    city: str(n.city),
                    location: str(n.location),
                    is_remote: !!n.is_remote,
                    preferred_date: str(n.preferred_date)?.slice(0, 10) ?? '',
                    deadline: str(n.deadline)?.slice(0, 10) ?? '',
                    is_asap: !!n.is_asap,
                    preferred_time_window: str(n.preferred_time_window),
                    service_requirements: str(n.service_requirements),
                    delivery_requirements: str(n.delivery_requirements),
                    notes: str(n.notes),
                }));
                const a = n.answers as Record<string, unknown> | null;
                if (a && typeof a === 'object') {
                    editBoot.current = true;
                    const flat: Record<string, string> = {};
                    for (const [k, v] of Object.entries(a)) flat[k] = String(v ?? '');
                    setAnswers(flat);
                }
                setLoadingEdit(false);
            })
            .catch((e) => {
                if (!live) return;
                setError(errorMessage(e, 'Could not load the request for editing'));
                setLoadingEdit(false);
            });
        return () => {
            live = false;
        };
    }, [editId]);

    const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value }));

    const setCheck = (key: 'is_remote' | 'is_asap') => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.checked }));

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
            const payload = {
                title: form.title,
                description: form.description || form.title,
                category_id: form.category_id || undefined,
                subcategory: form.subcategory || undefined,
                quantity: num(form.quantity),
                budget_min: num(form.budget_min),
                budget_max: num(form.budget_max),
                currency: form.currency,
                pricing_basis: form.pricing_basis,
                country: form.country || undefined,
                state: form.state || undefined,
                lga: form.lga || undefined,
                city: form.city || undefined,
                location: form.location || undefined,
                is_remote: form.is_remote || undefined,
                preferred_date: form.preferred_date || undefined,
                deadline: form.deadline || undefined,
                is_asap: form.is_asap || undefined,
                preferred_time_window: form.preferred_time_window || undefined,
                service_requirements: form.service_requirements || undefined,
                delivery_requirements: form.delivery_requirements || undefined,
                notes: form.notes || undefined,
                images: images.length > 0 ? images.map((i) => i.url) : undefined,
                answers: Object.keys(answers).length > 0 ? answers : undefined,
                attachments: documents.length > 0 ? documents.map((d) => d.url) : undefined,
                selected_listing_id: linkedListing?.id,
                selected_package_index: linkedListing?.package_index ?? undefined,
                selected_add_on_indexes:
                    linkedListing && linkedListing.extra_indexes.length > 0 ? linkedListing.extra_indexes : undefined,
                save_as_draft: asDraft,
            };
            // Edit mode saves through PUT (server re-checks ownership and
            // editable status); drafts skip the review step entirely.
            const res = editId
                ? await api.put<{ data: { id: string } }>(`/api/need-requests/${editId}`, payload)
                : await api.post<{ data: { id: string } }>('/api/need-requests', payload);
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

                {/* N-22: chosen gig package rides along with the request */}
                {linkedListing && (
                    <div
                        data-testid="linked-listing"
                        className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-900/20"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <Package className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                                        Requesting from a listing
                                    </p>
                                    <p className="mt-0.5 font-semibold text-gray-900 dark:text-white">{linkedListing.name}</p>
                                    {linkedListing.package && (
                                        <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">
                                            {linkedListing.package.name} — {formatPrice(linkedListing.package.price)}
                                            {linkedListing.package.delivery_time ? ` · ${linkedListing.package.delivery_time}` : ''}
                                        </p>
                                    )}
                                    {linkedListing.extras.length > 0 && (
                                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                            Extras:{' '}
                                            {linkedListing.extras.map((e, i) => (
                                                <span key={i} className="mr-2 inline-block rounded bg-indigo-100 px-1.5 py-0.5 dark:bg-indigo-900/40">
                                                    {e.name} +{formatPrice(e.price)}
                                                </span>
                                            ))}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                type="button"
                                data-testid="unlink-listing"
                                onClick={() => {
                                    setLinkedListing(null);
                                    window.history.replaceState({}, '', '/needs/request');
                                }}
                                className="text-xs font-medium text-gray-500 hover:text-gray-700"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                )}
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{editId ? 'Edit Your Need' : 'Submit Your Need'}</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {editId
                            ? 'Revise your draft or pending request. Published requests with bids cannot be edited.'
                            : 'Tell providers exactly what you need - you can save a draft and finish later.'}
                    </p>
                    {loadingEdit && <p className="mt-4 text-sm text-gray-500">Loading your request…</p>}

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
                                {estimate && (
                                    <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20" role="status" aria-live="polite">
                                        <p className="text-xs font-semibold text-blue-800 dark:text-blue-200">
                                            Typical cost: ${estimate.price_min.toLocaleString()} – ${estimate.price_max.toLocaleString()} {estimate.currency}
                                            {estimate.price_avg > 0 && <> · avg ${estimate.price_avg.toLocaleString()}</>}
                                            <span className="font-normal"> / {estimate.pricing_unit}</span>
                                        </p>
                                        <p className="mt-0.5 text-xs text-blue-700/80 dark:text-blue-300/80">
                                            Estimate based on{' '}
                                            <Link href={`/needs/cost-guides/${estimate.guide.slug}`} className="underline">
                                                {estimate.guide.title}
                                            </Link>
                                            {' '}— actual offers vary.
                                        </p>
                                    </div>
                                )}
                                {packages.length > 0 && (
                                    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                                        <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                                            A predefined package might cover this — compare before posting:
                                        </p>
                                        <ul className="mt-1 space-y-1">
                                            {packages.map((p) => (
                                                <li key={p.id} className="text-xs">
                                                    <Link
                                                        href={`/deals/${p.id}`}
                                                        className="font-medium text-indigo-600 hover:underline"
                                                    >
                                                        {p.name}
                                                    </Link>
                                                    {p.price != null && (
                                                        <span className="text-gray-500"> · {p.price}</span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
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
                                <label className={labelClass} htmlFor="need-state">State</label>
                                <input id="need-state" type="text" value={form.state} onChange={set('state')} placeholder="e.g. Lagos" className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass} htmlFor="need-lga">LGA</label>
                                <input id="need-lga" type="text" value={form.lga} onChange={set('lga')} placeholder="e.g. Ikeja" className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass} htmlFor="need-city">City / town</label>
                                <input id="need-city" type="text" value={form.city} onChange={set('city')} placeholder="e.g. Ikeja GRA" className={inputClass} />
                            </div>
                            <div className="flex items-end pb-2">
                                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300" htmlFor="need-remote">
                                    <input id="need-remote" type="checkbox" checked={form.is_remote} onChange={setCheck('is_remote')} className="h-4 w-4 rounded" />
                                    Remote / online service
                                </label>
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
                                <label className={labelClass} htmlFor="need-pricing-basis">Pricing basis</label>
                                <select id="need-pricing-basis" value={form.pricing_basis} onChange={set('pricing_basis')} className={inputClass}>
                                    {PRICING_BASES.map((b) => (
                                        <option key={b.value} value={b.value}>{b.label}</option>
                                    ))}
                                </select>
                                {(form.pricing_basis === 'quote' || form.pricing_basis === 'inspection') && (
                                    <p className="mt-1 text-xs text-gray-500">Providers will propose the price — budgets stay optional.</p>
                                )}
                            </div>
                            <div>
                                <label className={labelClass} htmlFor="need-preferred">Preferred date</label>
                                <input id="need-preferred" type="date" value={form.preferred_date} onChange={set('preferred_date')} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass} htmlFor="need-deadline">Deadline</label>
                                <input id="need-deadline" type="date" value={form.deadline} onChange={set('deadline')} className={inputClass} />
                            </div>
                            <div className="flex items-end pb-2">
                                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300" htmlFor="need-asap">
                                    <input id="need-asap" type="checkbox" checked={form.is_asap} onChange={setCheck('is_asap')} className="h-4 w-4 rounded" />
                                    ASAP — as soon as possible
                                </label>
                            </div>
                            <div>
                                <label className={labelClass} htmlFor="need-time-window">Preferred time window</label>
                                <input id="need-time-window" type="text" value={form.preferred_time_window} onChange={set('preferred_time_window')} placeholder="e.g. Weekdays after 5pm" className={inputClass} />
                            </div>
                        </div>

                        {schema.length > 0 && (
                            <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900 dark:bg-indigo-900/20">
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    About this {categoryName ?? 'service'}
                                </h2>
                                <p className="mt-0.5 text-xs text-gray-500">
                                    A few quick questions help providers quote accurately.
                                </p>
                                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {schema.map((field) => (
                                        <div key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2' : undefined}>
                                            <label className={labelClass} htmlFor={`need-q-${field.key}`}>
                                                {field.label}{field.required ? ' *' : ''}
                                            </label>
                                            {field.type === 'textarea' ? (
                                                <textarea
                                                    id={`need-q-${field.key}`}
                                                    value={answers[field.key] ?? ''}
                                                    onChange={(e) => setAnswer(field.key, e.target.value)}
                                                    rows={3}
                                                    className={inputClass}
                                                />
                                            ) : field.type === 'select' ? (
                                                <select
                                                    id={`need-q-${field.key}`}
                                                    value={answers[field.key] ?? ''}
                                                    onChange={(e) => setAnswer(field.key, e.target.value)}
                                                    className={inputClass}
                                                >
                                                    <option value="">Select…</option>
                                                    {(field.options ?? []).map((opt) => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            ) : field.type === 'boolean' ? (
                                                <select
                                                    id={`need-q-${field.key}`}
                                                    value={answers[field.key] ?? ''}
                                                    onChange={(e) => setAnswer(field.key, e.target.value)}
                                                    className={inputClass}
                                                >
                                                    <option value="">Select…</option>
                                                    <option value="1">Yes</option>
                                                    <option value="0">No</option>
                                                </select>
                                            ) : (
                                                <input
                                                    id={`need-q-${field.key}`}
                                                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                                    value={answers[field.key] ?? ''}
                                                    onChange={(e) => setAnswer(field.key, e.target.value)}
                                                    className={inputClass}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

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
                                                <Button type="button" variant="icon" iconOnly size="sm" aria-label={`Remove ${img.name}`} onClick={() => setImages((p) => p.filter((x) => x.url !== img.url))}>
                                                    <X className="h-3 w-3 text-red-500" />
                                                </Button>
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
                                                <Button type="button" variant="icon" iconOnly size="sm" aria-label={`Remove ${doc.name}`} onClick={() => setDocuments((p) => p.filter((x) => x.url !== doc.url))}>
                                                    <X className="h-3 w-3 text-red-500" />
                                                </Button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-700 dark:bg-gray-700/40">
                        <h2 className="font-semibold text-gray-900 dark:text-white">Who can see this request?</h2>
                        <p className="mt-1 text-xs text-gray-500">
                            Published requests are visible to eligible providers, who may then
                            see the description, location area, budget and schedule. Your exact
                            home address and contact details are never shown publicly.
                        </p>
                    </div>

                    {reviewing && (
                        <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900 dark:bg-indigo-900/20" role="region" aria-label="Review your request">
                            <h2 className="font-semibold text-gray-900 dark:text-white">Review before submitting</h2>
                            <dl className="mt-2 space-y-1 text-sm">
                                <div><dt className="inline font-medium">Title: </dt><dd className="inline">{form.title}</dd></div>
                                <div><dt className="inline font-medium">Category: </dt><dd className="inline">{categoryName ?? '—'}</dd></div>
                                <div><dt className="inline font-medium">Budget: </dt><dd className="inline">{PRICING_BASES.find((b) => b.value === form.pricing_basis)?.label}{form.budget_min || form.budget_max ? ` (${form.budget_min || '?'}–${form.budget_max || '?'} ${form.currency})` : ''}</dd></div>
                                <div><dt className="inline font-medium">Where: </dt><dd className="inline">{form.is_remote ? 'Remote / online' : [form.city, form.lga, form.state, form.country].filter(Boolean).join(', ') || form.location || '—'}</dd></div>
                                <div><dt className="inline font-medium">When: </dt><dd className="inline">{form.is_asap ? 'ASAP' : form.preferred_date || form.deadline || 'Flexible'}{form.preferred_time_window ? ` (${form.preferred_time_window})` : ''}</dd></div>
                                {Object.keys(answers).length > 0 && (
                                    <div><dt className="inline font-medium">Answers: </dt><dd className="inline">{schema.filter((f) => answers[f.key]).map((f) => `${f.label}: ${answers[f.key]}`).join(' · ')}</dd></div>
                                )}
                                <div><dt className="inline font-medium">Attachments: </dt><dd className="inline">{images.length} image(s), {documents.length} document(s)</dd></div>
                            </dl>
                        </div>
                    )}

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={() => submit(true)}
                            disabled={submitting || uploading || !form.title}
                            fullWidth
                        >
                            Save draft
                        </Button>
                        {reviewing ? (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="lg"
                                    onClick={() => setReviewing(false)}
                                    disabled={submitting}
                                    fullWidth
                                >
                                    Back to edit
                                </Button>
                                <Button
                                    type="button"
                                    size="lg"
                                    onClick={() => submit(false)}
                                    loading={submitting || uploading}
                                    disabled={!form.title}
                                    data-testid="need-confirm-button"
                                    fullWidth
                                >
                                    Confirm & submit
                                </Button>
                            </>
                        ) : (
                            <Button
                                type="button"
                                size="lg"
                                onClick={() => {
                                    if (!form.title.trim()) {
                                        setError('A title is required.');
                                        return;
                                    }
                                    setError(null);
                                    // Edit mode saves directly; new requests review first.
                                    if (editId) {
                                        submit(false);
                                        return;
                                    }
                                    setReviewing(true);
                                    const reduced = typeof window !== 'undefined'
                                        && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
                                    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
                                }}
                                disabled={!form.title}
                                data-testid="need-submit-button"
                                fullWidth
                            >
                                {editId ? 'Save changes' : 'Review request'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
