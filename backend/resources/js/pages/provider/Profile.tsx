import ProviderLayout from '@/layouts/ProviderLayout';
import { Head } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { statusTone } from '@/lib/lifecycle';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { NeedCategory } from '@/types';

interface Area {
    state: string;
    lga?: string;
    city?: string;
}

interface Profile {
    id?: string;
    display_name?: string;
    bio?: string | null;
    category_ids?: string[] | null;
    service_areas?: Area[] | null;
    qualifications?: string[] | null;
    evidence_urls?: string[] | null;
    status?: string;
    is_available?: boolean;
    review_note?: string | null;
    trial_started_at?: string | null;
    kyc_state?: string | null;
}

const input = 'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white';
const label = 'block text-sm font-medium text-gray-700 dark:text-gray-300';

/**
 * TODO 08/19 provider onboarding UI: declare capabilities, service areas
 * and qualifications, then submit for review. Identity stays with KYC
 * (shown, never collected here). Funnel: submitted → trial (N-23, watched
 * stage) → verified badge; approval describes live content only.
 */
export default function ProviderProfilePage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [categories, setCategories] = useState<NeedCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ display_name: '', bio: '' });
    const [picked, setPicked] = useState<string[]>([]);
    const [areas, setAreas] = useState<Area[]>([{ state: '' }]);
    const [qualifications, setQualifications] = useState('');
    const [evidence, setEvidence] = useState('');

    const load = () => {
        setLoading(true);
        Promise.all([
            api.get<{ data: Profile | null }>('/api/provider-profile').then((res) => {
                const p = res.data ?? null;
                setProfile(p);
                if (p) {
                    setForm({ display_name: p.display_name ?? '', bio: p.bio ?? '' });
                    setPicked(p.category_ids ?? []);
                    setAreas(p.service_areas?.length ? p.service_areas : [{ state: '' }]);
                    setQualifications((p.qualifications ?? []).join('\n'));
                    setEvidence((p.evidence_urls ?? []).join('\n'));
                }
            }),
            api.get<{ data: NeedCategory[] }>('/api/need-categories').then((res) => setCategories(res.data ?? [])),
        ])
            .catch(() => toast.error('Could not load profile'))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    // Categories arrive nested (parents with children) — flatten for picking.
    const flatCategories: NeedCategory[] = [];
    const flatten = (list: NeedCategory[]) => {
        for (const c of list ?? []) {
            flatCategories.push(c);
            if (c.children?.length) flatten(c.children);
        }
    };
    flatten(categories);

    const toggleCategory = (id: string) =>
        setPicked((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

    const save = async (submit: boolean) => {
        setSaving(true);
        try {
            const lines = (v: string) => v.split('\n').map((s) => s.trim()).filter(Boolean);
            await api.post('/api/provider-profile', {
                display_name: form.display_name,
                bio: form.bio || undefined,
                category_ids: picked.length ? picked : undefined,
                service_areas: areas.filter((a) => a.state.trim()).map((a) => ({
                    state: a.state.trim(),
                    lga: a.lga?.trim() || undefined,
                    city: a.city?.trim() || undefined,
                })),
                qualifications: lines(qualifications).length ? lines(qualifications) : undefined,
                evidence_urls: lines(evidence).length ? lines(evidence) : undefined,
                submit,
            });
            toast.success(submit ? 'Submitted for review.' : 'Draft saved.');
            load();
        } catch (e) {
            toast.error(errorMessage(e, 'Could not save'));
        } finally {
            setSaving(false);
        }
    };

    const setArea = (i: number, key: keyof Area, value: string) =>
        setAreas((prev) => prev.map((a, idx) => (idx === i ? { ...a, [key]: value } : a)));

    // N-27: pause switch — availability never touches vetting, so it is
    // its own endpoint and its own optimistic toggle.
    const toggleAvailability = async () => {
        const next = !(profile?.is_available !== false);
        setProfile((p) => (p ? { ...p, is_available: next } : p));
        try {
            const res = await api.post<{ data: Profile }>('/api/provider-profile/availability', { is_available: next });
            setProfile(res.data);
            toast.success(next ? 'You are visible to matching requests again.' : 'Paused — hidden from new matches.');
        } catch (e) {
            toast.error(errorMessage(e, 'Could not update availability'));
            load();
        }
    };

    return (
        <ProviderLayout title="Provider Profile">
            <Head title="Provider Profile" />
            <div className="mx-auto max-w-3xl space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Provider profile</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Tell customers what you do and where. Submitting sends your profile for review.
                    </p>
                </div>

                {profile && (
                    <>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(profile.status ?? '')}`}>
                                {profile.status}
                            </span>
                            <span className="text-gray-500">Identity (KYC): {profile.kyc_state ?? '—'}</span>
                            {profile.review_note && <span className="text-gray-500">Reviewer note: {profile.review_note}</span>}
                            {profile.status === 'trial' && (
                                <span className="text-amber-600 dark:text-amber-400">
                                    In trial since {profile.trial_started_at ? new Date(profile.trial_started_at).toLocaleDateString() : 'review'} —
                                    take on non-verified work while observed; the verified badge unlocks after approval.
                                </span>
                            )}
                            {profile.status === 'approved' && (
                                <span className="text-green-600 dark:text-green-400">✓ Verified provider</span>
                            )}
                        </div>

                        {/* N-27 live availability */}
                        <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                            <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">Available for new matches</p>
                                <p className="text-xs text-gray-500">
                                    When paused you drop out of matching and auto-match notifications. Approval is not affected.
                                </p>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={profile.is_available !== false}
                                aria-label="Available for new matches"
                                data-testid="availability-toggle"
                                onClick={toggleAvailability}
                                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                                    profile.is_available !== false ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                            >
                                <span
                                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                                        profile.is_available !== false ? 'left-6' : 'left-1'
                                    }`}
                                />
                            </button>
                        </div>
                    </>
                )}

                {loading ? (
                    <p className="text-sm text-gray-500">Loading…</p>
                ) : (
                    <div className="space-y-4 rounded border p-4 dark:border-gray-700">
                        <div>
                            <label className={label} htmlFor="pp-name">Display name *</label>
                            <input id="pp-name" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className={input} placeholder="e.g. Jane the Plumber" />
                        </div>
                        <div>
                            <label className={label} htmlFor="pp-bio">Bio</label>
                            <textarea id="pp-bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} className={input} />
                        </div>
                        <div>
                            <span className={label}>Service categories</span>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {flatCategories.map((c) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        aria-pressed={picked.includes(c.id)}
                                        onClick={() => toggleCategory(c.id)}
                                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                                            picked.includes(c.id) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                                        }`}
                                    >
                                        {c.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <span className={label}>Service areas</span>
                            {areas.map((a, i) => (
                                <div key={i} className="mt-2 grid grid-cols-3 gap-2">
                                    <input value={a.state} onChange={(e) => setArea(i, 'state', e.target.value)} placeholder="State" className={input} aria-label={`Area ${i + 1} state`} />
                                    <input value={a.lga ?? ''} onChange={(e) => setArea(i, 'lga', e.target.value)} placeholder="LGA" className={input} aria-label={`Area ${i + 1} LGA`} />
                                    <input value={a.city ?? ''} onChange={(e) => setArea(i, 'city', e.target.value)} placeholder="City" className={input} aria-label={`Area ${i + 1} city`} />
                                </div>
                            ))}
                            <button type="button" onClick={() => setAreas((p) => [...p, { state: '' }])} className="mt-2 text-sm font-medium text-indigo-600 hover:underline">
                                + Add area
                            </button>
                        </div>
                        <div>
                            <label className={label} htmlFor="pp-qual">Qualifications (one per line)</label>
                            <textarea id="pp-qual" value={qualifications} onChange={(e) => setQualifications(e.target.value)} rows={3} className={input} placeholder={'Trade Test II\nCity & Guilds'} />
                        </div>
                        <div>
                            <label className={label} htmlFor="pp-evidence">Evidence URLs (one per line)</label>
                            <textarea id="pp-evidence" value={evidence} onChange={(e) => setEvidence(e.target.value)} rows={2} className={input} placeholder="https://…" />
                        </div>
                        <div className="flex gap-2">
                            <button type="button" disabled={saving} onClick={() => save(false)} className="rounded border px-4 py-2 text-sm font-medium disabled:opacity-50">
                                Save draft
                            </button>
                            <button type="button" disabled={saving || !form.display_name.trim()} onClick={() => save(true)} className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                                Submit for review
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </ProviderLayout>
    );
}
