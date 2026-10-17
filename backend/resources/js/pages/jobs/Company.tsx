import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { useConfirm } from '@/lib/confirm';
import { useEffect, useState } from 'react';
import { Building2, ExternalLink, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Company {
    id?: string;
    name: string;
    slug?: string;
    description?: string | null;
    website?: string | null;
    industry?: string | null;
    company_size?: string | null;
    location?: string | null;
    logo_path?: string | null;
    is_active?: boolean;
    created_at?: string;
}

const input = 'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white';
const label = 'block text-sm font-medium text-gray-700 dark:text-gray-300';

const empty: Company = {
    name: '',
    description: '',
    website: '',
    industry: '',
    company_size: '',
    location: '',
};

/**
 * N-32 company profiles: one per owner in v1. Create once, edit forever —
 * the slug (public link) is fixed at creation so /companies/{slug}
 * survives a rename.
 */
export default function ManageCompany() {
    const [company, setCompany] = useState<Company | null>(null);
    const [loaded, setLoaded] = useState(false);
    const [form, setForm] = useState<Company>(empty);
    const [saving, setSaving] = useState(false);
    const ask = useConfirm();

    const load = () => {
        api.get<{ data: Company | null }>('/api/company')
            .then((res) => {
                const c = res.data ?? null;
                setCompany(c);
                setForm(c ? { ...empty, ...c } : empty);
            })
            .catch((e) => toast.error(errorMessage(e, 'Could not load company profile')))
            .finally(() => setLoaded(true));
    };

    useEffect(load, []);

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                name: form.name,
                description: form.description || undefined,
                website: form.website || undefined,
                industry: form.industry || undefined,
                company_size: form.company_size || undefined,
                location: form.location || undefined,
            };
            if (company) {
                await api.put('/api/company', payload);
                toast.success('Company profile updated.');
            } else {
                const res = await api.post<{ data: Company }>('/api/company', payload);
                toast.success('Company profile created.');
                setCompany(res.data);
            }
            load();
        } catch (e2) {
            toast.error(errorMessage(e2, 'Could not save'));
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        if (!(await ask({ title: 'Remove your company profile?', description: 'Your past job posts keep their company name, but the public page disappears.', danger: true }))) return;
        try {
            await api.del('/api/company');
            toast.success('Company profile removed.');
            setCompany(null);
            setForm(empty);
        } catch (e) {
            toast.error(errorMessage(e, 'Could not remove'));
        }
    };

    const set = (key: keyof Company, value: string) => setForm((f) => ({ ...f, [key]: value }));

    return (
        <AppLayout title="Company Profile">
            <Head title="Company Profile" />
            <div className="mx-auto max-w-3xl space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                            <Building2 className="h-6 w-6" /> Company profile
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Your public page at /companies/… — new job posts attach to it automatically.
                        </p>
                    </div>
                    <Link href="/jobs/my-jobs" className="text-sm text-indigo-600 hover:underline">← My jobs</Link>
                </div>

                {company?.slug && (
                    <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-300">
                        <span>Public page live:</span>
                        <Link href={`/companies/${company.slug}`} className="inline-flex items-center gap-1 font-medium underline">
                            /companies/{company.slug} <ExternalLink className="h-3 w-3" />
                        </Link>
                    </div>
                )}

                {!loaded ? (
                    <p className="text-sm text-gray-500">Loading…</p>
                ) : (
                    <form onSubmit={save} className="space-y-4 rounded-lg border p-4 dark:border-gray-700">
                        <div>
                            <label className={label} htmlFor="co-name">Company name *</label>
                            <input id="co-name" required minLength={2} maxLength={120} value={form.name} onChange={(e) => set('name', e.target.value)} className={input} placeholder="e.g. VoltWorks Ltd" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={label} htmlFor="co-industry">Industry</label>
                                <input id="co-industry" maxLength={120} value={form.industry ?? ''} onChange={(e) => set('industry', e.target.value)} className={input} placeholder="e.g. Renewable energy" />
                            </div>
                            <div>
                                <label className={label} htmlFor="co-size">Company size</label>
                                <input id="co-size" maxLength={50} value={form.company_size ?? ''} onChange={(e) => set('company_size', e.target.value)} className={input} placeholder="e.g. 11-50 employees" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={label} htmlFor="co-location">Location</label>
                                <input id="co-location" maxLength={255} value={form.location ?? ''} onChange={(e) => set('location', e.target.value)} className={input} placeholder="e.g. Tema, Ghana" />
                            </div>
                            <div>
                                <label className={label} htmlFor="co-website">Website</label>
                                <input id="co-website" type="url" maxLength={255} value={form.website ?? ''} onChange={(e) => set('website', e.target.value)} className={input} placeholder="https://…" />
                            </div>
                        </div>
                        <div>
                            <label className={label} htmlFor="co-desc">About the company</label>
                            <textarea id="co-desc" rows={5} maxLength={5000} value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} className={input} placeholder="What you build, who you hire for…" />
                        </div>
                        <div className="flex items-center gap-3">
                            <button type="submit" disabled={saving || !form.name.trim()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
                                {company ? 'Save changes' : 'Create company profile'}
                            </button>
                            {company && (
                                <button type="button" onClick={remove} className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300">
                                    <Trash2 className="h-4 w-4" /> Remove
                                </button>
                            )}
                        </div>
                    </form>
                )}
            </div>
        </AppLayout>
    );
}
